class LasRemoteGame extends LasGame {
    constructor(defaultGameProperties){
        // Pass default for gameProperties
        super(defaultGameProperties);
        this.seaDisplay = new LASSeaDisplay();
        
        this.focusedShip = null;
        this.humanShipController = null;

        this.focusedCamera = new SpectatorCamera(this, gameProperties["camera_settings"]);
    }

    tick(){
        // Maintenace ticks
        this.tickShips();

        // TODO: Update ship orientations, power based on decisions
        this.updateShipOrientationAndSailPower();

        // TODO: Move ships based on orientation and sail power
        this.moveShips();

        // Allow ships to shoot
        this.allowShipsToShoot();

        // Process cannon shots
        //this.handleCannonShotMovement();
        //this.handleNewCannonShots();
        //this.checkForCannonShotHits();

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
        let newCannonShots = this.getGameRecorder().getEventsOfTickAndType(this.getTickCount(), "cannon_shot");
        let idManager = this.getIDManager();
        let cannonBallSettings = this.getGameProperties()["cannon_ball_settings"];
        for (let [cannonShotObj, index] of newCannonShots){
            // Add an id
            cannonShotObj["id"] = idManager.generateNewID();
            this.cannonBalls.push(new CannonBall(this, cannonShotObj));
        }
    }

    processAllCannonShots(){
        // TODO: Collissions
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

    allowShipsToShoot(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.checkShoot();
        }
    }

    updateShipDecisions(){
        // For ship
        if (this.hasFocusedShip()){
            let controllerOutputJSON = this.humanShipController.getDecisionJSON();

            this.focusedShip.updateFromPilot(controllerOutputJSON);
        }
        // For camera
        else{
            this.focusedCamera.tick();
        }
    }

    updateShipOrientationAndSailPower(){
        
        for (let [ship, shipIndex] of this.getShips()){
            ship.updateShipOrientationAndSailPower();
        }
    }

    getFocusedEntity(){
        if (this.focusedShip === null){
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
    }

    display(){
        // Display the seas
        this.seaDisplay.display(this.getFocusedFrameX(), this.getFocusedFrameY());

        // Display ships
        for (let [ship, shipIndex] of this.getShips()){
            ship.display(this.getFocusedFrameX(), this.getFocusedFrameY());
        }

        // Display windsock
        this.getWind().display();

        // Display relevant things when focused
        this.getFocusedEntity().displayWhenFocused();
    }
}