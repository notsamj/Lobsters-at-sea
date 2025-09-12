/*
    Class Name: Battle
    Description: Battle gamemode
*/
class Battle extends Gamemode {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super();

        this.windData = new NotSamLinkedList();

        this.winningScreen = new WinningScreen();

         // Placeholder
        this.serverStartTime = undefined;
        this.tickGapMS = undefined;
        this.maxDelayMS = undefined;
    }

    /*
        Method Name: hasGameEnded
        Method Parameters: None
        Method Description: Checks if the game has ended
        Method Return: boolean
    */
    hasGameEnded(){
        return this.winningScreen.isActive();
    }

    /*
        Method Name: end
        Method Parameters: None
        Method Description: Ends the server the client's intention to quit
        Method Return: void
    */
    end(){
        // Inform server that "I quit"
        SC.sendJSON({
            "subject": "desire_to_play_battle",
            "value": false
        });
    }

    /*
        Method Name: calculateExpectedTicks
        Method Parameters: None
        Method Description: Calculates the expected number of tickets elapsed
        Method Return: float
    */
    calculateExpectedTicks(){
       return (GC.getGameTickScheduler().getLastTickTime() - (this.serverStartTime)) / this.tickGapMS;
    }

    /*
        Method Name: updateTickDataFromServer
        Method Parameters: None
        Method Description: Takes tick data from the server and updates the game
        Method Return: void
    */
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

    /*
        Method Name: catchUpCannonBallMovement
        Method Parameters: 
            newCannonBall:
                A new cannon ball object
            serverTickOfLaunches:
                The server tick of the cannon ball's launch
            endTick:
                The tick at which the cannon ball will be acaught up
        Method Description: Catches up the cannon ball's movement
        Method Return: void
    */
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
            throw new Error("Failed to find wind for given tick.");
        }

        // Loop from start to end
        for (let i = serverTickOfLaunches; i < endTick; i++){
            let windTickOffset = i - serverTickOfLaunches;
            newCannonBall.updateMovementOneTickWithWind(this.windData.get(windIndex + windTickOffset));
        }
    }

    /*
        Method Name: readTickData
        Method Parameters: 
            tickDataJSON:
                JSON of information about a tick
            serverTick:
                The tick numbet from the server's POV
            currentTick:
                The current tick locally
        Method Description: Reads some tick data and takes actions
        Method Return: void
    */
    readTickData(tickDataJSON, serverTick, currentTick){
        // Process new cannon shots
        this.processCannonBallLaunches(tickDataJSON["new_cannon_shots"], serverTick, currentTick);

        // Process cannon balls hitting ships
        this.processCannonBallHits(tickDataJSON["cannon_ball_hits"], serverTick);

        // Process cannon balls hitting water
        this.processCannonBallSinkings(tickDataJSON["cannon_ball_sinkings"], serverTick);

        // Process cannon balls hitting water
        this.processShipSinkings(tickDataJSON["ship_sinkings"], serverTick);

        // Play sounds
        this.queueUpSounds(tickDataJSON);
    }

    /*
        Method Name: processCannonBallLaunches
        Method Parameters: 
            cannonBallShots:
                A list of cannon ball shot JSON objects
            serverTickOfLaunches:
                The tick number at which these cannon balls were launched
            currentTick:
                The current tick
        Method Description: Processes some cannon ball launches
        Method Return: void
    */
    processCannonBallLaunches(cannonBallShots, serverTickOfLaunches, currentTick){
        let gameInstance = this.getGame();
        let cannonBallSettings = gameInstance.getGameProperties()["cannon_ball_settings"];
        for (let cannonShotJSON of cannonBallShots){
            cannonShotJSON["game_instance"] = gameInstance;
            cannonShotJSON["death_tick"] = serverTickOfLaunches + cannonBallSettings["ticks_until_hit_water"];
            let newCannonBall = new CannonBall(cannonShotJSON);
            
            // Catch up cannon ball, past -> now

            // Lock the cannon 
            this.lockShipCannon(cannonShotJSON["ship_origin_id"], cannonShotJSON["cannon_index"], currentTick - serverTickOfLaunches);
            
            // Set up the cannon ball
            this.catchUpCannonBallMovement(newCannonBall, serverTickOfLaunches, currentTick-1);

            // Set up the cannon smoke
            this.createCannonSmoke(cannonShotJSON, serverTickOfLaunches);
            
            this.getGame().addCannonBall(newCannonBall);
        }
    }

    /*
        Method Name: lockShipCannon
        Method Parameters: 
            shipID:
                The id of the ship associated
            cannonIndex:
                The index of the cannon
            ticksSinceLock:
                The number of ticks since the "lock" was locked
        Method Description: Locks a ship's cannon
        Method Return: void
    */
    lockShipCannon(shipID, cannonIndex, ticksSinceLock){
        let cannon = this.getGame().getShipByID(shipID).getCannons()[cannonIndex];
        let reloadLock = cannon.getReloadLock();
        // Lock it
        reloadLock.lock();
        for (let i = 0; i < ticksSinceLock; i++){
            reloadLock.tick();
        }
    }

    /*
        Method Name: queueUpSounds
        Method Parameters: 
            tickDataJSON:
                JSON of information about a tick
        Method Description: Plays sounds in the game
        Method Return: void
    */
    queueUpSounds(tickDataJSON){
        let centerX = this.getGame().getFocusedTickX();
        let centerY = this.getGame().getFocusedTickY();
        let soundManager = GC.getSoundManager();

        let screenWidth = getZoomedScreenWidth();
        let screenHeight = getZoomedScreenHeight();

        // Collect cannonball hits
        for (let cBH of tickDataJSON["cannon_ball_hits"]){
            let x = cBH["x_pos"];
            let y = cBH["y_pos"];
            soundManager.queueUp("cannon_ball_hit", x - centerX, y-centerY);
        }

        // Collect cannon shooting sounds
        for (let cBS of tickDataJSON["new_cannon_shots"]){
            let x = cBS["x_origin"];
            let y = cBS["y_origin"];
            soundManager.queueUp("cannon_shot", x - centerX, y-centerY);
        }

        // Cannon ball sunk
        for (let cBSi of tickDataJSON["cannon_ball_sinkings"]){
            let x = cBSi["x_pos"];
            let y = cBSi["y_pos"];
            soundManager.queueUp("cannon_ball_sinking", x - centerX, y-centerY);
        }

        // Ship sunk
        for (let sS of tickDataJSON["ship_sinkings"]){
            let x = sS["x_pos"];
            let y = sS["y_pos"];
            soundManager.queueUp("ship_sinking", x - centerX, y-centerY);
        }
    }

    /*
        Method Name: createCannonSmoke
        Method Parameters: 
            cBS:
                A JSON with cannon smoke information
            serverTickOfLaunches:
                The server tick of the launch
        Method Description: Creates cannon smoke
        Method Return: void
    */
    createCannonSmoke(cBS, serverTickOfLaunches){
        let visaulEffectsSettings = this.getGame().getGameProperties()["visual_effect_settings"];
        // Add the visual effect
        this.getGame().addVisualEffect(new CannonSmoke(serverTickOfLaunches, this.getGame().getVisualEffectRandomGenerator(), cBS, visaulEffectsSettings["cannon_smoke"]));
    }

    /*
        Method Name: processCannonBallHits
        Method Parameters: 
            cannonBallHits:
                A list of cannon ball hit JSON objects
            serverTick:
                The tick of the server
        Method Description: Processes some cannon ball hits
        Method Return: void
    */
    processCannonBallHits(cannonBallHits, serverTick){
        let visaulEffectsSettings = this.getGame().getGameProperties()["visual_effect_settings"];
        for (let cBH of cannonBallHits){
            // Delete cannon ball
            this.deleteCannonBall(cBH["cannon_ball_id"]);
            // Add the visual effect
            this.getGame().addVisualEffect(new CannonBallHit(serverTick, this.getGame().getVisualEffectRandomGenerator(), cBH, visaulEffectsSettings["cannon_ball_hit"]));
        }
    }

    /*
        Method Name: deleteCannonBall
        Method Parameters: 
            id:
                ID Of a cannon ball
        Method Description: Deletes a specified cannon ball
        Method Return: void
    */
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
            cannonBalls.pop(index);
        }
    }

    /*
        Method Name: processCannonBallSinkings
        Method Parameters: 
            cannonBallSinkings:
                A list of cannon ball sinking event JSONs
            serverTick:
                The tick of the server
        Method Description: Handles cannon ball sinkings
        Method Return: void
    */
    processCannonBallSinkings(cannonBallSinkings, serverTick){
        let visaulEffectsSettings = this.getGame().getGameProperties()["visual_effect_settings"];
        for (let cBSi of cannonBallSinkings){
            // Delete cannon ball
            this.deleteCannonBall(cBSi["cannon_ball_id"]);
            // Add the visual effect
            this.getGame().addVisualEffect(new CannonBallSplash(serverTick, this.getGame().getVisualEffectRandomGenerator(), cBSi, visaulEffectsSettings["cannon_ball_splash"]));
        }
    }
    /*
        Method Name: processShipSinkings
        Method Parameters: 
            shipSinkings:
                A list of ship sinking event JSONs
            serverTick:
                The tick of the server when the events took place
        Method Description: Processes ship sinking events
        Method Return: void
    */
    processShipSinkings(shipSinkings, serverTick){
        let visaulEffectsSettings = this.getGame().getGameProperties()["visual_effect_settings"];
        for (let sS of shipSinkings){
            // Kill ship
            this.killShip(sS["ship_id"]);

            // Add the visual effect
            this.getGame().addVisualEffect(new ShipSplash(serverTick, this.getGame().getVisualEffectRandomGenerator(), sS, visaulEffectsSettings["ship_splash"]));
        }
    }

    /*
        Method Name: killShip
        Method Parameters: 
            shipID:
                ID Of the ship to kill
        Method Description: Kills a given ship
        Method Return: void
    */
    killShip(shipID){
        let ship = this.getGame().getShipByID(shipID);
        // Kill it
        ship.kill();
    }

    /*
        Method Name: recordWind
        Method Parameters: None
        Method Description: Records the current wind details
        Method Return: void
    */
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

    /*
        Method Name: updateShipPositionsFromServer
        Method Parameters: None
        Method Description: Takes information from the server and updates hips
        Method Return: Promise (implicit)
    */
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

    /*
        Method Name: updateShipsPositions
        Method Parameters: 
            ticksAhead:
                The number of ticks ahead the client is from the ship position received
            shipPositions:
                A list of ship position JSONs
        Method Description: Updates ship positions from JSON
        Method Return: void
    */
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

    /*
        Method Name: setup
        Method Parameters: 
            gameDetailsJSON:
                GAME details in a json
        Method Description: Sets up the battle
        Method Return: void
    */
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

    /*
        Method Name: checkEndGame
        Method Parameters: None
        Method Description: Checks if the game is over
        Method Return: Promise<String>
    */
    async checkEndGame(){
        let mailBox = SC.getClientMailbox();

        let winnerID = null;

        // Await access
        await mailBox.requestAccess();

        let endMessagesFolder = mailBox.getFolder("end_data");
        let endMessages = endMessagesFolder["list"];

        // If there's a message to read
        if (endMessages.getLength() > 0){
            let message = endMessages.get(0);
            if (message["read"] === false){
                winnerID = message["data_json"]["winner_id"];
                message["read"] = true;
            }
        }

        // Give up access
        mailBox.relinquishAccess();

        return winnerID;
    }

    /*
        Method Name: checkIfTickCountIsProper
        Method Parameters: None
        Method Description: Checks if the tick count is an acceptable number
        Method Return: Promise<boolean>
    */
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

    /*
        Method Name: handlePause
        Method Parameters: None
        Method Description: Nothing
        Method Return: void
    */
    handlePause(){ /* DO NOTHING */ }

    /*
        Method Name: getTickGapMS
        Method Parameters: None
        Method Description: Getter
        Method Return: number
    */
    getTickGapMS(){
        return this.tickGapMS;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks the game
        Method Return: Promise (implicit)
    */
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
                this.getGame().tick();

                // Handle sending out my input
                this.sendMyInput();
            }

        }else{
            // Error exit
            this.handleGameOver(null, false);
        } 
    }

    /*
        Method Name: experimentalAddressLag
        Method Parameters: None
        Method Description: Experimental function reducing lag
        Method Return: void
    */
    experimentalAddressLag(){
        let ticksBehind = this.calculateExpectedTicks() - this.getGame().getTickCount();
        if (ticksBehind > 2){
            let timeDebtToRemove = ticksBehind * this.getGame().getGameProperties()["ms_between_ticks_floor"];
            // Remove the tick debt
            GC.getGameTickScheduler().addTimeDebt(-1 * timeDebtToRemove);
        }
    }

    /*
        Method Name: handleGameOver
        Method Parameters: 
            winnerID:
                ID of the winner
            hasWinner:
                Boolean whether there is a winner
        Method Description: Handles game over tasks
        Method Return: void
    */
    handleGameOver(winnerID, hasWinner){
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
                if (myShipID === winnerID){
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

    /*
        Method Name: sendMyInput
        Method Parameters: None
        Method Description: Sends my user input to the server
        Method Return: void
    */
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

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: string
    */
    getName(){ return "battle"; }

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

        // Display winning screen if active
        if (this.winningScreen.isActive()){
            this.winningScreen.display();
            return;
        }

        // Else display hud
        this.displayHUD();
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