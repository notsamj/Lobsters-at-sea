class Battle extends Gamemode {

    constructor(){
        super();

        this.windData = new NotSamLinkedList();

        this.winningScreen = new WinningScreen();

         // Placeholder
        this.serverStartTime = undefined;
        this.tickGapMS = undefined;
        this.maxDelayMS = undefined;
    }

    hasGameEnded(){
        return this.winningScreen.isActive();
    }

    end(){
        // Inform server that "I quit"
        SC.sendJSON({
            "subject": "desire_to_play_battle",
            "value": false
        });
    }

    calculateExpectedTicks(){
       return (GC.getGameTickScheduler().getLastTickTime() - (this.serverStartTime)) / this.tickGapMS;
    }

    async updateTickDataFromServer(){
        // If any of the cannon shots recieved predate the oldest wind recording -> ignore

        let oldestWindRecordingTick = this.windData.get(0)["tick"];

        // Get all the tick messages
        let mailBox = SC.getClientMailbox();

        // Await access
        await mailBox.requestAccess();

        let cannonShotFolder = mailBox.getFolder("tick_data");
        let cannonShots = cannonShotFolder["list"];

        let game = this.getGame();
        let previousTick = game.getTickCount();
        //console.log("cb -2", cannonShots.getLength());

        // Look for message meeting conditions
        let lastRelevantUpdate = null;
        let messageCount = cannonShots.getLength();
        for (let i = messageCount - 1; i >= 0; i--){
            let tickDataJSON = cannonShots.get(i);
            // If we reached a read mesasge, cancel
            if (tickDataJSON["read"]){
                break;
            }
            let tickMSGDataJSON = tickDataJSON["data_json"];
            let tick = tickMSGDataJSON["server_tick"];
            // Ignore one's above desired tick
            if (tick > previousTick){
                continue;
            }
            // a message that is too old to be useful
            else if (tickDataJSON["data_json"]["server_tick"] < oldestWindRecordingTick){
                tickDataJSON["read"] = true; // just so no need to check again, mark read
                break;
            }

            // Else it's a worthwhile update
            lastRelevantUpdate = tickDataJSON;
            // Set read
            lastRelevantUpdate["read"] = true;

            let relevantDataToUpdateFrom = lastRelevantUpdate["data_json"];
            this.readTickData(relevantDataToUpdateFrom, tickDataJSON["data_json"]["server_tick"], previousTick);
        }

        // Relinquish access
        mailBox.relinquishAccess();
    }

    catchUpCannonBallMovement(newCannonBall, serverTickOfLaunches, endTick){
        // No need to catch up
        if (endTick === serverTickOfLaunches){
            return;
        }

        let windIndex = -1;
        for (let i = this.windData.getLength() - 1; i >= 0; i--){
            let data = this.windData.get(i);
            if (data["tick"] === serverTickOfLaunches){
                windIndex = i;
                break;
            }
        }

        // Expect this won't happen
        if (windIndex === -1){
            debugger;
            throw new Error("Failed to find wind for given tick.");
        }

        // Loop from start to end
        for (let i = serverTickOfLaunches; i < endTick; i++){
            let windTickOffset = i - serverTickOfLaunches;
            newCannonBall.updateMovementOneTickWithWind(this.windData.get(windIndex + windTickOffset));
        }
    }

    readTickData(tickDataJSON, serverTick, currentTick){
        // Process new cannon shots
        this.processCannonBallLaunches(tickDataJSON["new_cannon_shots"], serverTick, currentTick);

        // Process cannon balls hitting ships
        this.processCannonBallHits(tickDataJSON["cannon_ball_hits"], serverTick);

        // Process cannon balls hitting water
        this.processCannonBallSinkings(tickDataJSON["cannon_ball_sinkings"], serverTick);

        // Process cannon balls hitting water
        this.processShipSinkings(tickDataJSON["ship_sinkings"], serverTick);
    }

    processCannonBallLaunches(cannonBallShots, serverTickOfLaunches, currentTick){
        let gameInstance = this.getGame();
        let cannonBallSettings = gameInstance.getGameProperties()["cannon_ball_settings"];
        for (let cannonShotJSON of cannonBallShots){
            cannonShotJSON["game_instance"] = gameInstance;
            cannonShotJSON["death_tick"] = serverTickOfLaunches + cannonBallSettings["ticks_until_hit_water"];
            let newCannonBall = new CannonBall(cannonShotJSON);
            
            // Catch up cannon ball, past -> now
            //debugger;

            // Lock the cannon 
            this.lockShipCannon(cannonShotJSON["ship_origin_id"], cannonShotJSON["cannon_index"], currentTick - serverTickOfLaunches);
            
            // Set up the cannon ball
            this.catchUpCannonBallMovement(newCannonBall, serverTickOfLaunches, currentTick-1);

            // Set up the cannon smoke
            this.createCannonSmoke(cannonShotJSON, serverTickOfLaunches);
            
            //console.log("new cannon ball", newCannonBall);
            this.getGame().addCannonBall(newCannonBall);
        }
    }

    lockShipCannon(shipID, cannonIndex, ticksSinceLock){
        let cannon = this.getGame().getShipByID(shipID).getCannons()[cannonIndex];
        let reloadLock = cannon.getReloadLock();
        // Lock it
        reloadLock.lock();
        for (let i = 0; i < ticksSinceLock; i++){
            reloadLock.tick();
        }
    }

    createCannonSmoke(cBS, serverTickOfLaunches){
        let visaulEffectsSettings = this.getGame().getGameProperties()["visual_effect_settings"];
        // Add the visual effect
        this.getGame().addVisualEffect(new CannonSmoke(serverTickOfLaunches, this.getGame().getVisualEffectRandomGenerator(), cBS, visaulEffectsSettings["cannon_smoke"]));
    }

    processCannonBallHits(cannonBallHits, serverTick){
        let visaulEffectsSettings = this.getGame().getGameProperties()["visual_effect_settings"];
        //debugger;
        for (let cBH of cannonBallHits){
            // Delete cannon ball
            this.deleteCannonBall(cBH["cannon_ball_id"]);
            // Add the visual effect
            this.getGame().addVisualEffect(new CannonBallHit(serverTick, this.getGame().getVisualEffectRandomGenerator(), cBH, visaulEffectsSettings["cannon_ball_hit"]));
        }
    }

    deleteCannonBall(id){
        let index = -1;
        let cannonBalls = this.getGame().getCannonBalls();
        for (let [cannonBall, cannonBallIndex] of cannonBalls){
            if (cannonBall.getID() === id){
                index = cannonBallIndex;
                break;
            }
        }

        // If found, remove
        if (index != -1){
            let cannonBall = cannonBalls.get(index);
            //console.log(this.getGame().getWind().print());
            //console.log("Cannon ball sunk", cannonBall.getTickX(), cannonBall)
            cannonBalls.pop(index);
        }
    }

    processCannonBallSinkings(cannonBallSinkings, serverTick){
        let visaulEffectsSettings = this.getGame().getGameProperties()["visual_effect_settings"];
        for (let cBSi of cannonBallSinkings){
            // Delete cannon ball
            this.deleteCannonBall(cBSi["cannon_ball_id"]);
            // Add the visual effect
            //console.log("Added", cBSi["x_pos"], serverTick - this.getGame().getTickCount())
            //debugger;
            this.getGame().addVisualEffect(new CannonBallSplash(serverTick, this.getGame().getVisualEffectRandomGenerator(), cBSi, visaulEffectsSettings["cannon_ball_splash"]));
        }
    }
    processShipSinkings(shipSinkings, serverTick){
        let visaulEffectsSettings = this.getGame().getGameProperties()["visual_effect_settings"];
        for (let sS of shipSinkings){
            //console.log("Found one")
            // Kill ship
            this.killShip(sS["ship_id"]);
            // Add the visual effect
            this.getGame().addVisualEffect(new ShipSplash(serverTick, this.getGame().getVisualEffectRandomGenerator(), sS, visaulEffectsSettings["ship_splash"]));
        }
    }

    killShip(shipID){
        for (let [ship, shipIndex] of this.getGame().getShips()){
            if (ship.getID() === shipID){
                ship.kill();
                return;
            }
        }
        throw new Error("Error finding ship: " + shipID);
    }

    async recordWind(){
        let wind = this.getGame().getWind();
        let windDataForThisTick = {
            "tick": this.getGame().getTickCount(),
            "wind_magntiude": wind.getWindMagnitude(), 
            "wind_direction_rad": wind.getWindDirectionRAD()
        }
        this.windData.push(windDataForThisTick);

        let maxWindDataSize = this.getGame().getGameProperties()["max_delay_ticks"];

        // Remove first element when it gets too big
        if (this.windData.getLength() > maxWindDataSize){
            this.windData.pop(0);
        }
    }

    async updateShipPositionsFromServer(){
        // Get all the tick messages
        let mailBox = SC.getClientMailbox();

        // Await access
        await mailBox.requestAccess();

        let tickMessagesFolder = mailBox.getFolder("position_data");
        let tickMessages = tickMessagesFolder["list"];

        let game = this.getGame();
        let previousTick = game.getTickCount();

        // Look for message meeting conditions
        let lastRelevantUpdate = null;
        let messageCount = tickMessages.getLength();
        for (let i = messageCount - 1; i >= 0; i--){
            let tickMSGJSON = tickMessages.get(i);
            // If we reached a read mesasge, cancel
            if (tickMSGJSON["read"]){
                break;
            }
            let tickMSGDataJSON = tickMSGJSON["data_json"];
            let tick = tickMSGDataJSON["server_tick"];
            // Ignore one's above desired tick
            if (tick > previousTick){
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
            return;
        }

        // Set read
        lastRelevantUpdate["read"] = true;

        let relevantDataToUpdateFrom = lastRelevantUpdate["data_json"];
        
        let ticksAhead = previousTick - lastRelevantUpdate["data_json"]["server_tick"];
        this.updateShipsPositions(ticksAhead, lastRelevantUpdate["data_json"]["ship_positions"]);
    }

    updateShipsPositions(ticksAhead, shipPositions){
        for (let shipJSON of shipPositions){
            let ship = this.getGame().getShipByID(shipJSON["id"]);
            // If failed to find ship
            if (ship === null){
                throw new Error("Ship not found: " + shipJSON["id"] + ".");
            }
            ship.updateFromJSONPosition(ticksAhead, shipJSON);
        }
    }

    setup(gameDetailsJSON){
        let game = this.getGame();
        // Set data received
        this.serverStartTime = gameDetailsJSON["server_start_time"]; 

        // Update game properties
        game.setGameProperties(gameDetailsJSON["game_properties"]);

        // Run a check on tick rate to make sure it matches
        let lgp = GC.getLocalGameProperties();
        let fgp = game.getGameProperties();

        // Check tick rate matches
        if (fgp["tick_rate"] != lgp["tick_rate"]){
            throw new Error("Tick rates are not equal: " + fgp["tick_rate"].toString() + ',' + lgp["tick_rate"].toString());
        }

        // Check delay ms matches
        if (fgp["max_delay_ms"] != lgp["max_delay_ms"]){
            throw new Error("Delay MS values are not equal: " + fgp["max_delay_ms"].toString() + ',' + lgp["max_delay_ms"].toString());
        }

        // Update tick game ms
        this.tickGapMS = 1000 / lgp["tick_rate"]; // float likely
        this.maxDelayMS = lgp["max_delay_ms"];

        // set up wind to mirror server
        game.getWind().reset();

        // TODO: Check for other relevant incongruencies

        // Add ships
        for (let shipJSON of gameDetailsJSON["ships"]){
            // Add game
            shipJSON["game_instance"] = game;
            game.addShip(new Ship(shipJSON));
        }

        // Handle client controlled ship
        if (gameDetailsJSON["clients_are_players"]){
            game.setFocusedShip(game.getShipByID(gameDetailsJSON["your_ship_id"]));
        }
    }

    async checkEndGame(){
        let mailBox = SC.getClientMailbox();

        let winner = null;

        // Await access
        await mailBox.requestAccess();

        let endMessagesFolder = mailBox.getFolder("end_data");
        let endMessages = endMessagesFolder["list"];

        // If there's a message to read
        if (endMessages.getLength() > 0){
            let message = endMessages.get(0);
            if (message["read"] === false){
                winner = message["data_json"]["winner_id"];
                message["read"] = true;
            }
        }

        // Give up access
        mailBox.relinquishAccess();

        return winner;
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
        await mailBox.requestAccess();

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

    handlePause(){ /* DO NOTHING */ }

    getTickGapMS(){
        return this.tickGapMS;
    }

    async tick(){
        // Nothing to do when over
        if (this.hasGameEnded()){
            return;
        }

        // Check if the tick count is proper  
        let tickCountIsProper = await this.checkIfTickCountIsProper();
        if (tickCountIsProper){
            // Record wind at current tick
            this.recordWind();

            // Check these important events
            await this.updateTickDataFromServer();

            // Try to update from the server
            await this.updateShipPositionsFromServer();

            let winner = await this.checkEndGame();
            let hasWinner = winner != null;

            // If over and we have a winner
            if (hasWinner){
                this.handleGameOver(winner, hasWinner);
            }else{
                // Else continue the game

                // Tick the game
                //this.getGame().getWind().print();
                this.getGame().tick();

                // Handle sending out my input
                this.sendMyInput();
            }

        }else{
            // Error exit
            this.handleGameOver(null, false);
        } 

        // Address lag
        //this.experimentalAddressLag();
    }

    experimentalAddressLag(){
        let ticksBehind = this.calculateExpectedTicks() - this.getGame().getTickCount();
        if (ticksBehind > 2){
            let timeDebtToRemove = ticksBehind * this.getGame().getGameProperties()["ms_between_ticks_floor"];
            // Remove the tick debt
            GC.getGameTickScheduler().addTimeDebt(-1 * timeDebtToRemove);
        }
    }

    handleGameOver(winner, hasWinner){
        // Disconnect from server
        this.end();

        let game = this.getGame();

        // Stop updating entity frame positions
        game.setUpdatingFramePositions(false);

        let endProperly = hasWinner;
        let winningScreenSettings = game.getGameProperties()["winning_screen_settings"];
        let colourCode = winningScreenSettings["neutral_colour"];
        let winningText = winningScreenSettings["neutral_text"];

        // Determine how end is displayed
        if (endProperly){
            if (game.hasFocusedShip()){
                let myShipID = game.getFocusedShip().getID();
                if (myShipID === winner){
                    colourCode = winningScreenSettings["winning_colour_code"];
                    winningText = winningScreenSettings["winning_text"];
                }else{
                    colourCode = winningScreenSettings["losing_colour_code"];
                    winningText = winningScreenSettings["losing_text"];
                }
            }
        }
        // Else, it ended with an error
        else{
            colourCode = winningScreenSettings["error_colour_code"];
            winningText = winningScreenSettings["error_text"];
        }

        // Set up display
        this.winningScreen.setUp(winningText, colourCode);
    }

    sendMyInput(){
        let game = this.getGame();
        // Ignore if no focused ship
        if (!game.hasFocusedShip()){ return; }

        // Get the pending decisions
        let pendingDecisions = game.getFocusedShip().getPendingDecisions();

        // Send them
        let infoJSON = {
            "subject": "pending_decisions",
            "ship_id": game.getFocusedShip().getID(),
            "pending_decisions": pendingDecisions
        }

        SC.sendJSON(infoJSON);
    }

    getName(){ return "battle"; }

    getGame(){
        return GC.getGameInstance();
    }

    display(){
        // Display game
        this.getGame().display();

        // Display winning screen if active
        if (this.winningScreen.isActive()){
            this.winningScreen.display();
            return;
        }

        // Else display hud
        this.displayHUD();
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