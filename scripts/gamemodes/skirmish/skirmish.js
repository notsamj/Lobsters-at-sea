class Skirmish extends Gamemode {

    constructor(){
        super();
        this.winScreen = new WinningScreen();
    }

    applyVampireEffect(){
        let game = this.getGame();
        let shipSinkings = game.getTickTimeline().getEventsOfType("ship_sunk");

        let vampireHealthAmount = MD["saved_models"][0]["ship_json"]["health"];

        // Apply vampire effect
        for (let [shipSinkingObj, shipSinkingIndex] of shipSinkings){
            let killerShip = game.getShipByID(shipSinkingObj["shooter_ship_id"]);

            // Doesn't apply if killer is dead
            if (killerShip.isDead()){ continue; }
            killerShip.setHealth(killerShip.getHealth() + vampireHealthAmount);
        }
    }

    startUp(setupJSON=null){
        let game = this.getGame();
        // Randomzie the wind
        game.getWind().resetWithNewSeed(randomNumberInclusive(1, 100000));

        // If no setup JSON -> use default
        if (setupJSON === null){
            setupJSON = copyObject(game.getGameProperties()["skirmish"]["default_setup_json"]);
        }
        
        // If user is playing as a ship ->
        if (setupJSON["user_is_a_ship"]){
            this.spawnUser(setupJSON);
        }

        this.spawnBots(setupJSON);

        // Running
        this.running = true;
    }

    applySpawnDataToShipJSON(shipJSON, setupJSON){
        let spawnDistance = setupJSON["spread"];
        let spawnAngle = randomFloatBetween(0, 2*Math.PI);
        let spawnX = Math.cos(spawnAngle) * spawnDistance;
        let spawnY = Math.sin(spawnAngle) * spawnDistance;

        let game = this.getGame();
        shipJSON["id"] = game.getIDManager().generateNewID()
        shipJSON["starting_orientation_rad"] = randomFloatBetween(0, 2*Math.PI);
        shipJSON["starting_x_pos"] = spawnX;
        shipJSON["starting_y_pos"] = spawnY;
        shipJSON["starting_sail_strength"] = 0.5;
        shipJSON["starting_speed"] = setupJSON["starting_speed"];
        shipJSON["game_instance"] = game;
    }

    spawnUser(setupJSON){
        let perfectReferenceModel = copyObject(MD["saved_models"][0]);

        // Spawn challenger
        let shipJSON = copyObject(perfectReferenceModel["ship_json"]);

        // Set up challenger
        this.applySpawnDataToShipJSON(shipJSON, setupJSON);

        let userShip = new Ship(shipJSON);
        let game = this.getGame();
        game.addShip(userShip);

        // Focus
        game.setFocusedShip(userShip);

        // Set automatic sails
        game.getHumanShipController().setUsingAutomatedSails(setupJSON["user_automatic_sails"]);
    }

    spawnBots(setupJSON){
        for (let i = 0; i < setupJSON["bot_count"]; i++){
            this.spawnBot(setupJSON);
        }
    }

    spawnBot(setupJSON){
        let botModel = undefined;

        // Find the model
        for (let model of MD["saved_models"]){
            if (model["model_name"] === setupJSON["bot_model"]){
                botModel = copyObject(model);
                break;
            }
        }

        // Error
        if (botModel === undefined){
            throw new Error("Unable to find bot model with name: " + setupJSON["bot_model"]);
        }

        let botShipJSON = botModel["ship_json"];
        botShipJSON["ship_colour"] = this.getGame().pickShipColour()

        // Set up
        this.applySpawnDataToShipJSON(botShipJSON, setupJSON);

        let botShip = new Ship(botShipJSON);

        let botShipControllerJSON = botModel["bot_controller_json"];
        botShipControllerJSON["ship"] = botShip;

        let botShipController = new BotShipController(botShipControllerJSON);

        let game = this.getGame();
        game.addShip(botShip);
        game.addBotShipController(botShipController);
    }

    handlePause(){
        if (!GC.getGameTickScheduler().isPaused()){
            GC.getGameTickScheduler().pause();
        }
    }

    handleUnpause(){
        if (GC.getGameTickScheduler().isPaused()){
            GC.getGameTickScheduler().unpause();
        }
    }

    tick(){
        if (!this.isRunning()){
            return;
        }

        // Tick the game
        this.getGame().tick();

        // Vampire effect
        this.applyVampireEffect();

        // Check events
        this.checkGameEvents();
    }

    checkGameEvents(){
        let ships = this.getGame().getShips();

        let winnerShipID = null;
        let gameOver = true;

        // Find a living ship (or if there are multiple)
        for (let [ship, shipIndex] of ships){
            if (ship.isAlive()){
                // Find winner
                if (winnerShipID === null){
                    winnerShipID = ship.getID();
                }else{
                    // > 1 ship alive
                    gameOver = false;
                    break;
                }
            }
        }

        // Go to winning screen
        if (gameOver){
            this.handleGameOver(winnerShipID);
        }

    }

    handleGameOver(winnerShipID){
        let game = this.getGame();

        // Stop updating entity frame positions
        this.getGame().setUpdatingFramePositions(false);
        // Stop running
        this.running = false;

        let winningScreenSettings = game.getGameProperties()["winning_screen_settings"];
        let colourCode = winningScreenSettings["neutral_colour"];
        let winningText = winningScreenSettings["neutral_text"];

        // Determine how end is displayed
        if (game.hasFocusedShip()){
            let myShipID = game.getFocusedShip().getID();
            if (myShipID === winnerShipID){
                colourCode = winningScreenSettings["winning_colour_code"];
                winningText = winningScreenSettings["winning_text"];
            }else{
                colourCode = winningScreenSettings["losing_colour_code"];
                winningText = winningScreenSettings["losing_text"];
            }
        }

        // Set up display
        this.winScreen.setUp(winningText, colourCode);
    }

    isRunning(){
        return this.running;
    }

    getName(){ return "skirmish"; }

    getGame(){
        return GC.getGameInstance();
    }

    display(){
        // Display game
        this.getGame().display();

        if (!this.isRunning()){
            this.winScreen.display();
        }else{
            this.displayHUD();
        }
    }

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
        hud.updateElement("health", this.getGame().getFocusedEntity().getHealth());
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