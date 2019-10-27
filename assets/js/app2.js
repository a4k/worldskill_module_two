const mediator = new Mediator({triggers: SETTINGS.TRIGGER});
const game = new Game({mediator});
const ui = new UI({mediator});
const app = new App({mediator});

function Mediator(options) {

    const TRIGGERS = options.triggers || {};
    const triggers = {};

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
    };
    let resource = {
        cache: {},
    }

    this.addObject = (obj) => {
        objects.push(obj)
    };
    this.startGame = (msg) => {
        isPower = msg;
        canvas.width = settings.canvasWidth;
        canvas.height = settings.canvasHeight;

        this.updateScene();
    }
    this.updateScene = () => {
        if(isPower) {
            ctx.clearRect(0, 0, settings.canvasWidth, settings.canvasHeight)

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
                current.number = 1;
            } else {
                current.number++;
            }
        }
        let draw = function(image) {
            nextAnimation();
            animation.dwidth = animation.width / (animation.height / animation.dheight);
            let dy = settings.canvasHeight - animation.dheight;
            ctx.drawImage(image, current.dx, 0, animation.width, animation.height, current.left, dy, animation.dwidth, animation.dheight)
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


    function init() {
        mediator.subscribe(TRIGGER.ADD_OBJECT, _this.addObject.bind(this))
        mediator.subscribe(TRIGGER.START_GAME, _this.startGame.bind(this))

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
            }
        })
        $(document).on('keyup', function(e) {

            mediator.callTrigger(TRIGGER.PLAYER_IDLE, 1)
        })
    }
    init();
}

function Player(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const _this = this;

    let username = options.username;

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
        current: {
            name: 'idle',
            number: 1,
            dx: 0,
            left: 0,
        }
    }

    this.getAnimation = () => {
        return animation;
    }
    this.moveLeft = (data) => {
        if(data === 1) {
            _this.move(-10)
        }
    }
    this.moveRight = (data) => {
        if(data === 1) {
            _this.move(10)
        }
    }
    this.move = (data) => {
        let c = animation.current;
        c.left += data;
        _this.setAnimation('run')
    }
    this.idle = (data) => {
        _this.setAnimation('idle')
    }
    this.setAnimation = (name) => {
        let c = animation.current;
        animation.current = {
            name: name,
            number: 1,
            dx: 0,
            left: c.left,
        }
    }

    function init() {
        $('.user-info').html(username)

        mediator.subscribe(TRIGGER.MOVE_LEFT, _this.moveLeft.bind(this))
        mediator.subscribe(TRIGGER.MOVE_RIGHT, _this.moveRight.bind(this))
        mediator.subscribe(TRIGGER.PLAYER_IDLE, _this.idle.bind(this))
    }
    init();
}
