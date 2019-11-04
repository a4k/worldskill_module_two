
function Game(options) {
    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const _this = this;

    let objects = [],
        enemies = false,
        isPower = false,
        canvas = document.getElementById('game-canvas'),
        ctx = canvas.getContext('2d');

    let settings = {
        canvasWidth: $(document).width(),
        canvasHeight: $(document).height(),
        canvasLeft: 0,
    };
    let resource = {
        cache: {},
    };

    this.addObject = (obj) => {
        objects.push(obj)
    };
    this.startGame = (data) => {
        isPower = data;
        canvas.width = settings.canvasWidth;
        canvas.height = settings.canvasHeight;

        enemies = new EnemyManager({mediator});
        objects.push(new Background({mediator}));

        this.updateScene();
    }
    this.endGame = (data) => {
        isPower = false;
        mediator.callTrigger(TRIGGER.STOP_TIMER, true)
        mediator.callTrigger(TRIGGER.RANKING, data)
    }
    this.updateScene = () => {
        if(isPower) {
            ctx.clearRect(0, 0, settings.canvasWidth, settings.canvasHeight);

            let enObj = enemies.getObjects();
            let arObj = objects.concat(enObj);

            $.each(arObj, function(k, v) {
                _this.drawObject(v)
            })

            let playerPerson = mediator.callTrigger(TRIGGER.GET_PLAYER_PERSON);
            $('.kills-value').text(playerPerson.kills);

            setTimeout(_this.updateScene.bind(_this), 50)
        }
    }
    this.drawObject = (obj) => {
        let animations = obj.getAnimation();
        let current = animations.current;
        let animation = animations[current.name];
        let url = animation.url + current.number + animation.postfix;


        let nextAnimation = function() {
            if(current.number === animation.count) {
                if(current.callback && current.callback.hasOwnProperty('done')) {
                    current.callback.done(animation.count);
                }
                current.number = 1;
            } else {
                current.number++;
            }
        }
        let draw = function(image) {
            nextAnimation();
            animation.dwidth = animation.width / (animation.height / animation.dheight);
            let dy = settings.canvasHeight - animation.dheight;
            if(current.hasOwnProperty('top')) {
                dy -= current.top;
            }

            let cleft = current.left;

            if(typeof obj.isSceneObject === "function") {
                if(obj.isSceneObject()) {
                    cleft -= settings.canvasLeft;
                }
            }

            ctx.save();
            ctx.translate(cleft, dy);
            ctx.scale(current.direction, 1);

            ctx.drawImage(image, 0, 0, animation.dwidth * current.direction, animation.dheight);

            ctx.restore();

        }

        let image;
        if(resource.cache[url]) {
            image = resource.cache[url];
            draw(image);
        } else {
            image = new Image();
            image.onload = function() {
                resource.cache[url] = image;
                draw(image);
            }
            resource.cache[url] = false;
            image.src = url;
        }

    }

    this.getCanvasSettings = (data) => {
        return settings;
    }


    function init() {
        mediator.subscribe(TRIGGER.ADD_OBJECT, _this.addObject.bind(this))
        mediator.subscribe(TRIGGER.START_GAME, _this.startGame.bind(this))
        mediator.subscribe(TRIGGER.END_GAME, _this.endGame.bind(this))
        mediator.subscribe(TRIGGER.GET_CANVAS_SETTINGS, _this.getCanvasSettings.bind(this))

    }
    init();
}
