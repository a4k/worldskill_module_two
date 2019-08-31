var app = {}; // Общий контейнер
// Состояния
app.States = {
    game: 0,
};

// Приложение
var Application = (function () {

    let container = $('body'),

        ClassName = {
            SHOW: 'show',
        },

        settings = {};

    return {
        start: function () {

            // Ожидание регистрации
            app.Register.start(this.onRegisterCallback.bind(this));
        },

        // При регистрации
        onRegisterCallback: function (username) {

            this.switchTab('game');

            app.Game.start(username, this.onGameCallback);
        },

        // При получении события из игры
        onGameCallback: function (event) {


        },

        switchTab: function(tabName) {
            container.find('.screen').removeClass(ClassName.SHOW);

            let tabs = {
                game: '.screen-game',
            };

            $(tabs[tabName]).addClass(ClassName.SHOW);
        }
    };
}());

// Регистрация
app.Register = (function () {

    let container = $(document).find('#register'),
        input = container.find('.username-input'),
        callback = false;

    return {
        start: function (cb = false) {
            callback = cb;
            container.on('submit', this.onSubmitForm.bind(this));

            this.testData();
        },

        testData: function() {
            input.val('sdf');

            container.trigger('submit');
        },

        onSubmitForm: function(e) {
            e.preventDefault();

            let username = input.val();

            if(callback) {
                callback(username);
            }

            return false;
        }

    };
}());


// Игра
app.Game = (function () {

    let container = $('#game'),

        callback = false,
        objects = [],

        TYPES = {
            PLAYER: 'player',
            ENEMY: 'enemy',
        },

        gameCanvas = document.getElementById('game-canvas'),
        ctx = gameCanvas.getContext('2d'),

        canvas = {
            width: $(document).width(),
            height: $(document).height(),
            images: {},
            frames: {}, // хранение текущего кадра
            cache: {}, // кэш для спрайтов
        },

        sprites = {
            player: {
                idle: {
                    url: '/animation/knight/sprites/idle/idle00',
                    count: 18,
                    width: 1068,
                    height: 1265,
                    dheight: 355,
                }
            }
        },

        settings = {
            states: {
                PLAYING: 1,
                STOP: 2,
            },
            N: 0,
            UPDATE_TIMEOUT: 50,
        };

    return {
        start: function (username, cb = false) {
            callback = cb;

            this.setState(settings.states.PLAYING);
            this.add(TYPES.PLAYER, username);

            gameCanvas.width = canvas.width;
            gameCanvas.height = canvas.height;


            setInterval(() => {
                requestAnimationFrame(this.updateScene.bind(this));
            }, settings.UPDATE_TIMEOUT);
        },

        // Установить состояния
        setState: function(state) {
            app.States.game = state;
        },

        // Получить состояние
        getState: function() {
            return app.States.game;
        },

        // Добавление объекта на сцену
        add: function (type, name) {

            switch (type) {
                case TYPES.PLAYER:
                    let player = new Player().setName(name);
                    objects.push(player);
                    break;
                case TYPES.ENEMY:

                    break;
            }
        },

        // Обновление сцены
        updateScene: function () {
            if(this.getState() === settings.states.STOP) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Получение спрайта
            let getSprite = (objectType, animationType) => {
                 return sprites[objectType][animationType];
            };

            // Отрисовка спрайта
            let draw = (objectType, animationType) => {

                let sprite = canvas.images[objectType][animationType],
                    spriteInfo = getSprite(objectType, animationType),
                    topOffset = canvas.height - spriteInfo.dheight,
                    dwidth = spriteInfo.width / (spriteInfo.height / spriteInfo.dheight);

                ctx.drawImage(sprite, 0, 0, spriteInfo.width, spriteInfo.height, 0, topOffset, dwidth, spriteInfo.dheight);

            };

            // Отрисовка игрока
            let drawPlayer = (x, y, type) => {

                if(!canvas.images.hasOwnProperty(TYPES.PLAYER)) {

                    canvas.frames[TYPES.PLAYER] = {};
                    canvas.images[TYPES.PLAYER] = {};

                }
                let playerFrames = canvas.frames[TYPES.PLAYER],
                    playerImages = canvas.images[TYPES.PLAYER];

                if(!playerImages.hasOwnProperty(type)) {

                    playerFrames[type] = {number: 1};
                    playerImages[type] = {};
                }


                let url = getSpriteUrl({
                    objectType: TYPES.PLAYER,
                    animationType: type,
                    number: playerFrames[type].number
                });

                let spriteCache = getCacheSprite(url);
                if(spriteCache) {

                    draw(TYPES.PLAYER, type);

                } else {
                    spriteCache = new Image();
                    spriteCache.src = url;
                    spriteCache.onload = function() {
                        draw(TYPES.PLAYER, type);
                    };

                    setCacheSprite(url, spriteCache);
                }

                playerImages[type] = spriteCache;

                nextImage(TYPES.PLAYER, type);
            };

            // Получение ссылки на спрайт
            let nextImage = (objectType, animationType) => {

                let frame = canvas.frames[objectType][animationType],
                    sprite = getSprite(objectType, animationType);

                if(frame.number >= sprite.count) {
                    frame.number = 1;
                    return;
                }
                frame.number++;

            };

            // Сохранить спрайт в кэш
            let setCacheSprite = (url, value) => {
                canvas.cache[url] = value;
            };

            // Получить спрайт из кэша
            let getCacheSprite = (url) => {
                if(canvas.cache.hasOwnProperty(url)) {
                    return canvas.cache[url];
                }
                return false;
            };

            // Получение ссылки на спрайт
            let getSpriteUrl = (arParams) => {
                let sprite = getSprite(arParams.objectType, arParams.animationType),
                    formatNumber = (n) => {
                        if (n < 10) return "0" + n;
                        return n;
                    };
                let url = sprite.url + formatNumber(arParams.number) + '.png';
                return url;

            };

            // Обработка объектов сцены
            objects.map(function (value, i) {
                let isPlayer = value instanceof Player;

                let animation = value.getAnimation(),
                    x = animation.x,
                    y = animation.y,
                    type = animation.type;

                if (isPlayer) drawPlayer(x, y, type);
            });


        },

        finish: function () {

        },

    };
}());

// Игрок
function Player() {

    let name,

        animation = {
            x: 0,
            y: 0,
            type: 'idle',
        },

        settings = {
            x: 0,
            y: 0,
        };

    this.setName = function (uname) {

        name = uname;

        return this;
    };
    this.setAnimation = (x, y) => {
        animation.x = x;
        animation.y = y;
    };
    this.getAnimation = () => {
        return animation;
    }
}

// Запуск приложения
Application.start();
