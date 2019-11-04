
function EnemyManager(options) {

    const mediator = options.mediator;
    const TRIGGER = mediator.getTriggerTypes();
    const NAMES = mediator.getNames();
    const _this = this;

    let objects = [];
    let settings = {
        canUpdate: true,
        purpose: {},
        maxObjects: 0,
        maxEnemyLevel: 0,
        maxSceneObjects: 10,
    };

    this.updateEnemyLevel = (data) => {
        let player = mediator.callTrigger(TRIGGER.GET_PLAYER_PERSON);
        let level = player.kills;

        if(level < 2) {
            settings.maxObjects = 1;
            settings.maxEnemyLevel = 1;
        } else {
            settings.maxObjects = level;
            if(settings.maxObjects > settings.maxSceneObjects) {
                settings.maxObjects = settings.maxSceneObjects;
            }
            if(settings.maxObjects > 5) {
                settings.maxEnemyLevel = 3;
            } else if(settings.maxObjects > 3) {
                settings.maxEnemyLevel = 2;
            } else {
                settings.maxEnemyLevel = 1;
            }
        }
    }

    this.getPurpose = () => {
        let player = mediator.callTrigger(TRIGGER.GET_PLAYER_ANIMATION);
        return {x: player.current.left};
    }

    this.render = () => {

        this.addEnemyIfNeed();
        this.updatePurpose();
        this.moveEnemy();

        if(!settings.canUpdate) return false;

        setTimeout(() => {
            _this.render();
        });
    }

    this.addEnemyIfNeed = () => {
        if(objects.length < settings.maxObjects) {
            let randLevel = Math.floor(Math.random() * settings.maxEnemyLevel) + 1;
            switch (randLevel) {
                case 1:
                    this.addObject(new Dog({mediator}));
                    break;
                case 2:
                    this.addObject(new Elf({mediator}));
                    break;
                case 3:
                    this.addObject(new Greench({mediator}));
                    break;
            }
        }
    }

    this.updatePurpose = () => {
        settings.purpose = this.getPurpose();
    }

    this.moveEnemy = () => {
        $.each(objects, function(k, v) {
            v.moveToPurpose(settings.purpose);
        })
    }

    this.addObject = (obj) => {
        let canvas = mediator.callTrigger(TRIGGER.GET_CANVAS_SETTINGS);
        let x = Math.floor(Math.random() * 400) + 1;
        obj.setPosition(canvas.canvasLeft + canvas.canvasWidth + x);
        let a = obj.getAnimation();
        objects.push(obj);
    }
    this.getObjects = () => {
        return objects;
    }
    this.destroyEnemy = (data) => {
        $.each(objects, function (k, v) {
            if(v) {
                let p = v.getPerson();
                if(p.id === data.id) {
                    objects.splice(k, 1);
                }
            }
        })
        this.updateEnemyLevel();
    }


    function init() {
        mediator.subscribe(TRIGGER.UPDATE_ENEMY_LEVEL, _this.updateEnemyLevel.bind(this))
        mediator.subscribe(TRIGGER.GET_ENEMIES, _this.getObjects.bind(this))
        mediator.subscribe(TRIGGER.UPDATE_PURPOSE, _this.updatePurpose.bind(this))
        mediator.subscribe(TRIGGER.DESTROY_ENEMY, _this.destroyEnemy.bind(this))

        _this.updateEnemyLevel()
        _this.render();
    }
    init();
}
