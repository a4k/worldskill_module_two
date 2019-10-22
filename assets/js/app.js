var app = {}; // Common container

// Состояния
app.States = {
    game: 0,
};

const NAMES = {
    LEFT_SIDE: 'left_side',
    RIGHT_SIDE: 'right_side',
    ATTACK_SWORD: 'ATTACK_SWORD',

    PLAYER: 'player',
    ENEMY: 'enemy',
    BACKGROUND: 'background',

    // animation
    PLAYER_IDLE: 'idle',
    PLAYER_RUN: 'run',
    PLAYER_ATTACK: 'attack1',
    BACKGROUND_IDLE: 'idle',

    // callback
    MOVE: 'MOVE',
    MOVE_END: 'MOVE_END',
    CHANGE_SIDE: 'CHANGE_SIDE',
    DRAW_SPRITE: 'DRAW_SPRITE',
    REGISTER: 'REGISTER',
    FINISH: 'FINISH',
    UPDATE_TIMER: 'UPDATE_TIMER',
    MAP_END: 'MAP_END',

    //tabs
    TAB_GAME: '.screen-game',
    TAB_RANK: '.screen-ranking',
    SHOW: 'show',
    TIMER_VALUE: '.timer-value',
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
        attack1: {
            url: '/animation/knight/attack1/',
            count: 21,
            width: 1372,
            height: 1265,
            dheight: 355,
        },
    },
    background: {
        idle: {
            url: '/assets/img/bg-game.png',
            count: 1,
            width: 1068,
            height: 1265,
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
                    this.switchTab(NAMES.TAB_RANK);
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
            left: 0,
            maxLeft: 3000,
        },

        result = {
            time: 0,
            final_time: 0,
        },

        settings = {
            states: {
                PLAYING: 1,
                STOP: 2,
            },
            UPDATE_TIMEOUT: 50,
        };

    return {
        start: function (username, cb = false) {
            callback = cb;

            this.setState(settings.states.PLAYING);
            this.add(NAMES.BACKGROUND, username);
            this.add(NAMES.PLAYER, username);

            gameCanvas.width = canvas.width;
            gameCanvas.height = canvas.height;

            app.SpriteManager.init(this.onCallback.bind(this));
            app.Timer.start(this.onCallback.bind(this));
            app.GameUI.init(this.onCallback.bind(this));

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
                case NAMES.BACKGROUND:

                    let s = SPRITES[NAMES.BACKGROUND][NAMES.BACKGROUND_IDLE];
                    s.width = canvas.width;
                    s.height = canvas.height;
                    s.dheight = s.height;

                    let bg = new Background().setName(name);
                    objects.push(bg);
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
                case NAMES.UPDATE_TIMER:
                    this.renderTimer(value);
                    break;
                case NAMES.MAP_END:
                    this.finish(value);
                    break;
                case NAMES.ATTACK_SWORD:
                    objects.map(function(v, i) {
                        if(v instanceof Player) {
                            v.attackSword(value);
                        }
                    });
                    break;
            }
        },

        // Обновление сцены
        updateScene: function () {
            let _this = this;

            if (this.getState() === settings.states.STOP) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Обработка объектов сцены
            objects.map(function (value, i) {
                let isPlayer = value instanceof Player;
                let isBg = value instanceof Background;

                let animation = value.getAnimation(),
                    position = value.getPosition();

                let params = $.extend({}, animation, position);
                if (isPlayer) {
                    params.objectType = NAMES.PLAYER;
                    position = _this.calcPlayerPosition(position);
                    params = $.extend({}, params, position);
                }
                if(isBg) {
                    params.objectType = NAMES.BACKGROUND;
                    position = _this.calcBackgroundPosition(position);
                    params = $.extend({}, params, position);
                }

                app.SpriteManager.draw(params);
            });


        },

        // Посчитать позицию игрока
        calcPlayerPosition: function (position, callback) {
            let center = canvas.width / 2;
            let isMiddle = position.x > center;
            let isEnd = position.x >= canvas.maxLeft;

            if(isEnd) {
                if(position.x > canvas.width - 300) {
                    this.onCallback(NAMES.MAP_END, true)
                }

            } else if(isMiddle) {
                let pLeft = position.x - center;
                position.x -= pLeft;
                canvas.left = pLeft;
            }
            return position;
        },

        // Посчитать позицию фона
        calcBackgroundPosition: function (position) {
            position.sx = canvas.left;
            return position;
        },

        // Отрисовка спрайта
        draw: function(params) {
            let info = params.info;
            let topOffset = canvas.height - info.dheight;

            let sx = params.sx || 0;
            ctx.drawImage(info.sprite, sx, 0, info.width, info.height, params.x, topOffset, info.dwidth, info.dheight);

        },

        // Вывод времени в формате mm:ss
        renderTimer: function(value) {
            let finalTime = app.Timer.getFinalTime(value);

            $(NAMES.TIMER_VALUE).text(finalTime);
        },

        finish: function (value) {
            if(this.getState() === settings.states.PLAYING) {
                this.setState(settings.states.STOP);

                result.time = app.Timer.get();
                result.final_time = app.Timer.getFinalTime(result.time);
                app.Timer.stop();
                callback(NAMES.FINISH, value)
            }
        },

    };
}());

// Управление спрайтами
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

            let animationType = params.animationType,
                objectType = params.objectType,
                _this = this;

            if (!frames.hasOwnProperty(objectType)) {
                frames[objectType] = {};
            }

            let objFrames = frames[objectType];

            if (!objFrames.hasOwnProperty(animationType)) {
                objFrames[animationType] = {
                    number: 1,
                };
            }

            objFrames.X = params.x;
            objFrames.Y = params.y;
            params.number = objFrames[animationType].number;
            params.info = this.getSprite(params);


            let url = this.getSpriteUrl(params);

            let spriteCache = this.getCacheSprite(url);
            if (spriteCache) {
                this.drawOnScene(params);

            } else {
                spriteCache = new Image();
                spriteCache.src = url;
                spriteCache.onload = function () {
                    _this.drawOnScene(params);
                };

                this.setCacheSprite(url, spriteCache);
            }

            objFrames[animationType].image = spriteCache;

            this.nextImage(params);
        },

        // Получение ссылки на спрайт
        getSpriteUrl: function(arParams) {
            let sprite = arParams.info;

            if(sprite.hasOwnProperty('count') && sprite.count === 1) {
                return sprite.url;
            }
            return sprite.url + arParams.number + '.png';
        },

        // Получение спрайта
        getSprite: function (params) {
            return SPRITES[params.objectType][params.animationType];
        },

        // Получить спрайт из кэша
        getCacheSprite: function(url) {
            if (cache.hasOwnProperty(url)) {
                return cache[url];
            }
            return false;
        },

        // Отрисовать на сцене
        drawOnScene: function(params) {

            let spriteInfo = params.info;

            params.info.sprite = this.getCacheImage(params);
            params.info.dwidth = spriteInfo.width / (spriteInfo.height / spriteInfo.dheight);

            callback(NAMES.DRAW_SPRITE, params);
        },

        getCacheImage: function(params) {
            return frames[params.objectType][params.animationType].image;
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
        nextImage: function(params) {

            let frame = frames[params.objectType][params.animationType],
                sprite = this.getSprite(params);

            if (frame.number >= sprite.count) {
                frame.number = 1;
                return;
            }
            frame.number++;

        },
    }
}());

// Таймер
app.Timer = (function() {
    let timer = 0,
        callback = false,
        object = false,
        enabled = false;

    return {
        start: function(cb) {
            if(enabled) return;
            if(cb) callback = cb;

            let _this = this;
            object = setInterval(function () {
                _this.update();
            }, 1000);
        },
        update: function() {
            timer++;
            if(callback) {
                callback(NAMES.UPDATE_TIMER, timer);
            }
        },
        pause: function() {
            enabled = false;
            clearInterval(object);
        },
        stop: function() {
            this.pause();
            timer = 0;
        },
        get: function() {
            return timer;
        },
        getFinalTime: function(value) {
            let finalTime = '';
            if(value > 60) {
                let hours = Math.round(value / 60),
                    minutes = value - hours * 60;
                finalTime = hours + ':' + minutes;
            } else {
                if(value < 10) {
                    finalTime = '00:0' + value;
                } else {
                    finalTime = '00:' + value;
                }
            }
            return finalTime;
        },
    };
})();

// Фон
function Background() {

    let name,

        animation = {
            x: 0,
            y: 0,
            animationType: NAMES.BACKGROUND_IDLE,
            side: NAMES.RIGHT_SIDE,
        },

        settings = {
            sx: 0,
            x: 0,
            y: 0,
        };

    this.setName = function (uname) {
        name = uname;

        return this;
    };
    this.getAnimation = () => {
        return Object.assign({}, animation);
    };
    this.getPosition = () => {
        return {x: settings.x, y: settings.y};
    };
}

// Игрок
function Player() {

    let name,

        animation = {
            x: 0,
            y: 0,
            animationType: NAMES.PLAYER_IDLE,
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
    this.attackSword = (value) => {
        mover.attackSword();
        setTimeout(function() {
            mover.idle();
        }, 1000)
    };
    this.onCallback = (key, value) => {
        switch (key) {
            case NAMES.MOVE:
                animation.animationType = NAMES.PLAYER_RUN;
                settings.x = value.x;
                break;
            case NAMES.CHANGE_SIDE:
                animation.side = value;
                break;
            case NAMES.MOVE_END:
                animation.animationType = NAMES.PLAYER_IDLE;
                break;
            case NAMES.ATTACK_SWORD:
                animation.animationType = NAMES.PLAYER_ATTACK;
                break;
        }
    }
}

function PlayerMove() {
    let KEY = {
            LEFT: 65,
            RIGHT: 68,
            ONE: 49,
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
                case KEY.ONE:
                    this.attackSword();
                    break;
            }
        },
        onKeyUp: function (e) {
            if (callback) {
                this.idle();
            }
        },
        idle: function() {
            callback(NAMES.MOVE_END, false);
        },
        moveLeft: function () {
            callback(NAMES.CHANGE_SIDE, NAMES.LEFT_SIDE);
            this.move(settings.speed * -1)
        },
        moveRight: function () {
            callback(NAMES.CHANGE_SIDE, NAMES.RIGHT_SIDE);
            this.move(settings.speed * 1)
        },
        attackSword: function () {
            callback(NAMES.ATTACK_SWORD, true);
        },
        move: function (distance) {
            settings.x += distance;
            callback(NAMES.MOVE, {x: settings.x, y: settings.y});
        },
    }
}

// Пользовательский интерфейс
app.GameUI = (function () {
    let callback = false,
        settings = {};

    return {
        init: function (cb) {
            callback = cb;

            $('body').on('click', '.attack1', this.onAttackSword.bind(this));
        },
        onAttackSword: function(e) {
            callback(NAMES.ATTACK_SWORD, true)
        },
    }
})();

// Запуск приложения
Application.start();
