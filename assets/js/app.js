var app = {}; // Общий контейнер


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

        };

    return {
        start: function (username, cb = false) {
            callback = cb;

            this.add(TYPES.PLAYER, username);

            gameCanvas.width = canvas.width;
            gameCanvas.height = canvas.height;

            this.updateScene();
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

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Получение спрайта
            let getSprite = (objectType, animationType) => {
                 return sprites[objectType][animationType];
            };

            // Отрисовка спрайта
            let draw = (objectType, animationType) => {

                let sprite = canvas.images[objectType][animationType];
                let spriteInfo = getSprite(objectType, animationType);

                let topOffset = canvas.height - spriteInfo.dheight;

                let dwidth = spriteInfo.width / (spriteInfo.height / spriteInfo.dheight);

                ctx.drawImage(sprite, 0, 0, spriteInfo.width, spriteInfo.height, 0, topOffset, dwidth, spriteInfo.dheight);


            };

            // Отрисовка игрока
            let drawPlayer = (x, y, type) => {

                let sprite = getSprite(TYPES.PLAYER, type);
                if(!canvas.images.hasOwnProperty(TYPES.PLAYER)) {

                    let obj = {};
                    obj[type] = {number: 1};
                    canvas.frames[TYPES.PLAYER] = obj;

                    let number = obj[type].number;
                    if(number < 10) number = "0" + number;

                    let imageObj = {};
                    imageObj[type] = new Image();
                    imageObj[type].src = sprite.url + number + '.png';
                    imageObj[type].onload = function() {
                        draw(TYPES.PLAYER, type);
                    };

                    canvas.images[TYPES.PLAYER] = imageObj;


                }
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
    }
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
