
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
