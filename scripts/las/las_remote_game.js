class LasRemoteGame extends LasGame {
    constructor(defaultGameProperties){
        // Pass default for gameProperties
        super(defaultGameProperties);
        this.seaDisplay = new LASSeaDisplay();
        
        this.focusedShip = null;
        this.humanShipController = null;

        this.focusedCamera = new SpectatorCamera(this, gameProperties["camera_settings"]);

        this.visualEffects = new NotSamLinkedList();
        this.visualEffectRandomGenerator = new SeededRandomizer(gameProperties["random_seed"]);

        this.updatingFramePositions = true;
        this.lastUpdatedFrameMS = 0;
    }

    setUpdatingFramePositions(value){
        this.updatingFramePositions = value;
    }

    getDisplayMSSinceLastTick(){
        if (this.updatingFramePositions){
            this.lastUpdatedFrameMS = GC.getGameTickScheduler().getDisplayMSSinceLastTick();    
        }
        return this.lastUpdatedFrameMS;
    }

    getVisualEffectRandomGenerator(){
        return this.visualEffectRandomGenerator;
    }

    addVisualEffect(visualEffect){
        this.visualEffects.push(visualEffect);
    }

    addCannonBall(cannonBall){
        this.cannonBalls.push(cannonBall);
    }

    /*
        Method Name: tickHumanController
        Method Parameters: None
        Method Description: Ticks the human controller (or camera if applicable)
        Method Return: void
    */
    tickHumanController(){
        if (this.hasFocusedShip()){
            this.humanShipController.tick();
        }else{
            this.focusedCamera.tick();
        }
    }

    tick(){
        // Clean the tick timeline
        this.getTickTimeline().reset();

        // Maintenace ticks
        this.tickShips();

        // Tick human controller
        this.tickHumanController();

        // TODO: Update ship orientations, power based on decisions
        this.updateShipOrientationAndSailPower();

        // TODO: Move ships based on orientation and sail power
        this.moveShips();

        // Process cannon shots
        this.handleCannonShotMovement();

        // Take input from the user
        this.updateShipDecisions();

        // Update wind
        this.wind.tickUpdate();

        // Up the tick count
        this.incrementTickCount();
    }

    handleCannonShotMovement(){
        for (let [cannonBall, index] of this.cannonBalls){
            cannonBall.move();
        }
    }

    handleNewCannonShots(){
        let newCannonShots = this.getTickTimeline().getEventsOfType("cannon_shot");
        let idManager = this.getIDManager();
        let cannonBallSettings = this.getGameProperties()["cannon_ball_settings"];
        for (let [cannonShotObj, index] of newCannonShots){
            // Add an id
            cannonShotObj["id"] = idManager.generateNewID();
            this.cannonBalls.push(new CannonBall(this, cannonShotObj));
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

    updateShipDecisions(){
        // For ship
        if (this.hasFocusedShip()){
            let controllerOutputJSON = this.humanShipController.getDecisionJSON();

            this.focusedShip.updateFromPilot(controllerOutputJSON);
        }
    }

    updateShipOrientationAndSailPower(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.updateShipOrientationAndSailPower();
        }
    }

    getFocusedEntity(){
        if (this.focusedShip === null || this.focusedShip.isDead()){
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
        this.visualEffects.clear();
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

        // Display human controller things
        this.displayHumanController();

        // Display relevant things when focused
        this.getFocusedEntity().displayWhenFocused();

        // Play sounds
        GC.getSoundManager().playSounds();
    }

    /*
        Method Name: displayHumanController
        Method Parameters: None
        Method Description: Displays and human or camera thingsn needed
        Method Return: void
    */
    displayHumanController(){
        if (this.hasFocusedShip()){
            this.humanShipController.display();
        }else{
            this.focusedCamera.display();
        }
    }

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
}