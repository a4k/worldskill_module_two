const mediator = new Mediator({triggers: SETTINGS.TRIGGER, names: SETTINGS.NAMES});
const timer = new Timer({mediator});
const game = new Game({mediator});
const ui = new UI({mediator});
const app = new App({mediator});
const ranking = new Ranking({mediator});


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
        mediator.callTrigger(TRIGGER.START_GAME, true)
        mediator.callTrigger(TRIGGER.START_TIMER, true)
        mediator.callTrigger(TRIGGER.ADD_OBJECT, obj)

    }
    function init() {
        mediator.subscribe(TRIGGER.REGISTER, _this.register.bind(this))
        mediator.subscribe(TRIGGER.TAB_CHANGE, _this.tabChange.bind(this))


        mediator.callTrigger(TRIGGER.REGISTER, 'sdf')
        mediator.callTrigger(TRIGGER.TAB_CHANGE, '.screen-game')
    }
    init();
}




