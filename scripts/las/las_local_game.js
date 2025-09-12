/*
    Class Name: LasLocalGame
    Description: Locally running Lobsters At Sea Game
*/
class LasLocalGame extends LasGame {
    /*
        Method Name: constructor
        Method Parameters: 
            gameProperties:
                JSON of game properties
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gameProperties){
        super(gameProperties);
        this.seaDisplay = new LASSeaDisplay();
        
        this.focusedShip = null;
        this.humanShipController = null;
        this.botShipControllers = [];

        this.focusedCamera = new SpectatorCamera(this, gameProperties["camera_settings"]);

        this.visualEffects = new NotSamLinkedList();
        this.visualEffectRandomGenerator = new SeededRandomizer(gameProperties["random_seed"]);

        this.updatingFramePositions = true;
        this.lastUpdatedFrameMS = 0;
    }

    /*
        Method Name: getHumanShipController
        Method Parameters: None
        Method Description: Getter
        Method Return: HumanShipController
    */
    getHumanShipController(){
        return this.humanShipController;
    }

    /*
        Method Name: addBotShipController
        Method Parameters: 
            botShipController:
                Controller for a bot
        Method Description: Adds a bot controller
        Method Return: void
    */
    addBotShipController(botShipController){
        this.botShipControllers.push(botShipController);
    }

    /*
        Method Name: setUpdatingFramePositions
        Method Parameters: 
            value:
                New value (boolean)
        Method Description: Setter
        Method Return: void
    */
    setUpdatingFramePositions(value){
        this.updatingFramePositions = value;
    }

    /*
        Method Name: getDisplayMSSinceLastTick
        Method Parameters: None
        Method Description: Gets the MS since the last tick for display purposes
        Method Return: int
    */
    getDisplayMSSinceLastTick(){
        if (this.updatingFramePositions){
            this.lastUpdatedFrameMS = GC.getGameTickScheduler().getDisplayMSSinceLastTick();    
        }
        return this.lastUpdatedFrameMS;
    }

    /*
        Method Name: tickHumanController
        Method Parameters: None
        Method Description: Ticks the human controller (or camera if applicable)
        Method Return: void
    */
    tickHumanController(){
        if (this.hasFocusedLivingShip()){
            this.humanShipController.tick();
        }else{
            this.focusedCamera.tick();
        }
    }

    /*
        Method Name: tickBotControllers
        Method Parameters: None
        Method Description: Ticks the bot controllers
        Method Return: void
    */
    tickBotControllers(){
        for (let botShipController of this.botShipControllers){
            if (botShipController.getShip().isDead()){continue;}
            botShipController.tick();
        }
    }

    /*
        Method Name: displayHumanController
        Method Parameters: None
        Method Description: Displays and human or camera thingsn needed
        Method Return: void
    */
    displayHumanController(){
        if (this.hasFocusedLivingShip()){
            this.humanShipController.display();
        }else{
            this.focusedCamera.display();
        }
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Runs tick processes
        Method Return: void
    */
    tick(){
        // Clean the tick timeline
        this.getTickTimeline().reset();
        
        // Maintenace ticks
        this.tickShips();

        // Tick human controller
        this.tickHumanController();

        // Tick bot controllers
        this.tickBotControllers();

        // Update ship orientations, power based on decisions
        this.updateEstablishedDecisions();

        // Record initial positions prior to moving for collision checking later
        this.recordShipPositions();

        // Move ships based on orientation and sail power
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
        this.processNewVisualEffects();

        // Play sounds
        this.queueUpSounds(this.getFocusedFrameX(), this.getFocusedFrameY());

        // Up the tick count
        this.incrementTickCount();
    }

    /*
        Method Name: processNewVisualEffects
        Method Parameters: None
        Method Description: Processes new visual effects
        Method Return: void
    */
    processNewVisualEffects(){
        let tickTimeline = this.getTickTimeline();

        // Collect cannonball hits
        let visaulEffectsSettings = this.getGameProperties()["visual_effect_settings"];
        let cannonBallHits = tickTimeline.getEventsOfType("cannon_ball_hit");

        for (let [cBH, cBHIndex] of cannonBallHits){
            this.visualEffects.push(new CannonBallHit(this.getTickCount(), this.visualEffectRandomGenerator, cBH, visaulEffectsSettings["cannon_ball_hit"]));
        }

        // Collect cannon smoke
        let cannonBallShots = tickTimeline.getEventsOfType("cannon_shot");

        for (let [cBS, cBSIndex] of cannonBallShots){
            this.visualEffects.push(new CannonSmoke(this.getTickCount(), this.visualEffectRandomGenerator, cBS, visaulEffectsSettings["cannon_smoke"]));
        }

        // Cannon ball sunk
        let cannonBallSinkings = tickTimeline.getEventsOfType("cannon_ball_sunk");

        for (let [cBSi, cBSIIndex] of cannonBallSinkings){
            this.visualEffects.push(new CannonBallSplash(this.getTickCount(), this.visualEffectRandomGenerator, cBSi, visaulEffectsSettings["cannon_ball_splash"]));
        }

        // Ship sunk
        let shipSinkings = tickTimeline.getEventsOfType("ship_sunk");

        for (let [sS, sSIndex] of shipSinkings){
            this.visualEffects.push(new ShipSplash(this.getTickCount(), this.visualEffectRandomGenerator, sS, visaulEffectsSettings["ship_splash"]));
        }
    }

    /*
        Method Name: updateShipDecisions
        Method Parameters: None
        Method Description: Updates the decisions of the ships from their controllers
        Method Return: void
    */
    updateShipDecisions(){
        // For human ship
        if (this.hasFocusedLivingShip()){
            let controllerOutputJSON = this.humanShipController.getDecisionJSON();

            this.focusedShip.updateFromPilot(controllerOutputJSON);
        }

        // Bot ship controllers
        for (let botShipController of this.botShipControllers){
            botShipController.getShip().updateFromPilot(botShipController.getDecisionJSON());
        }
    }

    /*
        Method Name: getFocusedEntity
        Method Parameters: None
        Method Description: Gets the focused entity
        Method Return: SpectatorCamera | Ship
    */
    getFocusedEntity(){
        if (this.hasFocusedLivingShip()){
            return this.focusedShip;
        }
        return this.focusedCamera;
    }

    /*
        Method Name: hasFocusedLivingShip
        Method Parameters: None
        Method Description: Checks if there is a focused living ship
        Method Return: boolean
    */
    hasFocusedLivingShip(){
        return this.focusedShip != null && this.focusedShip.isAlive();
    }

    /*
        Method Name: getFocusedShip
        Method Parameters: None
        Method Description: Getter
        Method Return: Ship || null
    */
    getFocusedShip(){
        return this.focusedShip;
    }

    /*
        Method Name: setFocusedShip
        Method Parameters: 
            ship:
                A ship
        Method Description: Sets the focusd ship and adds a human controller
        Method Return: void
    */
    setFocusedShip(ship){
        this.focusedShip = ship; 
        this.humanShipController = new HumanShipController(this.focusedShip);
    }

    /*
        Method Name: hasFocusedShip
        Method Parameters: None
        Method Description: Checks if there is a focused ship
        Method Return: boolean
    */
    hasFocusedShip(){
        return this.getFocusedShip() != null;
    }

    /*
        Method Name: getFocusedFrameX
        Method Parameters: None
        Method Description: Gets the frame x of the focused entity
        Method Return: number
    */
    getFocusedFrameX(){
        return this.getFocusedEntity().getFrameX();
    }

    /*
        Method Name: getFocusedFrameY
        Method Parameters: None
        Method Description: Gets the frame y of the focused entity
        Method Return: number
    */
    getFocusedFrameY(){
        return this.getFocusedEntity().getFrameY();
    }

    /*
        Method Name: getFocusedTickX
        Method Parameters: None
        Method Description: Gets the tick x of the focused entity
        Method Return: number
    */
    getFocusedTickX(){
        return this.getFocusedEntity().getTickX();
    }

    /*
        Method Name: getFocusedTickY
        Method Parameters: None
        Method Description: Gets the tick y of the focused entity
        Method Return: number
    */
    getFocusedTickY(){
        return this.getFocusedEntity().getTickY();
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the game
        Method Return: void
    */
    reset(){
        super.reset();
        this.visualEffects.clear();
    }

    /*
        Method Name: displayVisualEffects
        Method Parameters: None
        Method Description: Displays visual effects
        Method Return: void
    */
    displayVisualEffects(){
        let visualEffectsThatExpiredIndices = new NotSamLinkedList();

        let currentTick = this.getTickCount();
        let msSinceLastTick = this.getDisplayMSSinceLastTick();

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

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the game
        Method Return: void
    */
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

        // Display human controller things
        this.displayHumanController();

        // Display relevant things when focused
        this.getFocusedEntity().displayWhenFocused();

        // Play sounds
        GC.getSoundManager().playSounds();
    }

    /*
        Method Name: getCamera
        Method Parameters: None
        Method Description: Getter
        Method Return: SpectatorCamera
    */
    getCamera(){
        return this.focusedCamera;
    }

    /*
        Method Name: queueUpSounds
        Method Parameters: 
            centerX:
                Center x (game coordinates) of the focused entity
            centerY:
                Center y (game coordinates) of the focused entity
        Method Description: Plays sounds in the game
        Method Return: void
    */
    queueUpSounds(centerX, centerY){
        let tickTimeline = this.getTickTimeline();
        let soundManager = GC.getSoundManager();

        let screenWidth = getZoomedScreenWidth();
        let screenHeight = getZoomedScreenHeight();

        // Collect cannonball hits
        let cannonBallHits = tickTimeline.getEventsOfType("cannon_ball_hit");

        for (let [cBH, cBHIndex] of cannonBallHits){
            let x = cBH["x_pos"];
            let y = cBH["y_pos"];
            soundManager.queueUp("cannon_ball_hit", x - centerX, y-centerY);
        }

        // Collect cannon smoke
        let cannonBallShots = tickTimeline.getEventsOfType("cannon_shot");

        for (let [cBS, cBSIndex] of cannonBallShots){
            let x = cBS["x_origin"];
            let y = cBS["y_origin"];
            soundManager.queueUp("cannon_shot", x - centerX, y-centerY);
        }

        // Cannon ball sunk
        let cannonBallSinkings = tickTimeline.getEventsOfType("cannon_ball_sunk");

        for (let [cBSi, cBSIIndex] of cannonBallSinkings){
            let x = cBSi["x_pos"];
            let y = cBSi["y_pos"];
            soundManager.queueUp("cannon_ball_sinking", x - centerX, y-centerY);
        }

        // Ship sunk
        let shipSinkings = tickTimeline.getEventsOfType("ship_sunk");

        for (let [sS, sSIndex] of shipSinkings){
            let x = sS["x_pos"];
            let y = sS["y_pos"];
            soundManager.queueUp("ship_sinking", x - centerX, y-centerY);
        }
    }

    /*
        Method Name: registerAllKeybinds
        Method Parameters: None
        Method Description: Registers all the keybinds
        Method Return: void
    */
    static registerAllKeybinds(){

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

        let keyCodeZoomAlt18 = MD["default_key_binds"]["zoom_1/8_alt"];
        let keyCodeZoomAlt14 = MD["default_key_binds"]["zoom_1/4_alt"];
        let keyCodeZoomAlt12 = MD["default_key_binds"]["zoom_1/2_alt"];
        let keyCodeZoomAlt1 = MD["default_key_binds"]["zoom_1_alt"];
        let keyCodeZoomAlt2 = MD["default_key_binds"]["zoom_2_alt"];

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

        menuInputManager.register("scroll_bar_grab", "mousedown", (event) => { return event.which===keyCodeLeftClick; });
        menuInputManager.register("scroll_bar_grab", "mouseup", (event) => { return event.which===keyCodeLeftClick; }, false);

        menuInputManager.register("option_slider_grab", "mousedown", (event) => { return event.which===keyCodeLeftClick; });
        menuInputManager.register("option_slider_grab", "mouseup", (event) => { return event.which===keyCodeLeftClick; }, false);


        menuInputManager.registerSpecialType(new TickedValueNode("scroll_in_dir", "wheel", (event) => { return event.deltaY; }, 0));

        // Register
        let gameInputManager = GC.getGameUserInputManager();

        // Click
        gameInputManager.register("left_click_ticked", "click", (event) => { return event.which===keyCodeLeftClick; }, true, {"ticked": true, "ticked_activation": false}); 

        // Mobile
        gameInputManager.register("touch_press", "pointerdown", (event) => { return true; });
        gameInputManager.register("touch_press", "pointerup", (event) => { return true; }, false);
        //gameInputManager.register("touch_press", "pointercancel", (event) => { return true; }, false);


        // Keys Menu
        gameInputManager.register("scroll_left_ticked_game", "keydown", (event) => { return event.which===keyCodeScrollL; }, true, {"ticked": true, "ticked_activation": false});
        gameInputManager.register("scroll_right_ticked_game", "keydown", (event) => { return event.which===keyCodeScrollR; }, true, {"ticked": true, "ticked_activation": false});
        
        // Zoom
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

        // Alt zoom
        gameInputManager.register("1/8zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoomAlt18; }, true);
        gameInputManager.register("1/8zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoomAlt18; }, false);
        gameInputManager.register("1/4zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoomAlt14; }, true);
        gameInputManager.register("1/4zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoomAlt14; }, false);
        gameInputManager.register("1/2zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoomAlt12; }, true);;
        gameInputManager.register("1/2zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoomAlt12; }, false);
        gameInputManager.register("1zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoomAlt1; }, true);
        gameInputManager.register("1zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoomAlt1; }, false);
        gameInputManager.register("2zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoomAlt2; }, true);
        gameInputManager.register("2zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoomAlt2; }, false);

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

    /*
        Method Name: loadImages
        Method Parameters: None
        Method Description: Loads images needed
        Method Return: void
    */
    static async loadImages(){
        // Load image loading
        await GC.loadToImages("image_loading");

        // Load windsock
        await GC.loadToImages("wind_sock");

        // Load radar outline
        await GC.loadToImages("radar_outline");

        // Load crosshair
        await GC.loadToImages("crosshair");

        // Load cannon ball
        await GC.loadToImages("cannon_ball");

        // Load freecam
        await GC.loadToImages("freecam");

        // Load ships
        let shipPathPrefix = "/ships/generic_ship/";
        for (let colour of MD["ship_colours"]){
            await GC.loadToImages("generic_ship_left", shipPathPrefix + colour + "/", ".png", {"custom_name": "generic_ship_left_" + colour});
            await GC.loadToImages("generic_ship_down", shipPathPrefix + colour + "/", ".png", {"custom_name": "generic_ship_down_" + colour});
            await GC.loadToImages("generic_ship_up", shipPathPrefix + colour + "/", ".png", {"custom_name": "generic_ship_up_" + colour});
        }

        // Load sounds
        await GC.getSoundManager().loadSounds();

        console.log("Finished loading critical game images.")

        // Slow loads

        // Load logo
        GC.slowLoadToImages("logo");

        // Load project images
        await GC.getMenuManager().getMenuByName("my_projects_menu").slowLoadImages();

        // Load help menu images
        await GC.getMenuManager().getMenuByName("help_menu").slowLoadImages();
    }
}