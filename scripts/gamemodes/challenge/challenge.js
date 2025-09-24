/*
    Class Name: Challenge
    Description: Challenge gamemode
*/
class Challenge extends Gamemode {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super();
        this.winScreen = new WinningScreen();
        
        this.currentLevel = undefined;
        this.challengerShip = undefined;
        this.botShip = undefined;
        this.healMode = undefined;

        this.temporaryMessage = null;
    }

    /*
        Method Name: isHealModeEnabled
        Method Parameters: None
        Method Description: Checks if the healing mode is enabled
        Method Return: boolean
    */
    isHealModeEnabled(){
        return this.healMode;
    }

    /*
        Method Name: startUp
        Method Parameters: 
            setupJSON=null:
                JSON with setup instructions
        Method Description: Starts up the game
        Method Return: void
    */
    startUp(setupJSON=null){
        let game = this.getGame();
        // Randomzie the wind
        game.getWind().resetWithNewSeed(randomNumberInclusive(1, 100000));

        // If no setup JSON -> use default
        if (setupJSON === null){
            setupJSON = copyObject(game.getGameProperties()["challenge"]["default_setup_json"]);
        }
        
        this.currentLevel = setupJSON["starting_level"];
        this.healMode = setupJSON["heal_mode"];

        let perfectReferenceModel = copyObject(MD["saved_models"][0]);

        // Spawn challenger
        let challengerShipJSON = copyObject(perfectReferenceModel["ship_json"]);

        // Set up challenger
        challengerShipJSON["starting_orientation_rad"] = setupJSON["challenger_starting_orientation_rad"];
        challengerShipJSON["starting_x_pos"] = setupJSON["challenger_starting_x_pos"];
        challengerShipJSON["starting_y_pos"] = setupJSON["challenger_starting_y_pos"];
        challengerShipJSON["starting_sail_strength"] = setupJSON["challenger_starting_sail_strength"];
        challengerShipJSON["starting_speed"] = setupJSON["challenger_starting_speed"];
        challengerShipJSON["game_instance"] = game;


        // If NOT using heal mode then give the user all the health at the beginning
        if (!this.isHealModeEnabled()){
            let totalHealthPool = 0;
            for (let i = MD["saved_models"].length - this.currentLevel; i >= 0; i--){
                let modelObj = MD["saved_models"][i];
                totalHealthPool += modelObj["ship_json"]["health"];
            }
            challengerShipJSON["health"] = totalHealthPool;
        }

        let challengerShip = new Ship(challengerShipJSON);
        game.addShip(challengerShip);

        // Assign challenger ship
        this.challengerShip = challengerShip;
        
        // If user is playing as a ship ->
        if (setupJSON["user_is_challenger"]){
            // Focus
            game.setFocusedShip(challengerShip);

            // Set automatic sails
            game.getHumanShipController().setUsingAutomatedSails(setupJSON["user_automatic_sails"]);
        }
        // If user is a camera ->
        else{
            let botShipControllerJSON = copyObject(perfectReferenceModel["bot_controller_json"]);
            botShipControllerJSON["ship"] = challengerShip;

            let botShipController = new BotShipController(botShipControllerJSON);

            game.addBotShipController(botShipController);
        }


        this.startLevel(this.currentLevel);

        // Running
        this.running = true;
    }

    /*
        Method Name: getChallengerShip
        Method Parameters: None
        Method Description: Getter
        Method Return: Ship
    */
    getChallengerShip(){
        return this.challengerShip;
    }

    /*
        Method Name: startLevel
        Method Parameters: 
            currentLevel:
                Level number
        Method Description: Starts a new level
        Method Return: void
    */
    startLevel(currentLevel){
        let game = this.getGame();

        let messageTickLength = game.getGameProperties()["challenge"]["temporary_message_ticks"];
        let botModel = copyObject(MD["saved_models"][MD["saved_models"].length - currentLevel]);

        // Set the temporary message to display
        this.temporaryMessage = {
            "expiry_tick": game.getTickCount() + messageTickLength,
            "text": "Level " + currentLevel.toString() + " has commenced!\n" + botModel["model_name"] + " has spawned!",
            "colour_code": "#f01616"
        }

        let botShipJSON = botModel["ship_json"];
        let spawnAngle = randomFloatBetween(0, 2*Math.PI);

        let spawnDistance = 5000;
        let spawnX = this.challengerShip.getTickX() + Math.cos(spawnAngle) * spawnDistance;
        let spawnY = this.challengerShip.getTickY() + Math.sin(spawnAngle) * spawnDistance;

        botShipJSON["id"] = botModel["model_name"];
        botShipJSON["starting_orientation_rad"] = rotateCWRAD(spawnAngle, Math.PI);
        botShipJSON["starting_x_pos"] = spawnX;
        botShipJSON["starting_y_pos"] = spawnY;
        botShipJSON["starting_sail_strength"] = 0.5;
        botShipJSON["starting_speed"] = 160;
        botShipJSON["ship_colour"] = "red";
        botShipJSON["game_instance"] = game;

        let botShip = new Ship(botShipJSON);

        let botShipControllerJSON = botModel["bot_controller_json"];
        botShipControllerJSON["ship"] = botShip;

        let botShipController = new BotShipController(botShipControllerJSON);

        game.addShip(botShip);
        game.addBotShipController(botShipController);

        this.botShip = botShip;

        // Heal challenger
        if (this.isHealModeEnabled()){
            this.challengerShip.setHealth(MD["saved_models"][0]["ship_json"]["health"]);
        }
    }

    /*
        Method Name: handlePause
        Method Parameters: None
        Method Description: Handles actions on pause
        Method Return: void
    */
    handlePause(){
        if (!GC.getGameTickScheduler().isPaused()){
            GC.getGameTickScheduler().pause();
        }
    }

    /*
        Method Name: handleUnpause
        Method Parameters: None
        Method Description: Handles actions on unpause
        Method Return: void
    */
    handleUnpause(){
        if (GC.getGameTickScheduler().isPaused()){
            GC.getGameTickScheduler().unpause();
        }
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks the game
        Method Return: void
    */
    tick(){
        if (!this.isRunning()){
            return;
        }

        // Tick the game
        this.getGame().tick();

        // Check events
        this.checkGameEvents();
    }

    /*
        Method Name: checkGameEvents
        Method Parameters: None
        Method Description: Checks what is going on and takes actions
        Method Return: void
    */
    checkGameEvents(){
        if (this.challengerShip.isDead()){
            this.running = false;
            this.winScreen.setUp("Challenger has been defeated on level: " + this.currentLevel.toString() + "\nWinner: " + this.botShip.getID(), "#940000");
            this.endActions();
        }else if (this.botShip.isDead()){
            let nextLevel = this.currentLevel + 1;
            
            // If out of levels
            if (nextLevel > MD["saved_models"].length){
                this.winScreen.setUp("Challenger has beaten all " + this.currentLevel.toString() + " levels!", "#40fa23");
                this.endActions();
            }else{
                this.currentLevel++;
                this.startLevel(this.currentLevel);
            }
        }
    }

    /*
        Method Name: endActions
        Method Parameters: None
        Method Description: Actions to take on end of game
        Method Return: void
    */
    endActions(){
        let game = this.getGame();
        game.setUpdatingFramePositions(false);
        // Snap the camera on the winner
        game.getCamera().snapToClosestEntity();
        this.running = false;
    }

    /*
        Method Name: isRunning
        Method Parameters: None
        Method Description: Checks if the game is running
        Method Return: boolean
    */
    isRunning(){
        return this.running;
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getName(){ return "challenge"; }

    /*
        Method Name: getGame
        Method Parameters: None
        Method Description: Getter
        Method Return: LasGame
    */
    getGame(){
        return GC.getGameInstance();
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the game
        Method Return: void
    */
    display(){
        // Display game
        this.getGame().display();

        if (!this.isRunning()){
            this.winScreen.display();
        }else{
            this.displayTemporaryMessage();
            this.displayHUD();
        }
    }

    /*
        Method Name: displayTemporaryMessage
        Method Parameters: None
        Method Description: Displays a temporary message
        Method Return: void
    */
    displayTemporaryMessage(){
        if (this.temporaryMessage === null){ return; }
        // Delete old messages
        if (this.getGame().getTickCount() >= this.temporaryMessage["expiry_tick"]){ this.temporaryMessage = null; return; }
        Menu.makeText(this.temporaryMessage["text"], this.temporaryMessage["colour_code"], Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight() * 0.9), Math.floor(getScreenWidth()*0.70), Math.floor(getScreenHeight()/4), "center", "hanging");
    }

    /*
        Method Name: displayHUD
        Method Parameters: None
        Method Description: Displays the hud
        Method Return: void
    */
    displayHUD(){
        let hud = GC.getHUD();

        // Display FPS
        let fps = GC.getFrameCounter().getFPS();
        hud.updateElement("fps", fps);

        // Display wind direction
        let windDirection = toDegrees(this.getGame().getWind().getWindDirectionRAD()).toFixed(2);
        hud.updateElement("wind direction", windDirection);
        hud.updateElement("wind force", this.getGame().getWind().getWindMagnitude().toFixed(2));

        // Display HUD for focused ship
        hud.updateElement("health", this.getGame().getFocusedEntity().getHealth().toFixed(2));
        hud.updateElement("x", this.getGame().getFocusedEntity().getTickX().toFixed(2));
        hud.updateElement("x_v", this.getGame().getFocusedEntity().getTickXV().toFixed(2));
        hud.updateElement("y", this.getGame().getFocusedEntity().getTickY().toFixed(2));
        hud.updateElement("y_v", this.getGame().getFocusedEntity().getTickYV().toFixed(2));
        hud.updateElement("speed", this.getGame().getFocusedEntity().getSpeed().toFixed(2));
        hud.updateElement("orientation", toDegrees(this.getGame().getFocusedEntity().getTickOrientation()).toFixed(2));
        hud.updateElement("sail strength", this.getGame().getFocusedEntity().getTickSailStrength().toFixed(2));
        

        // Display HUD
        hud.display();
    }
}