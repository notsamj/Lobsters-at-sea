class Ship {
    constructor(shipJSON){
        this.xPos = shipJSON["starting_x_pos"];
        this.yPos = shipJSON["starting_y_pos"];

        this.xV = shipJSON["starting_x_velocity"];
        this.yV = shipJSON["starting_y_velocity"];

        this.orientationRAD = shipJSON["starting_orientation_rad"];

        this.shipOrientationPower = shipJSON["orientation_power"];

        this.gameInstance = shipJSON["game_instance"];
    }

    updateFromPilot(orientationDirection, shipOrientationPowerChange){
        // orientationDirection is either < 0, === 0, > 0 indicating how to turn

        // orientationPower is either < 0, === 0, > 0

    }

    getGame(){
        return this.gameInstance;
    }

    getTickX(){
        return this.xPos;
    }

    getTickY(){
        return this.yPos;
    }

    // Note: Local only
    getFrameX(){
        return this.getXInMS(GC.getGameTickScheduler().getDisplayMSSinceLastTick())
    }

    // Note: Local only
    getFrameY(){
        return this.getYInMS(GC.getGameTickScheduler().getDisplayMSSinceLastTick())
    }

    getXInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let msProportionOfASecond = ms / 1000;
        let newXV = this.xV + windObJ.getXA() * msProportionOfASecond;

        return this.xPos + newXV * msProportionOfASecond;
    }

    getYInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let msProportionOfASecond = ms / 1000;
        let newYV = this.yV + windObJ.getYA() * msProportionOfASecond;

        return this.yPos + newYV * msProportionOfASecond;
    }
}