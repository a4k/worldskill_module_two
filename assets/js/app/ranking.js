
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
