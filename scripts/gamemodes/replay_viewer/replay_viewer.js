class ReplayViewer extends Gamemode {

    constructor(){
        super();

        this.winningScreen = new WinningScreen();

        this.timeline = undefined; // Placeholder
        this.currentTimelineIndex = 0;

        this.mode = undefined;
        this.replayString = undefined;

        this.running = false;

        // UI
        this.paused = false;
        this.playPauseButton = undefined;
        this.slider = undefined; // Declare
        this.setupUI();

        this.sliderTicks = 0;
    }

    pauseUnpauseReplay(){
        if (this.isReplayPaused()){
            this.unpauseReplay();
        }else{
            this.pauseReplay();
        }
    }

    pauseReplay(){
        this.paused = true;
        this.getGame().setUpdatingFramePositions(false);
    }

    unpauseReplay(){
        this.paused = false;
        this.updateToNewTicks();
        this.handleUnpause();
        this.getGame().setUpdatingFramePositions(true);
    }

    resetForTickJump(){
        this.winningScreen.reset();
        this.getGame().reset();
        this.currentTimelineIndex = 0;
        this.running = false;
    }

    updateToNewTicks(){
        this.resetForTickJump();
        let game = this.getGame();

        this.loadFromString(this.replayString);

        // Loop until ticks match
        while (game.getTickCount() != this.sliderTicks){
            let before = game.getTickCount();
            this.tickGame();
            if (game.getTickCount() === before){
                debugger;
            }
        }
        GC.getSoundManager().clearSoundQueue();

        // Mark running
        this.running = true;
    }

    isReplayPaused(){
        return this.paused;
    }

    getSliderTicks(){
        return this.sliderTicks;
    }

    sliderSetSliderTicks(sliderTicks){
        // When update -> pause
        if (!this.isReplayPaused()){
            this.pauseReplay();
        }
        this.setSliderTicks(sliderTicks);
    }

    setSliderTicks(sliderTicks){
        this.sliderTicks = sliderTicks;
    }

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
            return replayViewerInstance.sliderSetSliderTicks(newValue);
        }
        this.slider = new QuantitySlider(getSliderX, getSliderY, getSliderWidth, sliderHeight, sliderTextHeight, sliderKnobWidth, getSliderValue, setSliderValue, 0, undefined, false);
        this.slider.setToStringFunction((value) => {
            return replayViewerInstance.ticksToTimeStamp(value);
        });
    }

    isRunning(){
        return this.running && !this.winningScreen.isActive() && !this.paused;
    }

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

    async launchOnline(onlineReplayName){
        this.mode = "online";
        // Ask for the reply
        try {
            SC.sendJSON({
                "subject": "get_replay_data",
                "replay_name": onlineReplayName
            });
        }catch{
            console.log("Failed to request replay.");
            this.handleGameOver(false);
            return;
        }
    }

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

    launch(replayString){
        this.loadFromString(replayString);
        this.running = true;
    }

    loadFromString(replayString){
        this.replayString = replayString;
        let game = this.getGame();
        let replayJSON = JSON.parse(replayString);
        let gameDetails = replayJSON["opening_message"]["game_details"];
        this.timeline = replayJSON["timeline"];
        this.slider.setMaxValue(this.timeline[this.timeline.length-1]["tick"]);

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

    getMode(){
        return this.mode;
    }

    async tick(){
        // Check ui
        this.tickUI();

        // Don't tick when over
        if (!this.isRunning()){
            if (this.getMode() === "online" && this.replayString === undefined){
                await this.checkForReplayData();
            }
            return;
        }

        this.tickGame();
    }

    tickGame(){
        // Check win
        this.checkWin();

        // Tick the game
        this.getGame().tick();

        // Set up pending decisions
        this.applyPendingDecisions();
    }

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
        }else{
            // display hud
            this.displayHUD();
        }


        // Display UI
        this.displayUI();
    }

    displayUI(){
        this.playPauseButton.display();
        this.slider.display();
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