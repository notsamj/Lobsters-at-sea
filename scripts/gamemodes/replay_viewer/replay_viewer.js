class ReplayViewer extends Gamemode {

    constructor(){
        super();

        this.winningScreen = new WinningScreen();

        this.timeline = undefined; // Placeholder
        this.currentTimelineIndex = 0;

        this.launch(LOCAL_REPLAYS[0]["data"]);
    }

    isRunning(){
        return !this.winningScreen.isActive();
    }

    launch(replayString){
        let game = this.getGame();
        let replayJSON = JSON.parse(replayString);
        let gameDetails = replayJSON["opening_message"]["game_details"];
        this.timeline = replayJSON["timeline"];

        // Set data received

        // Update game properties
        game.setGameProperties(gameDetails["game_properties"]);

        // Run a check on tick rate to make sure it matches
        let lgp = GC.getLocalGameProperties();
        let fgp = game.getGameProperties();
        //debugger;

        // Check tick rate matches
        if (fgp["tick_rate"] != lgp["tick_rate"]){
            throw new Error("Tick rates are not equal: " + fgp["tick_rate"].toString() + ',' + lgp["tick_rate"].toString());
        }

        // Check delay ms matches
        if (fgp["max_delay_ms"] != lgp["max_delay_ms"]){
            throw new Error("Delay MS values are not equal: " + fgp["max_delay_ms"].toString() + ',' + lgp["max_delay_ms"].toString());
        }

        // set up wind to mirror server
        game.getWind().reset();

        // TODO: Check for other relevant incongruencies

        // Add ships
        for (let shipJSON of gameDetails["ships"]){
            // Add game
            shipJSON["game_instance"] = game;
            game.addShip(new Ship(shipJSON));
        }
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

    applyPendingDecisions(){
        // If run out of timeline
        if (this.timeline.length <= this.currentTimelineIndex){
            return;
        }

        let nextTick = this.getGame().getTickCount(); // This is after tick has been counted so it's right
            
        let timelineTickObj = this.timeline[this.currentTimelineIndex];
        let timeLineCurrentTick = timelineTickObj["tick"];

        // Note: Assuming no changes on tick zero (shouldn't be possible because these are established and those are set 1 tick after pending)
        if (timeLineCurrentTick < nextTick){
            throw new Error("Encountered invalid timeline tick");
        }

        // Haven't arrived there yet
        if (timeLineCurrentTick > nextTick){
            return;
        }


        // So now we know that we have the timeline data for the next tick
        let timelineTickList = timelineTickObj["update_list"];
        for (let update of timelineTickList){
            let pendingDecisionsForShip = this.getGame().getShipByID(update["ship_id"]).getPendingDecisions();

            // Modify based on the update
            for (let decisionName of Object.keys(update["decisions_updated"])){
                pendingDecisionsForShip[decisionName] = update["decisions_updated"][decisionName];
                //console.log(decisionName, update["decisions_updated"][decisionName])
                //debugger;
            }
        }

        // Increment for next one
        this.currentTimelineIndex++;
    }

    end(){
        let winnerShipID = null;
        let aliveCount = 0;

        // Try to find the winner
        for (let [ship, shipIndex] of this.getGame().getShips()){
            if (ship.isAlive()){
                aliveCount++;
                if (aliveCount > 1){
                    break;
                }
                winnerShipID = ship.getID();
            }
        }

        let gameCompleted = winnerShipID != null;
        this.handleGameOver(gameCompleted);
    }

    handleGameOver(hasWinner){
        let game = this.getGame();

        // Stop updating entity frame positions
        game.setUpdatingFramePositions(false);

        let winningScreenSettings = game.getGameProperties()["winning_screen_settings"];
        let colourCode = winningScreenSettings["neutral_colour"];
        let winningText = winningScreenSettings["neutral_text"];

        // Determine how end is displayed
        if (!hasWinner){
            colourCode = winningScreenSettings["error_colour_code"];
            winningText = winningScreenSettings["error_text"];
        }

        // Set up display
        this.winningScreen.setUp(winningText, colourCode);
    }

    checkWin(){
        let ships = this.getGame().getShips();
        let shipsAlive = 0;
        for (let [ship, shipIndex] of ships){
            if (!ship.isDead()){
                shipsAlive++;
            }
        }

        // If 1 or fewer ships are left, game is over
        if (shipsAlive <= 1){
            this.end();
            return;
        }
    }

    tick(){
        // Don't tick when over
        if (!this.isRunning()){
            return;
        }

        // Check win
        this.checkWin();

        // Tick the game
        this.getGame().tick();

        // Set up pending decisions
        this.applyPendingDecisions();
    }

    getName(){ return "replay_viewer"; }

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
        hud.updateElement("orientation", toDegrees(this.getGame().getFocusedEntity().getTickOrientation()).toFixed(2));
        hud.updateElement("sail strength", this.getGame().getFocusedEntity().getTickSailStrength().toFixed(2));
        hud.updateElement("id", this.getGame().getFocusedEntity().getID());
        

        // Display HUD
        hud.display();
    }
}