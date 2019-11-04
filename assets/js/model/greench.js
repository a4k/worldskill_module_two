
function Greench(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const NAMES = mediator.getNames();
    const _this = this;

    let person = {
        id: 0,
        damage: 10,
        hp: 60,
        maxHp: 60,
        canDamage: true,
        isDead: false,
    };
    let animation = {
        run: {
            url: '/animation/greench/run/',
            postfix: '.png',
            count: 20,
            width: 452,
            height: 587,
            dheight: 300,
            dwidth: 0,
        },
        die: {
            url: '/animation/greench/die/',
            postfix: '.png',
            count: 20,
            width: 730,
            height: 629,
            dheight: 300,
            dwidth: 0,
        },
        attack: {
            url: '/animation/greench/attack/',
            postfix: '.png',
            count: 20,
            width: 443,
            height: 578,
            dheight: 300,
            dwidth: 0,
        },
        current: {
            name: 'run',
            number: 1,
            left: 0,
            top: 0,
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
    this.isSceneObject = () => {
        return true;
    }
    this.moveLeft = (data) => {
        if(data === 1) {
            _this.move(-10, NAMES.DIRECTION_LEFT)
        } else {
            _this.move(data, NAMES.DIRECTION_LEFT)
        }
    }
    this.moveRight = (data) => {
        if(data === 1) {
            _this.move(10, NAMES.DIRECTION_RIGHT)
        } else {
            _this.move(data, NAMES.DIRECTION_RIGHT)
        }
    }
    this.setPosition = (data, direction = false) => {
        let c = animation.current;
        c.left = data;
        if(direction) {
            c.direction = direction;
        }
        _this.setAnimation('run')
    }
    this.move = (data, direction = false) => {
        let c = animation.current;

        c.left += data;
        if(direction) {
            c.direction = direction;
        }
        _this.setAnimation('run')
    }
    this.run = (data) => {
        _this.setAnimation('run')
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

    this.moveToPurpose = (data) => {
        let canvas = mediator.callTrigger(TRIGGER.GET_CANVAS_SETTINGS);
        let cleft = canvas.canvasLeft;
        if (!cleft) cleft = 0;

        let purposeLeft = cleft + data.x;

        let c = animation.current;
        if(c.left < purposeLeft + 200 && c.left > purposeLeft - 50) {
            this.purposeDamage();
            return;
        }
        if(purposeLeft > c.left) {
            this.moveRight(0.5);
        } else if(purposeLeft < c.left) {
            this.moveLeft(-0.5);
        }
    }

    this.purposeDamage = () => {
        if(!person.canDamage || person.isDead) return;

        let cb = {
            done: function() {
                if(!person.canDamage || person.isDead) return;

                _this.setAnimation('run')
            }
        };
        this.setAnimation('attack', cb)

        person.canDamage = false;
        setTimeout(() => {
            person.canDamage = true;
        }, 1000);
        mediator.callTrigger(TRIGGER.PLAYER_DAMAGE, _this.getPerson());
    }

    this.damage = (data) => {
        person.hp -= data.damage;
        if(person.hp <= 0) {
            person.isDead = true;
            data.kills++;
            let cb = {
                done: function() {
                    mediator.callTrigger(TRIGGER.DESTROY_ENEMY, _this.getPerson());
                }
            };
            _this.setAnimation('die', cb)
        }
    }

    function init() {

        person.id = Math.floor(Math.random() * 100000) + 1;
        animation.current.top = Math.floor(Math.random() * 20) + 1;

        mediator.subscribe(TRIGGER.GREENCH_MOVE_LEFT, _this.moveLeft.bind(this))
        mediator.subscribe(TRIGGER.GREENCH_MOVE_RIGHT, _this.moveRight.bind(this))
        mediator.subscribe(TRIGGER.GREENCH_RUN, _this.run.bind(this))
    }
    init();
}
