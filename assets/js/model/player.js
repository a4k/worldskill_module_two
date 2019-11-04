
function Player(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const NAMES = mediator.getNames();
    const _this = this;

    let username = options.username;
    let settings = {
        skill_active: false,
    };

    let person = {
        damage: 15,
        hp: 100,
        mp: 100,
        maxHp: 100,
        maxMp: 100,
        kills: 0,
    }
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
    this.getPerson = () => {
        return person;
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
            if (canvas.canvasLeft > 0) {
                canvas.canvasLeft += data;
            } else {
                c.left += data;
            }
        }
        if (c.left < 0) {
            c.left = 0;
        }
        if (c.left > canvas.canvasWidth - 100) {
            mediator.callTrigger(TRIGGER.END_GAME, {})
        }
        if(direction) {
            c.direction = direction;
        }
        _this.setAnimation('run')

        mediator.callTrigger(TRIGGER.UPDATE_PURPOSE);
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

                    let enemies = mediator.callTrigger(TRIGGER.GET_ENEMIES);
                    let canvas = mediator.callTrigger(TRIGGER.GET_CANVAS_SETTINGS);

                    $.each(enemies, function (k, v) {
                        if(v) {
                            let enemy = v.getAnimation();
                            let myLeft = animation.current.left;
                            let enemyLeft = enemy.current.left - canvas.canvasLeft;
                            if(animation.current.direction === NAMES.DIRECTION_RIGHT) {
                                if(enemyLeft < myLeft + 600 && enemyLeft > myLeft - 200) {
                                    v.damage(_this.getPerson());
                                }
                            } else {
                                if(enemyLeft > myLeft - 600 && enemyLeft < myLeft + 200) {
                                    v.damage(_this.getPerson());
                                }
                            }
                        }
                    })
                }
            };
            _this.setAnimation('attack1', cb);
            $('.attack1').addClass('disable');

            settings.skill_active = true;

        }
    }
    this.damage = (data) => {
        person.hp -= data.damage;
        let percent = Math.round(person.hp / person.maxHp * 100);

        let hp = $('.panel-xp');
        hp.find('span').text(person.hp);
        hp.find('.score-value').css({width: percent + '%'});
        if(person.hp <= 0) {
            mediator.callTrigger(TRIGGER.END_GAME, {})
        }
    }

    function init() {
        $('.user-info').html(username)

        mediator.subscribe(TRIGGER.MOVE_LEFT, _this.moveLeft.bind(this))
        mediator.subscribe(TRIGGER.MOVE_RIGHT, _this.moveRight.bind(this))
        mediator.subscribe(TRIGGER.ATTACK_ONE, _this.attackOne.bind(this))
        mediator.subscribe(TRIGGER.PLAYER_IDLE, _this.idle.bind(this))
        mediator.subscribe(TRIGGER.PLAYER_DAMAGE, _this.damage.bind(this))
        mediator.subscribe(TRIGGER.GET_PLAYER_ANIMATION, _this.getAnimation.bind(this))
        mediator.subscribe(TRIGGER.GET_PLAYER_PERSON, _this.getPerson.bind(this))
    }
    init();
}
