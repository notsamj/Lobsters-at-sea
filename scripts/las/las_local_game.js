/*
    TODO: Add NSRequire thing
        registerAllKeybinds
        loadImages
*/
class LasLocalGame extends LasGame {
    constructor(gameProperties){
        super(gameProperties);
        this.seaDisplay = new LASSeaDisplay();
        
        this.focusedShip = null;
        this.humanShipController = null;

        this.focusedCamera = new SpectatorCamera(this, gameProperties["camera_settings"]);

        this.visualEffects = new NotSamLinkedList();
        this.visualEffectRandomGenerator = new SeededRandomizer(gameProperties["random_seed"]);
    }

    tick(){
        // Maintenace ticks
        this.tickShips();

        // TODO: Update ship orientations, power based on decisions
        this.updateShipOrientationAndSailPower();

        // TODO: Move ships based on orientation and sail power
        this.recordShipPositions();
        this.moveShips();

        // Allow ships to shoot
        this.allowShipsToShoot();

        // Process cannon shots
        this.recordCannonBallPositions();
        this.handleCannonShotMovement();
        this.handleCannonBallCollisionsAndDeaths();
        this.handleNewCannonShots();

        // Take input from the user
        this.updateShipDecisions();

        // Update wind
        this.wind.tickUpdate();

        // Process visual effects + sounds from tick
        this.processVisualEffects();

        // Up the tick count
        this.incrementTickCount();
    }

    processVisualEffects(){
        let gameRecorder = this.getGameRecorder();

        // Collect cannonball hits
        let visaulEffectsSettings = this.getGameProperties()["visual_effect_settings"];
        let cannonBallHits = gameRecorder.getEventsOfTickAndType(this.getTickCount(), "cannon_ball_hit");

        for (let [cBH, cBHIndex] of cannonBallHits){
            this.visualEffects.push(new CannonBallHit(this.getTickCount(), this.visualEffectRandomGenerator, cBH, visaulEffectsSettings["cannon_ball_hit"]));
        }
    }

    handleCannonShotMovement(){
        for (let [cannonBall, index] of this.cannonBalls){
            cannonBall.move();
        }
    }

    tickShips(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.tick();
        }
    }

    moveShips(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.moveOneTick();
        }
    }

    allowShipsToShoot(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.checkShoot();
        }
    }

    updateShipDecisions(){
        // For ship
        if (this.hasFocusedShip()){
            let controllerOutputJSON = this.humanShipController.getDecisionJSON();

            this.focusedShip.updateFromPilot(controllerOutputJSON);
        }
        // For camera
        else{
            this.focusedCamera.tick();
        }
    }

    updateShipOrientationAndSailPower(){
        
        for (let [ship, shipIndex] of this.getShips()){
            ship.updateShipOrientationAndSailPower();
        }
    }

    getFocusedEntity(){
        if (this.focusedShip === null){
            return this.focusedCamera;
        }
        return this.focusedShip;
    }

    getFocusedShip(){
        return this.focusedShip;
    }

    setFocusedShip(ship){
        this.focusedShip = ship; 
        this.humanShipController = new HumanShipController(this.focusedShip);
    }

    hasFocusedShip(){
        return this.getFocusedShip() != null;
    }

    getFocusedFrameX(){
        return this.getFocusedEntity().getFrameX();
    }

    getFocusedFrameY(){
        return this.getFocusedEntity().getFrameY();
    }

    getFocusedTickX(){
        return this.getFocusedEntity().getTickX();
    }

    getFocusedTickY(){
        return this.getFocusedEntity().getTickY();
    }

    reset(){
        super.reset();
    }

    getCannonBalls(){
        return this.cannonBalls;
    }

    displayVisualEffects(){
        let visualEffectsThatExpiredIndices = new NotSamLinkedList();

        let currentTick = this.getTickCount();
        let msSinceLastTick = GC.getGameTickScheduler().getDisplayMSSinceLastTick();

        // Go through and display / prepare for removal
        for (let [visualEffect, visualEffectIndex] of this.visualEffects){

            // Record indices of ones that expired for removal
            if (visualEffect.isExpired(currentTick)){
                visualEffectsThatExpiredIndices.push(visualEffectIndex);
            }else{
                // Else, display
                visualEffect.display(this.getFocusedFrameX(), this.getFocusedFrameY(), currentTick, this.getGameProperties()["ms_between_ticks"], msSinceLastTick);
            }
        }

        // Remove expired visual effects
        for (let i = visualEffectsThatExpiredIndices.getLength() - 1; i >= 0; i--){
            let visualEffectIndex = visualEffectsThatExpiredIndices.get(i);
            this.visualEffects.pop(visualEffectIndex);
        }
    }

    display(){
        // Display the seas
        this.seaDisplay.display(this.getFocusedFrameX(), this.getFocusedFrameY());

        // Display ships
        for (let [ship, shipIndex] of this.getShips()){
            if (ship.isDead()){ continue; }
            ship.display(this.getFocusedFrameX(), this.getFocusedFrameY());
        }

        // Display cannon balls
            for (let [cannonBall, cannonBallIndex] of this.getCannonBalls()){
            cannonBall.display(this.getFocusedFrameX(), this.getFocusedFrameY());
        }

        // Display effects
        this.displayVisualEffects();

        // Display windsock
        this.getWind().display();

        // Display relevant things when focused
        this.getFocusedEntity().displayWhenFocused();
    }

    static registerAllKeybinds(){
        /* TODO: List out all keybinds
            get value from DEFAULT_KEY_BIND in main_data_json
            modify keybind if a local storage data value exists for that keybind
            register
        */

        // Read default values
        let keyCodeLeftClick = MD["default_key_binds"]["left_click_ticked"];

        let keyCodeScrollL = MD["default_key_binds"]["scroll_left_ticked"];
        let keyCodeScrollR = MD["default_key_binds"]["scroll_right_ticked"];
        let keyCodeAccessHelp = MD["default_key_binds"]["help_access_ticked"];
        let keyCodePressEscape = MD["default_key_binds"]["escape_ticked"];

        let keyCodeScrollUp = MD["default_key_binds"]["message_feed_up"];
        let keyCodeScrollDown = MD["default_key_binds"]["message_feed_down"];


        let keyCodeZoom18 = MD["default_key_binds"]["zoom_1/8"];
        let keyCodeZoom14 = MD["default_key_binds"]["zoom_1/4"];
        let keyCodeZoom12 = MD["default_key_binds"]["zoom_1/2"];
        let keyCodeZoom1 = MD["default_key_binds"]["zoom_1"];
        let keyCodeZoom2 = MD["default_key_binds"]["zoom_2"];

        // Game controls
        let keyCodeSailsInc = MD["default_key_binds"]["sails_inc"];
        let keyCodeSailsDec = MD["default_key_binds"]["sails_dec"];
        let keyCodeShipLeft = MD["default_key_binds"]["ship_left"];
        let keyCodeShipRight = MD["default_key_binds"]["ship_right"];
        let mouseCodeAimingCannon = MD["default_key_binds"]["aiming_cannon"];
        let mouseCodeFireCannon = MD["default_key_binds"]["fire_cannons"];


        // Camera controls
        let keyCodeCameraMoveLeft = MD["default_key_binds"]["camera_move_left"];
        let keyCodeCameraMoveRight = MD["default_key_binds"]["camera_move_right"];
        let keyCodeCameraMoveUp = MD["default_key_binds"]["camera_move_up"];
        let keyCodeCameraMoveDown = MD["default_key_binds"]["camera_move_down"];
        let keyCodeCameraSnapToggle = MD["default_key_binds"]["camera_snap_follow_toggle"];

        // TODO: Read modified keybinds

        let menuInputManager = GC.getMenuUserInputManager();

        // Click
        menuInputManager.register("left_click_ticked", "click", (event) => { return event.which===keyCodeLeftClick; }, true, {"ticked": true, "ticked_activation": false});

        // Other important menu stuff
        menuInputManager.register("scroll_left_ticked", "keydown", (event) => { return event.which===keyCodeScrollL; }, true, {"ticked": true, "ticked_activation": false});
        menuInputManager.register("scroll_right_ticked", "keydown", (event) => { return event.which===keyCodeScrollR; }, true, {"ticked": true, "ticked_activation": false});
        menuInputManager.register("help_access_ticked", "keydown", (event) => { return event.keyCode===keyCodeAccessHelp; }, true, {"ticked": true, "ticked_activation": false});
        menuInputManager.register("escape_ticked", "keydown", (event) => { return event.keyCode===keyCodePressEscape; }, true, {"ticked": true, "ticked_activation": false});

        menuInputManager.register("message_feed_up", "keydown", (event) => { return event.keyCode===keyCodeScrollUp; }, true, {"ticked": true, "ticked_activation": false});
        menuInputManager.register("message_feed_down", "keydown", (event) => { return event.keyCode===keyCodeScrollDown; }, true, {"ticked": true, "ticked_activation": false});

        // Register
        let gameInputManager = GC.getGameUserInputManager();

        // Click
        gameInputManager.register("left_click_ticked", "click", (event) => { return event.which===keyCodeLeftClick; }, true, {"ticked": true, "ticked_activation": false});

        // Keys Menu
        gameInputManager.register("scroll_left_ticked_game", "keydown", (event) => { return event.which===keyCodeScrollL; }, true, {"ticked": true, "ticked_activation": false});
        gameInputManager.register("scroll_right_ticked_game", "keydown", (event) => { return event.which===keyCodeScrollR; }, true, {"ticked": true, "ticked_activation": false});
        gameInputManager.register("1/8zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom18; }, true);
        gameInputManager.register("1/8zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom18; }, false);
        gameInputManager.register("1/4zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom14; }, true);
        gameInputManager.register("1/4zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom14; }, false);
        gameInputManager.register("1/2zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom12; }, true);;
        gameInputManager.register("1/2zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom12; }, false);
        gameInputManager.register("1zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom1; }, true);
        gameInputManager.register("1zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom1; }, false);
        gameInputManager.register("2zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom2; }, true);
        gameInputManager.register("2zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom2; }, false);

        gameInputManager.register("sails_inc", "keydown", (event) => { return event.keyCode === keyCodeSailsInc; }, true);
        gameInputManager.register("sails_inc", "keyup", (event) => { return event.keyCode === keyCodeSailsInc; }, false);

        gameInputManager.register("sails_dec", "keydown", (event) => { return event.keyCode === keyCodeSailsDec; }, true);
        gameInputManager.register("sails_dec", "keyup", (event) => { return event.keyCode === keyCodeSailsDec; }, false);

        gameInputManager.register("ship_left", "keydown", (event) => { return event.keyCode === keyCodeShipLeft; }, true);
        gameInputManager.register("ship_left", "keyup", (event) => { return event.keyCode === keyCodeShipLeft; }, false);

        gameInputManager.register("ship_right", "keydown", (event) => { return event.keyCode === keyCodeShipRight; }, true);
        gameInputManager.register("ship_right", "keyup", (event) => { return event.keyCode === keyCodeShipRight; }, false);

        gameInputManager.register("aiming_cannon", "mousedown", (event) => { return event.which===mouseCodeAimingCannon; });
        gameInputManager.register("aiming_cannon", "mouseup", (event) => { return event.which===mouseCodeAimingCannon; }, false);

        gameInputManager.register("fire_cannons", "click", (event) => { return event.which===mouseCodeFireCannon; }, true, {"ticked": true, "ticked_activation": false});

        gameInputManager.register("camera_move_left", "keydown", (event) => { return event.keyCode === keyCodeCameraMoveLeft; }, true);
        gameInputManager.register("camera_move_left", "keyup", (event) => { return event.keyCode === keyCodeCameraMoveLeft; }, false);

        gameInputManager.register("camera_move_right", "keydown", (event) => { return event.keyCode === keyCodeCameraMoveRight; }, true);
        gameInputManager.register("camera_move_right", "keyup", (event) => { return event.keyCode === keyCodeCameraMoveRight; }, false);

        gameInputManager.register("camera_move_up", "keydown", (event) => { return event.keyCode === keyCodeCameraMoveUp; }, true);
        gameInputManager.register("camera_move_up", "keyup", (event) => { return event.keyCode === keyCodeCameraMoveUp; }, false);

        gameInputManager.register("camera_move_down", "keydown", (event) => { return event.keyCode === keyCodeCameraMoveDown; }, true);
        gameInputManager.register("camera_move_down", "keyup", (event) => { return event.keyCode === keyCodeCameraMoveDown; }, false);

        gameInputManager.register("camera_snap_follow_toggle", "keydown", (event) => { return event.keyCode===keyCodeCameraSnapToggle; }, true, {"ticked": true, "ticked_activation": false});

    }

    static async loadImages(){
        // Load logo
        await GC.loadToImages("logo");

        // Load windsock
        await GC.loadToImages("wind_sock");

        // Load crosshair
        await GC.loadToImages("crosshair");

        // Load project images
        await GC.getMenuManager().getMenuByName("my_projects_menu").loadImages();
        await GC.getMenuManager().getMenuByName("help_menu").loadImages();

        // Load cannon ball
        await GC.loadToImages("cannon_ball");

        // Load ship
        await GC.loadToImages("generic_ship_left", "/ships/generic_ship/");
        await GC.loadToImages("generic_ship_down", "/ships/generic_ship/");
        await GC.loadToImages("generic_ship_up", "/ships/generic_ship/");

        console.log("Finished loading game images.")
    }
}