class CannonBall {
    constructor(game, cannonBallJSON){
        this.id = cannonBallJSON["id"];
        this.shooterID = cannonBallJSON["ship_origin_id"];
        this.vX = cannonBallJSON["v_i_x"];
        this.vY = cannonBallJSON["v_i_y"];
        this.xPos = cannonBallJSON["x_origin"];
        this.yPos = cannonBallJSON["y_origin"];
    }

    getOrientationRAD(){
        return displacementToRadians(this.xV, this.vY);
    }

    getShooterID(){
        return this.shooterID;
    }

    getID(){
        return this.id;
    }

    move(){
        let tickMS = this.getGame().getGameProperties()["ms_between_ticks"];

        let xInfo = this.getXInfoInMS(tickMS);
        let yInfo = this.getYInfoInMS(tickMS);

        // Get old positions
        let oldX = this.xPos;
        let oldY = this.yPos;

        // Get new positions
        let newX = xInfo["x"];
        let newY = yInfo["y"];

        let distanceMoved = calculateEuclideanDistance(oldX, oldY, newX, newY);

        // Update x,y
        this.xPos = newX;
        this.yPos = newY;

        // Update xv, yv
        this.xV = xInfo["x_v"];
        this.yV = yInfo["y_v"];
    }
}