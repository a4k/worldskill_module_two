
function Timer(options) {
    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const _this = this;

    let settings = {
        time: 0,
        ftime: '',
        isRun: false,
    }

    this.start = (data) => {
        settings.isRun = true;
        this.update(data);
    }
    this.update = (data) => {
        if(!settings.isRun) return;

        settings.time++;
        let t = this.getTime();
        $('.timer-value').text(t);

        setTimeout(() => {
            _this.update(data);

        }, 1000)
    }
    this.pause = (data) => {
        settings.isRun = false;
    }
    this.stop = (data) => {
        settings.isRun = false;
        settings.time = 0;
        settings.ftime = '';
    }
    this.getTime = (data) => {
        let minutes = Math.floor(settings.time / 60);
        let seconds = settings.time - minutes * 60;
        if(minutes < 10) {
            minutes = '0' + minutes;
        }
        if(seconds < 10) {
            seconds = '0' + seconds;
        }
        return minutes + ':' + seconds;
    }
    function init() {

        mediator.subscribe(TRIGGER.START_TIMER, _this.start.bind(this))
        mediator.subscribe(TRIGGER.PAUSE_TIMER, _this.pause.bind(this))
        mediator.subscribe(TRIGGER.STOP_TIMER, _this.stop.bind(this))

    }
    init();
}
