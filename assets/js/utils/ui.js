
function UI(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const _this = this;

    let keys = {
        LEFT: 65,
        RIGHT: 68,
        ONE: 49,
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
                case keys.ONE:
                    mediator.callTrigger(TRIGGER.ATTACK_ONE, 1)
                    break;
            }
        })
        $(document).on('keyup', function(e) {

            mediator.callTrigger(TRIGGER.PLAYER_IDLE, 1)
        })
        $('.attack1').on('click', function (e) {
            let t = $(e.target);
            if(t.hasClass('disable')) return false;

            mediator.callTrigger(TRIGGER.ATTACK_ONE, 1)
        })
    }
    init();
}
