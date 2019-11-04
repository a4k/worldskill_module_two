
function Elf(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const NAMES = mediator.getNames();
    const _this = this;

    let person = {
        id: 0,
        damage: 5,
        hp: 30,
        maxHp: 30,
        canDamage: true,
        isDead: false,
    };
    let animation = {
        idle: {
            url: '/animation/elf/idle/',
            postfix: '.png',
            count: 20,
            width: 341,
            height: 778,
            dheight: 350,
            dwidth: 0,
        },
        run: {
            url: '/animation/elf/run/',
            postfix: '.png',
            count: 20,
            width: 592,
            height: 794,
            dheight: 350,
            dwidth: 0,
        },
        die: {
            url: '/animation/elf/die/',
            postfix: '.png',
            count: 20,
            width: 1256,
            height: 855,
            dheight: 350,
            dwidth: 0,
        },
        attack: {
            url: '/animation/elf/attack/',
            postfix: '.png',
            count: 20,
            width: 490,
            height: 797,
            dheight: 350,
            dwidth: 0,
        },
        current: {
            name: 'idle',
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
        _this.setAnimation('idle')
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

                _this.setAnimation('idle')
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

        mediator.subscribe(TRIGGER.ELF_MOVE_LEFT, _this.moveLeft.bind(this))
        mediator.subscribe(TRIGGER.ELF_MOVE_RIGHT, _this.moveRight.bind(this))
        mediator.subscribe(TRIGGER.ELF_RUN, _this.run.bind(this))
        mediator.subscribe(TRIGGER.ELF_IDLE, _this.idle.bind(this))
    }
    init();
}
