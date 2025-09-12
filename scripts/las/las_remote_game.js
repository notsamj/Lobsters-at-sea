/*
    Class Name: LasRemoteGame
    Description: Locally running a receiver of a Lobsters At Sea game hosted on a server
*/
class LasRemoteGame extends LasGame {
    /*
        Method Name: constructor
        Method Parameters: 
            gameProperties:
                JSON of game properties
        Method Description: constructor
        Method Return: constructor
    */
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
        Method Name: getVisualEffectRandomGenerator
        Method Parameters: None
        Method Description: Getter
        Method Return: SeededRandomizer
    */
    getVisualEffectRandomGenerator(){
        return this.visualEffectRandomGenerator;
    }

    /*
        Method Name: addVisualEffect
        Method Parameters: 
            visualEffect:
                A visual effect instance
        Method Description: Adds a visual effect to the list
        Method Return: void
    */
    addVisualEffect(visualEffect){
        this.visualEffects.push(visualEffect);
    }

    /*
        Method Name: addCannonBall
        Method Parameters: 
            cannonBall:
                A cannon ball instance
        Method Description: Adds a cannon bal lt othe list
        Method Return: void
    */
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
        if (this.hasFocusedLivingShip()){
            this.humanShipController.tick();
        }else{
            this.focusedCamera.tick();
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

        // Update ship orientations, power based on decisions
        this.updateEstablishedDecisions();

        // Move ships based on orientation and sail power
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

    /*
        Method Name: updateShipDecisions
        Method Parameters: None
        Method Description: Updates ship decisions (only for local ship in this game type)
        Method Return: void
    */
    updateShipDecisions(){
        // For ship
        if (this.hasFocusedLivingShip()){
            let controllerOutputJSON = this.humanShipController.getDecisionJSON();

            this.focusedShip.updateFromPilot(controllerOutputJSON);
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
        Method Name: getFocusedShip
        Method Parameters: None
        Method Description: Finds the focused ship
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
        Method Description: Sets the focused ship and creates a controller
        Method Return: void
    */
    setFocusedShip(ship){
        this.focusedShip = ship; 
        this.humanShipController = new HumanShipController(this.focusedShip);
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
        Method Name: displayHumanController
        Method Parameters: None
        Method Description: Displays and human or camera things as needed
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
}