var app = {}; // Common container

// Состояния
app.States = {
    game: 0,
};

const NAMES = {
    LEFT_SIDE: 'left_side',
    RIGHT_SIDE: 'right_side',

    PLAYER: 'player',
    ENEMY: 'enemy',

    // animation
    PLAYER_IDLE: 'idle',
    PLAYER_RUN: 'run',

    // callback
    MOVE: 'MOVE',
    MOVE_END: 'MOVE_END',
    CHANGE_SIDE: 'CHANGE_SIDE',
    DRAW_SPRITE: 'DRAW_SPRITE',
    REGISTER: 'REGISTER',
    FINISH: 'FINISH',

    //tabs
    TAB_GAME: '.screen-game',
    SHOW: 'show',
};

const SPRITES = {
    player: {
        idle: {
            url: '/animation/knight/idle/',
            count: 18,
            width: 1068,
            height: 1265,
            dheight: 355,
        },
        run: {
            url: '/animation/knight/run/',
            count: 17,
            width: 1372,
            height: 1347,
            dheight: 355,
        },
    }
};


// Приложение
var Application = (function () {

    let container = $('body');

    return {
        start: function () {
            // Ожидание регистрации
            app.Register.start(this.onCallback.bind(this));
        },

        // При получении события из игры
        onCallback: function (type, value) {
            switch(type) {

                // При регистрации
                case NAMES.REGISTER:

                    let username = value;
                    this.switchTab(NAMES.TAB_GAME);
                    app.Game.start(username, this.onCallback.bind(this));

                    break;
                case NAMES.FINISH:

                    break;
            }

        },

        switchTab: function (tabName) {
            container.find('.screen').removeClass(NAMES.SHOW);

            $(tabName).addClass(NAMES.SHOW);
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

        testData: function () {
            input.val('sdf');

            container.trigger('submit');
        },

        onSubmitForm: function (e) {
            e.preventDefault();

            let username = input.val();

            if (callback) {
                callback(NAMES.REGISTER, username);
            }

            return false;
        }

    };
}());

// Игра
app.Game = (function () {

    let callback = false,
        objects = [],

        gameCanvas = document.getElementById('game-canvas'),
        ctx = gameCanvas.getContext('2d'),

        canvas = {
            width: $(document).width(),
            height: $(document).height(),
            images: {},
            frames: {}, // хранение текущего кадра
            cache: {}, // кэш для спрайтов
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
            this.add(NAMES.PLAYER, username);

            gameCanvas.width = canvas.width;
            gameCanvas.height = canvas.height;

            app.SpriteManager.init(this.onCallback.bind(this));

            setInterval(() => {
                requestAnimationFrame(this.updateScene.bind(this));
            }, settings.UPDATE_TIMEOUT);
        },

        // Установить состояния
        setState: function (state) {
            app.States.game = state;
        },

        // Получить состояние
        getState: function () {
            return app.States.game;
        },

        // Добавление объекта на сцену
        add: function (type, name) {

            switch (type) {
                case NAMES.PLAYER:
                    let player = new Player().setName(name);
                    objects.push(player);
                    player.initMover();
                    break;
                case NAMES.ENEMY:

                    break;
            }
        },

        onCallback: function(key, value) {
            switch (key) {
                case NAMES.DRAW_SPRITE:
                    this.draw(value);
                    break;
            }
        },

        // Обновление сцены
        updateScene: function () {
            if (this.getState() === settings.states.STOP) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Обработка объектов сцены
            objects.map(function (value, i) {
                let isPlayer = value instanceof Player;

                let animation = value.getAnimation(),
                    position = value.getPosition();

                let params = $.extend({}, animation, position);
                if (isPlayer) {
                    params.objectType = NAMES.PLAYER;
                }
                app.SpriteManager.draw(params);
            });


        },

        // Отрисовка спрайта
        draw: function(params) {
            let topOffset = canvas.height - params.dheight;

            ctx.drawImage(params.sprite, 0, 0, params.width, params.height, params.x, topOffset, params.dwidth, params.dheight);

        },

        finish: function () {

        },

    };
}());

app.SpriteManager = (function () {
    let callback = false,

        frames = {}, // хранение текущего кадра
        cache = {}, // кэш для спрайтов
        settings = {};

    return {
        init: function(cb) {
            callback = cb;
        },

        draw: function (params) {

            let type = params.type,
                object = params.objectType,
                _this = this;

            if (!frames.hasOwnProperty(object)) {
                frames[object] = {};
            }

            let objFrames = frames[object];

            if (!objFrames.hasOwnProperty(type)) {
                objFrames[type] = {
                    number: 1,
                };
            }

            objFrames.X = params.x;
            objFrames.Y = params.y;


            let url = this.getSpriteUrl({
                objectType: object,
                animationType: type,
                number: objFrames[type].number,
            });

            let spriteCache = this.getCacheSprite(url);
            if (spriteCache) {
                this.drawOnScene(object, type);

            } else {
                spriteCache = new Image();
                spriteCache.src = url;
                spriteCache.onload = function () {
                    _this.drawOnScene(object, type);
                };

                this.setCacheSprite(url, spriteCache);
            }

            objFrames[type].image = spriteCache;

            this.nextImage(object, type);
        },

        // Получение ссылки на спрайт
        getSpriteUrl: function(arParams) {
            let sprite = this.getSprite(arParams.objectType, arParams.animationType);
            return sprite.url + arParams.number + '.png';
        },

        // Получение спрайта
        getSprite: function (objectType, animationType) {
            return SPRITES[objectType][animationType];
        },

        // Получить спрайт из кэша
        getCacheSprite: function(url) {
            if (cache.hasOwnProperty(url)) {
                return cache[url];
            }
            return false;
        },

        // Отрисовать на сцене
        drawOnScene: function(objectType, animationType) {
            if (callback) {
                let sprite = frames[objectType][animationType].image,
                    spriteInfo = this.getSprite(objectType, animationType),
                    position = this.getPosition(objectType),
                    dwidth = spriteInfo.width / (spriteInfo.height / spriteInfo.dheight);

                let params = {
                    sprite: sprite,
                    width: spriteInfo.width,
                    height: spriteInfo.height,
                    x: position.x,
                    y: position.y,
                    dwidth: dwidth,
                    dheight: spriteInfo.dheight,
                };

                callback(NAMES.DRAW_SPRITE, params);
            }
        },

        // Получение координат объекта
        getPosition: function(objectType) {
            let object = frames[objectType];
            return {
                x: object.X,
                y: object.Y,
            }
        },

        // Сохранить спрайт в кэш
        setCacheSprite: function(url, value) {
            cache[url] = value;
        },

        // Получение ссылки на спрайт
        nextImage: function(objectType, animationType) {

            let frame = frames[objectType][animationType],
                sprite = this.getSprite(objectType, animationType);

            if (frame.number >= sprite.count) {
                frame.number = 1;
                return;
            }
            frame.number++;

        },
    }
}());

// Игрок
function Player() {

    let name,

        animation = {
            x: 0,
            y: 0,
            type: 'idle',
            side: NAMES.RIGHT_SIDE,
        },
        mover = {},

        settings = {
            x: 0,
            y: 0,
        };

    this.setName = function (uname) {

        name = uname;

        return this;
    };
    this.setAnimation = (s) => {
        animation = s;
    };
    this.getAnimation = () => {
        return Object.assign({}, animation);
    };
    this.getPosition = () => {
        return {x: settings.x, y: settings.y};
    };

    this.initMover = () => {
        mover = new PlayerMove();
        mover.setXY(settings.x, settings.y);
        mover.init(this.onCallback.bind(this));
    };
    this.onCallback = (key, value) => {
        switch (key) {
            case NAMES.MOVE:
                animation.type = NAMES.PLAYER_RUN;
                settings.x = value.x;
                break;
            case NAMES.CHANGE_SIDE:
                animation.side = value;
                break;
            case NAMES.MOVE_END:
                animation.type = NAMES.PLAYER_IDLE;
                break;
        }
    }
}

function PlayerMove() {
    let KEY = {
            LEFT: 65,
            RIGHT: 68,
        },
        callback = false,
        settings = {
            speed: 10,
            x: 0,
            y: 0,
        };

    return {
        init: function (cb) {
            callback = cb;

            $(document).on('keydown', this.onKeyDown.bind(this));
            $(document).on('keyup', this.onKeyUp.bind(this));
        },
        setXY: function (x, y) {
            settings.x = x;
            settings.y = y;
        },
        onKeyDown: function (e) {
            let code = e.keyCode;

            console.log(code);

            switch (code) {
                case KEY.LEFT:
                    this.moveLeft();
                    break;
                case KEY.RIGHT:
                    this.moveRight();
                    break;
            }
        },
        onKeyUp: function (e) {

            if (callback) {
                callback(NAMES.MOVE_END, false);
            }
        },
        moveLeft: function () {
            this.move(settings.speed * -1)
        },
        moveRight: function () {
            this.move(settings.speed * 1)
        },
        move: function (distance) {
            if (callback) {
                settings.x += distance;
                callback(NAMES.MOVE, {x: settings.x, y: settings.y});
            }
        },
    }
}

// Запуск приложения
Application.start();
