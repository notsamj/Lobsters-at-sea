/*
    Class Name: ReplayViewer
    Description: Gamemode for viewing replays
*/
class ReplayViewer extends Gamemode {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super();

        this.winningScreen = new WinningScreen();

        this.timeline = undefined; // Placeholder
        this.lastTick = undefined;
        this.currentTimelineIndex = 0;

        this.mode = undefined;
        this.replayJSON = undefined;

        this.running = false;

        // UI
        this.paused = false;
        this.playPauseButton = undefined;
        this.slider = undefined; // Declare
        this.setupUI();

        this.sliderTicks = 0;
    }

    /*
        Method Name: hasData
        Method Parameters: None
        Method Description: Checks if the data is present
        Method Return: boolean
    */
    hasData(){
        return this.replayJSON != undefined;
    }

    /*
        Method Name: pauseUnpauseReplay
        Method Parameters: None
        Method Description: Toggles whether the replay is paused
        Method Return: void
    */
    pauseUnpauseReplay(){
        if (this.isReplayPaused()){
            this.unpauseReplay();
        }else{
            this.pauseReplay();
        }
    }

    /*
        Method Name: pauseReplay
        Method Parameters: None
        Method Description: Pauses replay
        Method Return: void
    */
    pauseReplay(){
        this.paused = true;
        this.getGame().setUpdatingFramePositions(false);
    }

    /*
        Method Name: unpauseReplay
        Method Parameters: None
        Method Description: Unpauses replay
        Method Return: void
    */
    unpauseReplay(){
        this.paused = false;
        this.updateToNewTicks();
        this.handleUnpause();
        this.getGame().setUpdatingFramePositions(true);
    }

    /*
        Method Name: resetForTickJump
        Method Parameters: None
        Method Description: Reset the reviewer before jumping ticks
        Method Return: void
    */
    resetForTickJump(){
        this.winningScreen.reset();
        this.getGame().reset();
        this.currentTimelineIndex = 0;
        this.running = false;
    }

    /*
        Method Name: updateToNewTicks
        Method Parameters: None
        Method Description: Jumps to a new tick
        Method Return: void
    */
    updateToNewTicks(){
        this.resetForTickJump();
        let game = this.getGame();
        this.loadFromJSON(this.replayJSON);

        // Loop until ticks match
        while (game.getTickCount() != this.sliderTicks){
            let before = game.getTickCount();
            this.tickGame();
        }
        GC.getSoundManager().clearSoundQueue();

        // Mark running
        this.running = true;
    }

    /*
        Method Name: isReplayPaused
        Method Parameters: None
        Method Description: Checks if the replay is pauded
        Method Return: boolean
    */
    isReplayPaused(){
        return this.paused;
    }

    /*
        Method Name: getSliderTicks
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getSliderTicks(){
        return this.sliderTicks;
    }

    /*
        Method Name: setSliderTicks
        Method Parameters: 
            sliderTicks:
                Number of ticks selected by the slider
        Method Description: Changes the number of slider ticks
        Method Return: void
    */
    setSliderTicks(sliderTicks){
        // When update -> pause
        if (!this.isReplayPaused()){
            this.pauseReplay();
        }
        this.sliderTicks = sliderTicks;
    }

    /*
        Method Name: ticksToTimeStamp
        Method Parameters: 
            ticks:
                Number of ticks
        Method Description: Converts a tick number to a string
        Method Return: String
    */
    ticksToTimeStamp(ticks){
        let totalSeconds = Math.floor(this.getGame().getGameProperties()["ms_between_ticks"] * ticks / 1000);
        let hours = Math.floor(totalSeconds / (60 * 60));
        let minutes = Math.floor((totalSeconds - hours * (60 * 60)) / 60);
        let seconds = totalSeconds - hours * (60 * 60) - minutes * 60;
        let hoursString;
        if (hours >= 10){
            hoursString = hours.toString();
        }else{
            hoursString = "0" + hours.toString();
        }

        let minutesString;
        if (minutes >= 10){
            minutesString = minutes.toString();
        }else{
            minutesString = "0" + minutes.toString();
        }

        let secondsString;
        if (seconds >= 10){
            secondsString = Math.floor(seconds).toString();
        }else{
            secondsString = "0" + Math.floor(seconds).toString();
        }
        return hoursString + ":" + minutesString + ":" + secondsString;
    }

    /*
        Method Name: setupUI
        Method Parameters: None
        Method Description: Sets up the UI
        Method Return: void
    */
    setupUI(){
        let pauseColour = MSD["replay_viewer"]["pause_colour_code"];
        let playColour = MSD["replay_viewer"]["play_colour_code"];
        let textColour = MSD["replay_viewer"]["play_pause_text_colour_code"];

        let sideBuffer = MSD["replay_viewer"]["size_buffer"];

        let playPauseButtonHeight = MSD["replay_viewer"]["play_pause_height"];
        let playPauseButtonWidth = MSD["replay_viewer"]["play_pause_width"];

        let sliderHeight = MSD["replay_viewer"]["slider_height"];
        let sliderTextHeight = MSD["replay_viewer"]["slider_text_height"];
        let sliderKnobWidth = MSD["replay_viewer"]["slider_knob_width_px"];

        let replayViewerInstance = this;
        let dudFunc = () => {}
        let getPlayPauseText = () => {
            return replayViewerInstance.isReplayPaused() ? "Play" : "Pause";
        }
        let getPlayPauseColor = () => {
            return replayViewerInstance.isReplayPaused() ? playColour : pauseColour;
        }
        let getPlayPauseX = () => {
            return sideBuffer;
        }

        let getPlayPauseY = () => {
            return sideBuffer + playPauseButtonHeight;
        }

        this.playPauseButton = new RectangleButton(getPlayPauseText, getPlayPauseColor, textColour, getPlayPauseX, getPlayPauseY, playPauseButtonHeight, playPauseButtonWidth, dudFunc);

        let getSliderX = (screenWidth) => {
            return getPlayPauseX(screenWidth) + playPauseButtonWidth;
        }
        let getSliderY = () => {
            return sideBuffer + sliderHeight + sliderTextHeight;
        }
        let getSliderWidth = (screenWidth) => {
            return Math.max(1, screenWidth - sideBuffer * 2 - playPauseButtonWidth);
        }
        let getSliderValue = () => {
            return replayViewerInstance.getSliderTicks();
        }
        let setSliderValue = (newValue) => {
            return replayViewerInstance.setSliderTicks(newValue);
        }
        this.slider = new QuantitySlider(getSliderX, getSliderY, getSliderWidth, sliderHeight, sliderTextHeight, sliderKnobWidth, getSliderValue, setSliderValue, 0, undefined, false);
        this.slider.setToStringFunction((value) => {
            return replayViewerInstance.ticksToTimeStamp(value);
        });
    }

    /*
        Method Name: isRunning
        Method Parameters: None
        Method Description: Checks if the game is currently running
        Method Return: boolean
    */
    isRunning(){
        return this.running && !this.winningScreen.isActive() && !this.paused;
    }

    /*
        Method Name: launchLocal
        Method Parameters: 
            localReplayName:
                Name of a local replay
        Method Description: Loads a local replay
        Method Return: void
    */
    launchLocal(localReplayName){
        this.mode = "local";
        // Find and launch
        for (let replayObj of LOCAL_REPLAYS){
            if (replayObj["name"] === localReplayName){
                this.launch(replayObj["data"]);
                return;
            }
        }
        throw new Error("Failed to find local replay: " + localReplayName);
    }

    /*
        Method Name: launchOnline
        Method Parameters: 
            onlineReplayName:
                The name of a server-hosted replay
        Method Description: Starts the process of leoading a replay from the server
        Method Return: void
    */
    launchOnline(onlineReplayName){
        this.mode = "online";
        // Ask for the reply
        try {
            SC.sendJSON({
                "subject": "get_replay_data",
                "replay_name": onlineReplayName
            });
        }catch{
            console.error("Failed to request replay.");
            this.handleGameOver(false);
            return;
        }
    }

    /*
        Method Name: checkForReplayData
        Method Parameters: None
        Method Description: Checks if replay data has been received from the server
        Method Return: Promise (implicit)
    */
    async checkForReplayData(){
        let mailBox = SC.getClientMailbox();

        // Get access
        await mailBox.requestAccess();

        let replayDataFolder = mailBox.getFolder("replay_data");
        let messages = replayDataFolder["list"];

        let replayString;
        let foundMessage = false;
        // If there's a message
        if (messages.getLength() > 0){
            let replayDataMSGJSON = messages.get(0);

            // If not read
            if (!replayDataMSGJSON["read"]){
                let replayDataJSON = replayDataMSGJSON["data_json"];
                replayString = replayDataJSON["replay_string"];
                foundMessage = true;
            }
        }

        // Give up access
        mailBox.relinquishAccess();

        // If found -> launch
        if (foundMessage){
            this.launch(replayString);
        }
    }

    /*
        Method Name: launch
        Method Parameters: 
            replayString:
                A string of a JSON with replay data
        Method Description: Launches a replay from data
        Method Return: void
    */
    launch(replayString){
        this.loadFromString(replayString);
        this.running = true;
    }

    /*
        Method Name: loadFromJSON
        Method Parameters: 
            replayJSON:
                A JSON object with replay data
        Method Description: Loads a replay
        Method Return: void
    */
    loadFromJSON(replayJSON){
        let game = this.getGame();

        let gameDetails = replayJSON["opening_message"]["game_details"];
        this.timeline = replayJSON["timeline"];
        this.lastTick = replayJSON["last_tick"];
        this.slider.setMaxValue(this.lastTick);

        // Set data received

        // Update game properties
        game.setGameProperties(gameDetails["game_properties"]);

        // Reset game with new properties
        game.reset();

        // Run a check on tick rate to make sure it matches
        let lgp = GC.getLocalGameProperties();
        let fgp = game.getGameProperties();
        // Check tick rate matches
        if (fgp["tick_rate"] != lgp["tick_rate"]){
            throw new Error("Tick rates are not equal: " + fgp["tick_rate"].toString() + ',' + lgp["tick_rate"].toString());
        }
        // set up wind to mirror server
        game.getWind().reset();

        // Add ships
        for (let shipJSON of gameDetails["ships"]){
            // Add game
            shipJSON["game_instance"] = game;
            game.addShip(new Ship(shipJSON));
        }
    }

    /*
        Method Name: loadFromString
        Method Parameters: 
            replayString:
                A string with replay data (JSON as string) 
        Method Description: Loads a replay from a string
        Method Return: void
    */
    loadFromString(replayString){
        this.replayJSON = JSON.parse(replayString);
        this.loadFromJSON(this.replayJSON);
    }

    /*
        Method Name: handlePause
        Method Parameters: None
        Method Description: Handles pause actions
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
        Method Description: Handles unpause actions
        Method Return: void
    */
    handleUnpause(){
        if (GC.getGameTickScheduler().isPaused()){
            GC.getGameTickScheduler().unpause();
        }
    }

    /*
        Method Name: applyPendingDecisions
        Method Parameters: None
        Method Description: Applies pending decisions
        Method Return: void
    */
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
            }
        }

        // Increment for next one
        this.currentTimelineIndex++;
    }

    /*
        Method Name: end
        Method Parameters: None
        Method Description: Ends a replay
        Method Return: void
    */
    end(){
        // Set running to false
        this.running = false;

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

    /*
        Method Name: handleGameOver
        Method Parameters: 
            hasWinner:
                Boolean specifying if there is a winner
        Method Description: Handles game over events
        Method Return: void
    */
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

    /*
        Method Name: checkWin
        Method Parameters: None
        Method Description: Checks if there is a winner / or just if the game ends
        Method Return: void
    */
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
            return true;
        }

        // Game didn't end
        return false;
    }

    /*
        Method Name: getMode
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getMode(){
        return this.mode;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks the game
        Method Return: Promise (implicit)
    */
    async tick(){
        // Don't tick when over
        if (this.getMode() === "online" && !this.hasData()){
            await this.checkForReplayData();
            return;
        }
        // Check ui
        this.tickUI();

        // If running
        if (this.isRunning()){
            // Check win
            let gameJustEnded = this.checkWin();

            if (!gameJustEnded){
                // If there's an error
                if (this.getGame().getTickCount() > this.lastTick){
                    this.running = false;
                    this.handleGameOver(false);
                    return;
                }  

                // Tick the game
                this.tickGame();
            }
        }
        // Allow user to fly around the camera
        else{
            this.tickCameraIfPossible();
        }
    }

    /*
        Method Name: tickCameraIfPossible
        Method Parameters: None
        Method Description: Ticks the camera even when paused
        Method Return: void
    */
    tickCameraIfPossible(){
        this.getGame().getCamera().tick();
    }

    /*
        Method Name: tickGame
        Method Parameters: None
        Method Description: Ticks the game
        Method Return: void
    */
    tickGame(){
        // Tick the game
        this.getGame().tick();

        // Vampire effect
        this.applyVampireEffect();

        // Set up pending decisions
        this.applyPendingDecisions();
    }

    /*
        Method Name: applyVampireEffect
        Method Parameters: None
        Method Description: Applies the vampire effect (heal killer of newly dead ship)
        Method Return: void
    */
    applyVampireEffect(){
        let game = this.getGame();
        let shipSinkings = game.getTickTimeline().getEventsOfType("ship_sunk");

        let vampireHealthAmount = MD["saved_models"][0]["ship_json"]["health"];

        // Apply vampire effect
        for (let [shipSinkingObj, shipSinkingIndex] of shipSinkings){
            // Ignore suicide where there's no vampire effect
            if (shipSinkingObj["shooter_ship_id"] === null){ continue; }
            let killerShip = game.getShipByID(shipSinkingObj["shooter_ship_id"]);

            // Doesn't apply if killer is dead
            if (killerShip.isDead()){ continue; }

            killerShip.setHealth(killerShip.getHealth() + vampireHealthAmount);
        }
    }


    /*
        Method Name: tickUI
        Method Parameters: None
        Method Description: Ticks the replay UI
        Method Return: void
    */
    tickUI(){
        let leftClick = GC.getGameUserInputManager().isActivated("left_click_ticked");
        if (leftClick){
            if (this.playPauseButton.covers(GC.getLastClickedMouseX(), GC.getMenuManager().changeFromScreenY(GC.getLastClickedMouseY()))){
                this.pauseUnpauseReplay();
            }
        }

        this.playPauseButton.tick();
        this.slider.tick();

        if (!this.isReplayPaused()){
            this.sliderTicks = this.getGame().getTickCount();
        }
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getName(){ return "replay_viewer"; }

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
        }else{
            // display hud
            this.displayHUD();
        }


        // Display UI
        this.displayUI();
    }

    /*
        Method Name: displayUI
        Method Parameters: None
        Method Description: Displays the UI
        Method Return: void
    */
    displayUI(){
        this.playPauseButton.display();
        this.slider.display();
    }

    /*
        Method Name: displayHUD
        Method Parameters: None
        Method Description: Displays the HUD
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
        hud.updateElement("orientation", toDegrees(this.getGame().getFocusedEntity().getTickOrientation()).toFixed(2));
        hud.updateElement("sail strength", this.getGame().getFocusedEntity().getTickSailStrength().toFixed(2));
        hud.updateElement("id", this.getGame().getFocusedEntity().getID());
        
        // Display HUD
        hud.display();
    }
}