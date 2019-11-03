const mediator = new Mediator({triggers: SETTINGS.TRIGGER, names: SETTINGS.NAMES});
const game = new Game({mediator});
const ui = new UI({mediator});
const app = new App({mediator});
const ranking = new Ranking({mediator});

function Mediator(options) {

    const TRIGGERS = options.triggers || {};
    const NAMES = options.names || {};
    const triggers = {};

    this.getNames = () => {
        return NAMES
    };

    this.getTriggerTypes = () => {
        return TRIGGERS
    };

    this.callTrigger = (name, data) => {
        if(triggers[name] && triggers[name] instanceof Function) {
            return triggers[name](data)
        }
        return null
    }

    this.subscribe = (name, _func) => {
        if(name && _func instanceof Function) {
            triggers[name] = _func
        }
    }

    function init() {
        $.each(TRIGGERS, function (key, value) {
            triggers[key] = () => {return null}
        })
    }

    init();
}

function App(options) {
    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const _this = this;


    this.tabChange = (tabName) => {
        $('.screen').hide();
        $(tabName).show();
    }
    this.register = (username) => {
        let obj = new Player({mediator, username});
        mediator.callTrigger(TRIGGER.ADD_OBJECT, obj)
        mediator.callTrigger(TRIGGER.START_GAME, true)

    }
    function init() {
        mediator.subscribe(TRIGGER.REGISTER, _this.register.bind(this))
        mediator.subscribe(TRIGGER.TAB_CHANGE, _this.tabChange.bind(this))


        mediator.callTrigger(TRIGGER.REGISTER, 'sdf')
        mediator.callTrigger(TRIGGER.TAB_CHANGE, '.screen-game')
    }
    init();
}

function Game(options) {
    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const _this = this;

    let objects = [],
        isPower = false,
        canvas = document.getElementById('game-canvas'),
        ctx = canvas.getContext('2d');

    let settings = {
        canvasWidth: $(document).width(),
        canvasHeight: $(document).height(),
        canvasLeft: 0,
    };
    let resource = {
        cache: {},
    };

    this.addObject = (obj) => {
        if(objects.length < 1) {
            objects.push(new Background({mediator}));
        }
        objects.push(obj)
    };
    this.startGame = (data) => {
        isPower = data;
        canvas.width = settings.canvasWidth;
        canvas.height = settings.canvasHeight;

        this.updateScene();
    }
    this.endGame = (data) => {
        isPower = false;
        mediator.callTrigger(TRIGGER.RANKING, data)
    }
    this.updateScene = () => {
        if(isPower) {
            ctx.clearRect(0, 0, settings.canvasWidth, settings.canvasHeight);

            $.each(objects, function(k, v) {
                _this.drawObject(v)
            })

            setTimeout(_this.updateScene.bind(_this), 50)
        }
    }
    this.drawObject = (obj) => {
        let animations = obj.getAnimation();
        let current = animations.current;
        let animation = animations[current.name];
        let url = animation.url + current.number + animation.postfix;


        let nextAnimation = function() {
            if(current.number === animation.count) {
                if(current.callback && current.callback.hasOwnProperty('done')) {
                    current.callback.done(animation.count);
                }
                current.number = 1;
            } else {
                current.number++;
            }
        }
        let draw = function(image) {
            nextAnimation();
            animation.dwidth = animation.width / (animation.height / animation.dheight);
            let dy = settings.canvasHeight - animation.dheight;

            ctx.save();
            ctx.translate(current.left, dy);
            ctx.scale(current.direction, 1);

            ctx.drawImage(image, 0, 0, animation.dwidth * current.direction, animation.dheight);

            ctx.restore();

        }

        let image;
        if(resource.cache[url]) {
            image = resource.cache[url];
            draw(image);
        } else {
            image = new Image();
            image.onload = function() {
                resource.cache[url] = image;
                draw(image);
            }
            resource.cache[url] = false;
            image.src = url;
        }

    }

    this.getCanvasSettings = (data) => {
        return settings;
    }


    function init() {
        mediator.subscribe(TRIGGER.ADD_OBJECT, _this.addObject.bind(this))
        mediator.subscribe(TRIGGER.START_GAME, _this.startGame.bind(this))
        mediator.subscribe(TRIGGER.END_GAME, _this.endGame.bind(this))
        mediator.subscribe(TRIGGER.GET_CANVAS_SETTINGS, _this.getCanvasSettings.bind(this))

    }
    init();
}

function UI(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const _this = this;

    let keys = {
        LEFT: 65,
        RIGHT: 68,
        ONE: 49,
    };

    function init() {
        $('#register').on('submit', function() {
            let username = $('.username-input').val();
            if(username.length > 0) {
                mediator.callTrigger(TRIGGER.REGISTER, username)
                mediator.callTrigger(TRIGGER.TAB_CHANGE, '.screen-game')
            }
            return false;
        })
        $(document).on('keydown', function(e) {
            let keyCode = e.keyCode;
            switch (keyCode) {
                case keys.LEFT:
                    mediator.callTrigger(TRIGGER.MOVE_LEFT, 1)
                    break;
                case keys.RIGHT:
                    mediator.callTrigger(TRIGGER.MOVE_RIGHT, 1)
                    break;
                case keys.ONE:
                    mediator.callTrigger(TRIGGER.ATTACK_ONE, 1)
                    break;
            }
        })
        $(document).on('keyup', function(e) {

            mediator.callTrigger(TRIGGER.PLAYER_IDLE, 1)
        })
        $('.attack1').on('click', function (e) {
            let t = $(e.target);
            if(t.hasClass('disable')) return false;

            mediator.callTrigger(TRIGGER.ATTACK_ONE, 1)
        })
    }
    init();
}

function Player(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const NAMES = mediator.getNames();
    const _this = this;

    let username = options.username;
    let settings = {
        skill_active: false,
    };

    let animation = {
        idle: {
            url: '/animation/knight/idle/',
            postfix: '.png',
            count: 18,
            width: 1068,
            height: 1265,
            dheight: 355,
            dwidth: 0,
        },
        run: {
            url: '/animation/knight/run/',
            postfix: '.png',
            count: 17,
            width: 1372,
            height: 1347,
            dheight: 355,
            dwidth: 0,
        },
        attack1: {
            url: '/animation/knight/attack1/',
            postfix: '.png',
            count: 21,
            width: 1965,
            height: 1265,
            dheight: 355,
            dwidth: 0,
        },
        current: {
            name: 'idle',
            number: 1,
            left: 0,
            direction: NAMES.DIRECTION_RIGHT,
            callback: false,
        }
    }

    this.getAnimation = () => {
        return animation;
    }
    this.moveLeft = (data) => {
        if(data === 1) {
            _this.move(-10, NAMES.DIRECTION_LEFT)
        }
    }
    this.moveRight = (data) => {
        if(data === 1) {
            _this.move(10, NAMES.DIRECTION_RIGHT)
        }
    }
    this.move = (data, direction = false) => {
        if(settings.skill_active) return;

        let c = animation.current;

        let canvas = mediator.callTrigger(TRIGGER.GET_CANVAS_SETTINGS, 1);

        if (c.left > canvas.canvasWidth / 2 - 100) {
            if (canvas.canvasLeft < 0) {
                c.left += data;
            }
            if (canvas.canvasLeft > NAMES.MAX_CANVAS_WIDTH) {
                c.left += data;
            } else {
                canvas.canvasLeft += data;
            }
        } else {
            c.left += data;
        }
        if (c.left > canvas.canvasWidth - 100) {
            mediator.callTrigger(TRIGGER.END_GAME, {})
        }
        if(direction) {
            c.direction = direction;
        }
        _this.setAnimation('run')
    }
    this.idle = (data) => {
        if(settings.skill_active) return;

        _this.setAnimation('idle')
    }
    this.setAnimation = (name, cb = false) => {

        if(animation.current.name === name) {
            return;
        }

        let c = animation.current;
        c.name = name;
        c.number = 1;
        c.callback = cb;
    }
    this.attackOne = (data) => {
        if(settings.skill_active) return;

        if(data === 1) {
            let cb = {
                done: function(msg) {
                    settings.skill_active = false;
                    $('.attack1').removeClass('disable');
                    _this.setAnimation('idle');
                }
            };
            _this.setAnimation('attack1', cb);
            $('.attack1').addClass('disable');

            settings.skill_active = true;
        }
    }

    function init() {
        $('.user-info').html(username)

        mediator.subscribe(TRIGGER.MOVE_LEFT, _this.moveLeft.bind(this))
        mediator.subscribe(TRIGGER.MOVE_RIGHT, _this.moveRight.bind(this))
        mediator.subscribe(TRIGGER.ATTACK_ONE, _this.attackOne.bind(this))
        mediator.subscribe(TRIGGER.PLAYER_IDLE, _this.idle.bind(this))
    }
    init();
}

function Background(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const NAMES = mediator.getNames();
    const _this = this;

    let animation = {
        idle: {
            url: '/animation/bg/',
            postfix: '.png',
            count: 1,
            width: 9000,
            height: 1265,
            dheight: 1265,
            dwidth: 0,
        },
        current: {
            name: 'idle',
            number: 1,
            left: 0,
            direction: NAMES.DIRECTION_RIGHT,
            callback: false,
        }
    }

    this.getAnimation = () => {
        return animation;
    }
    this.idle = (data) => {
        _this.setAnimation('idle')
    }
    this.setAnimation = (name, cb = false) => {

        if(animation.current.name === name) {
            return;
        }

        let c = animation.current;
        c.name = name;
        c.number = 1;
        c.callback = cb;
    }

    function init() {
        let canvas = mediator.callTrigger(TRIGGER.GET_CANVAS_SETTINGS, 1);
        animation.idle.height = canvas.canvasHeight;
        animation.idle.dheight = canvas.canvasHeight;

        mediator.subscribe(TRIGGER.BACKGROUND_IDLE, _this.idle.bind(this))
    }
    init();
}


function Ranking(options) {
    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const _this = this;


    this.ranking = (data) => {
        mediator.callTrigger(TRIGGER.TAB_CHANGE, '.screen-ranking')
    }
    function init() {
        mediator.subscribe(TRIGGER.RANKING, _this.ranking.bind(this))

    }
    init();
}
