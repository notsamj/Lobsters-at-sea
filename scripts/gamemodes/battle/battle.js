class Battle extends Gamemode {

    constructor(){
        super();

        console.log("new ba")

         // Placeholder
        this.serverStartTime = undefined;
        this.tickGapMS = undefined;
        this.maxDelayMS = undefined;
    }

    end(){
        // When receive end, tell the Server connection that it's not needed anymore
        SC.setUserInterest(false);
        SC.terminateConnection();
    }

    calculateExpectedTicks(){
       return (GC.getGameTickScheduler().getLastTickTime() - (this.serverStartTime)) / this.tickGapMS;
    }

    async tryToUpdateFromServer(){
        // Get all the tick messages
        let mailBox = SC.getClientMailbox();

        // Await access
        await mailBox.getAccess();

        let tickMessagesFolder = mailBox.getFolder("tick_data");
        let tickMessages = tickMessagesFolder["list"];

        let game = this.getGame();
        let previousTick = game.getTickCount();

        // Look for message meeting conditions
        let lastRelevantUpdate = null;
        let messageCount = tickMessages.getLength();
        for (let i = messageCount - 1; i >= 0; i--){
            let tickMSGJSON = tickMessages.get(i);
            //console.log("msg found foreign,local", tickMSGJSON["data_json"]["server_tick"], previousTick)
            // If we reached a read mesasge, cancel
            if (tickMSGJSON["read"]){
                //console.log("Its read")
                break;
            }
            let tickMSGDataJSON = tickMSGJSON["data_json"];
            let tick = tickMSGDataJSON["server_tick"];
            // Ignore one's above desired tick
            if (tick > previousTick){
                //console.log("Its over")
                continue;
            }

            // Else it's a good update
            lastRelevantUpdate = tickMSGJSON;
            break;
        }

        // Relinquish access
        mailBox.relinquishAccess();

        // Look at what was found
        
        // No relevant update
        if (lastRelevantUpdate === null){
            /*console.log("no update", messageCount)
            if (messageCount > 0){
                stop();
            }*/
            
            return;
        }


        // Set read
        lastRelevantUpdate["read"] = true;

        let relevantDataToUpdateFrom = lastRelevantUpdate["data_json"];
        // TODO: Update
        
        let ticksAhead = previousTick - lastRelevantUpdate["data_json"]["server_tick"];
        this.updateShipsPositions(ticksAhead, lastRelevantUpdate["data_json"]["tick_data"]["ship_positions"]);
    }

    updateShipsPositions(ticksAhead, shipPositions){
        for (let shipJSON of shipPositions){
            let ship = this.getShipByID(shipJSON["id"]);
            // If failed to find ship
            if (ship === null){
                throw new Error("Ship not found: " + shipJSON["id"] + ".");
            }
            ship.updateFromJSONPosition(ticksAhead, shipJSON);
        }
    }

    getShipByID(shipID){
        let ships = this.getGame().getShips();
        for (let [ship, shipIndex] of ships){
            if (ship.getID() === shipID){
                return ship;
            }
        }
        return null;
    }

    setup(gameDetailsJSON){
        let game = this.getGame();
        // Set data received
        this.serverStartTime = gameDetailsJSON["server_start_time"]; 
        console.log("received", gameDetailsJSON);

        // Update game properties
        game.setGameProperties(gameDetailsJSON["game_properties"]);

        // Run a check on tick rate to make sure it matches
        let lgp = GC.getLocalGameProperties();
        let fgp = game.getGameProperties();

        // Check tick rate matches
        if (fgp["tick_rate"] != lgp["tick_rate"]){
            throw new Error("Tick rates are not equal: " + fgp["tick_rate"].toString() + ',' + lgp["tick_rate"].toString());
        }

        // Update tick game ms
        this.tickGapMS = 1000 / fgp["tick_rate"]; // float likely
        this.maxDelayMS = fgp["max_delay_ms"];

        // TODO: Check for other relevant incongruencies

        // Add ships
        for (let shipJSON of gameDetailsJSON["ships"]){
            // Add game
            shipJSON["game_instance"] = game;
            game.addShip(new Ship(shipJSON));
        }

        /*

        let tempShipJSON = {
            "starting_x_pos": 0,
            "starting_y_pos": 0,
            "starting_x_velocity": 0,
            "starting_y_velocity": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 1,
            "ship_model": "generic_ship",
            "game_instance": game,
            "id": this.getGame().getIDManager().generateNewID()
        }
        let tempShip = new Ship(tempShipJSON);
        game.addShip(tempShip);

        // Focus
        game.setFocusedShip(tempShip);
        

        // Add test ship
        let tempShip2JSON = {
            "starting_x_pos": 500,
            "starting_y_pos": 0,
            "starting_x_velocity": 0,
            "starting_y_velocity": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 0,
            "ship_model": "generic_ship",
            "game_instance": game,
            "id": this.getGame().getIDManager().generateNewID()
        }

        let tempShip2 = new Ship(tempShip2JSON);
        //game.addShip(tempShip2);*/
    }

    async checkIfTickCountIsProper(){
        let currentTicks = this.getGame().getTickCount();
        let ticksIfITickNow = currentTicks + 1;
        let expectedTicks = this.calculateExpectedTicks();

        let delayGapTicks = expectedTicks - ticksIfITickNow;
        let delayMS = delayGapTicks * this.getTickGapMS();

        // If running too slow, quit
        if (delayMS > this.maxDelayMS){
            return false;
        }

        // Check server communication 
        // Get all the tick messages
        let mailBox = SC.getClientMailbox();

        // Await access
        await mailBox.getAccess();

        let tickMessagesFolder = mailBox.getFolder("tick_data");
        let tickMessages = tickMessagesFolder["list"];

        let lastServerTickUpdate = 0; // Default to start up

        // If we have received tick updates then....
        if (tickMessages.getLength() > 0){
            lastServerTickUpdate = tickMessages.get(tickMessages.getLength() - 1)["data_json"]["server_tick"];
        }

        // Give up access
        mailBox.relinquishAccess();

        let serverDelayMS = (expectedTicks - lastServerTickUpdate) * this.getTickGapMS();

        // Server delay issues
        if (serverDelayMS > this.maxDelayMS){
            return false;
        }

        return true;
    }

    handlePause(){
        // DO NOTHING
    }

    getTickGapMS(){
        return this.tickGapMS;
    }

    handleGameExit(){
        GC.getMenuManager().switchTo("main_menu");
        GC.getGamemodeManager().getActiveGamemode().end();
        GC.getGamemodeManager().deleteActiveGamemode();
    }

    async tick(){
        // Check if the tick count is proper  
        let tickCountIsProper = await this.checkIfTickCountIsProper();
        if (tickCountIsProper){
            // Try to update from the server
            await this.tryToUpdateFromServer();

            // Tick the game
            this.getGame().tick();
        }else{
            this.handleGameExit();
        }

    }

    getName(){ return "battle"; }

    getGame(){
        return GC.getRemoteGameInstance();
    }

    display(){
        // Display game
        this.getGame().display();

        let hud = GC.getHUD();

        // Display FPS
        let fps = GC.getFrameCounter().getFPS();
        hud.updateElement("fps", fps);

        // Display wind direction
        let windDirection = toDegrees(this.getGame().getWind().getWindDirectionRAD()).toFixed(2);
        hud.updateElement("wind direction", windDirection);
        hud.updateElement("wind force", this.getGame().getWind().getWindMagnitude().toFixed(2));

        // Display HUD for focused ship
        hud.updateElement("x", this.getGame().getFocusedEntity().getTickX().toFixed(2));
        hud.updateElement("x_v", this.getGame().getFocusedEntity().getTickXV().toFixed(2));
        hud.updateElement("y", this.getGame().getFocusedEntity().getTickY().toFixed(2));
        hud.updateElement("y_v", this.getGame().getFocusedEntity().getTickYV().toFixed(2));
        hud.updateElement("orientation", toDegrees(this.getGame().getFocusedEntity().getTickOrientation()).toFixed(2));
        hud.updateElement("sail strength", this.getGame().getFocusedEntity().getTickSailStrength().toFixed(2));
        

        // Display HUD
        hud.display();
    }
}