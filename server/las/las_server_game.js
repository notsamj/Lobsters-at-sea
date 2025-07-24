const LasGame = require("../../scripts/las/las_game.js").LasGame;

class LasServerGame extends LasGame {
    constructor(gameProperties){
        super(gameProperties);
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
        this.handleCannonShotMovement();
        this.handleNewCannonShots();
        this.checkForCannonShotHits();

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

    updateShipOrientationAndSailPower(){
        
        for (let [ship, shipIndex] of this.getShips()){
            ship.updateShipOrientationAndSailPower();
        }
    }

}