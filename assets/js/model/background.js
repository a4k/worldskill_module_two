
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
        let canvas = mediator.callTrigger(TRIGGER.GET_CANVAS_SETTINGS, 1);
        animation.current.left = -canvas.canvasLeft;
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
