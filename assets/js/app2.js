const mediator = new Mediator({triggers: SETTINGS.TRIGGER});
const app = new App({mediator});

function Mediator(options) {

    const TRIGGERS = options.TRIGGER || {};
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

    function init() {
        console.log('test')
    }
    init();
}
