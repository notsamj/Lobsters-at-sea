// If run in NodeJS
if (typeof window === "undefined"){
    displacementToRadians = require("../../../../general/math_helper.js").displacementToRadians;
}
class CannonBall {
    constructor(cannonBallJSON){
        this.cannonBallID = cannonBallJSON["cannon_ball_id"];
        this.shooterID = cannonBallJSON["ship_origin_id"];
        this.xV = cannonBallJSON["v_i_x"];
        this.yV = cannonBallJSON["v_i_y"];
        this.xPos = cannonBallJSON["x_origin"];
        this.yPos = cannonBallJSON["y_origin"];
        this.gameInstance = cannonBallJSON["game_instance"];
        this.deathTick = cannonBallJSON["death_tick"];
    }

    hasHitWater(tick){
        return tick >= this.deathTick;
    }

    getTickX(){
        return this.xPos;
    }

    getTickY(){
        return this.yPos;
    }

    getGame(){
        return this.gameInstance;
    }

    getOrientationRAD(){
        return displacementToRadians(this.xV, this.vY);
    }

    getShooterID(){
        return this.shooterID;
    }

    getID(){
        return this.cannonBallID;
    }

    updateMovementOneTickWithWind(windDataJSON){
        let xA = Math.cos(windDataJSON["wind_direction_rad"]) * windDataJSON["wind_magntiude"];
        let yA = Math.sin(windDataJSON["wind_direction_rad"]) * windDataJSON["wind_magntiude"];

        let tickMS = this.getGame().getGameProperties()["ms_between_ticks"];

        let xInfo = this.getXInfoInMSWithXA(tickMS, xA);
        let yInfo = this.getYInfoInMSWithYA(tickMS, yA);

        // Get old positions
        let oldX = this.xPos;
        let oldY = this.yPos;

        // Get new positions
        let newX = xInfo["x_pos"];
        let newY = yInfo["y_pos"];

        // Update x,y
        this.xPos = newX;
        this.yPos = newY;

        // Update xv, yv
        this.xV = xInfo["x_v"];
        this.yV = yInfo["y_v"];
                debugger;
    }

    move(){
        let tickMS = this.getGame().getGameProperties()["ms_between_ticks"];

        let xInfo = this.getXInfoInMS(tickMS);
        let yInfo = this.getYInfoInMS(tickMS);

        // Get old positions
        let oldX = this.xPos;
        let oldY = this.yPos;

        // Get new positions
        let newX = xInfo["x_pos"];
        let newY = yInfo["y_pos"];

        // Update x,y
        this.xPos = newX;
        this.yPos = newY;

        // Update xv, yv
        this.xV = xInfo["x_v"];
        this.yV = yInfo["y_v"];
        if (isNaN(this.xV)){
            debugger;
            this.getXInfoInMS(tickMS);
        }
    }

    getTickOrientation(){
        return displacementToRadians(this.xV, this.yV);
    }

    getXInfoInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let windXA = windObJ.getXA();

        return this.getXInfoInMSWithXA(ms, windXA);
    }

    getXInfoInMSWithXA(ms, windXA){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let msProportionOfASecond = ms / 1000;
        if (isNaN(this.getGame().getGameProperties()["cannon_ball_air_resistance_coefficient"])){
            debugger;
        }
        let cannonBallMovementResistanceA = 1/2 * -1 * this.xV * Math.abs(this.xV) * this.getGame().getGameProperties()["cannon_ball_air_resistance_coefficient"];
        let totalA = windXA + cannonBallMovementResistanceA;
        let newXV = this.xV + totalA * msProportionOfASecond;
        let newXP = this.xPos + newXV * msProportionOfASecond;

        return {"x_pos": newXP, "x_v": newXV}
    }

    getXInMS(ms){
        return this.getXInfoInMS(ms)["x_pos"];
    }

    getYInfoInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let windYA = windObJ.getYA();
        return this.getYInfoInMSWithYA(ms, windYA);
    }

    getYInfoInMSWithYA(ms, windYA){
        let game = this.getGame();
        let msProportionOfASecond = ms / 1000;

        let airResistanceCoefficient = this.getGame().getGameProperties()["cannon_ball_air_resistance_coefficient"];
        let cannonBallMovementResistanceA = 1/2 * -1 * this.yV * Math.abs(this.yV) * airResistanceCoefficient;
        let totalA = windYA + cannonBallMovementResistanceA;
        let newYV = this.yV + totalA * msProportionOfASecond;
        let newYP = this.yPos + newYV * msProportionOfASecond;
        return {"y_pos": newYP, "y_v": newYV}
    }

    getYInMS(ms){
        return this.getYInfoInMS(ms)["y_pos"];
    }

    // Note: Local only
    getFrameX(){
        return this.getXInMS(GC.getGameTickScheduler().getDisplayMSSinceLastTick());
    }

    // Note: Local only
    getFrameY(){
        return this.getYInMS(GC.getGameTickScheduler().getDisplayMSSinceLastTick());
    }

    getFrameOrientation(){
        return this.getTickOrientation();
    }

    // Note: Local only
    display(centerXOfScreen, centerYOfScreen){
        let myCenterXOffsetFromScreenCenter = this.getFrameX() - centerXOfScreen;
        let myCenterYOffsetFromScreenCenter = this.getFrameY() - centerYOfScreen;

        // Get ship size
        let cannonBallWidth = this.getGame().getGameProperties()["cannon_ball_settings"]["cannon_ball_width"];
        let cannonBallHeight = this.getGame().getGameProperties()["cannon_ball_settings"]["cannon_ball_height"];
        let cannonBallImageSizeConstantX = this.getGame().getGameProperties()["cannon_ball_settings"]["image_width"] / cannonBallWidth;
        let cannonBallImageSizeConstantY = this.getGame().getGameProperties()["cannon_ball_settings"]["image_height"] / cannonBallHeight;

        // Get zoomed ship size
        let zoomedCannonBallWidth = cannonBallWidth * gameZoom;
        let zoomedCannonBallHeight = cannonBallHeight * gameZoom;

        // Save current screen width and height
        let screenWidth = getScreenWidth();
        let screenHeight = getScreenHeight();

        // 0,0 to screen coordinates (floats)
        let zeroXScreenCoordFL = (screenWidth - zoomedCannonBallWidth) / 2;
        let zeroYScreenCoordFL = (screenHeight - zoomedCannonBallHeight) / 2;

        // Adjust based on offsets and zoom
        let zoomedXOffset = myCenterXOffsetFromScreenCenter * gameZoom;
        let zoomedYOffset = myCenterYOffsetFromScreenCenter * gameZoom;

        // Determine my top left coordinates (float)
        let myXScreenCoordFL = zeroXScreenCoordFL + zoomedXOffset;
        let myYScreenCoordFL = zeroYScreenCoordFL - zoomedYOffset; // when doing screen coordinates, y is inversed

        // Convert to integers
        let myXScreenCoordINT = Math.floor(myXScreenCoordFL); // Left according to screen
        let myYScreenCoordINT = Math.ceil(myYScreenCoordFL); // Down according to screen

        let myLeftX = myXScreenCoordINT;
        let myTopY = myYScreenCoordINT;
        let myRightX = myXScreenCoordINT + zoomedCannonBallWidth-1;
        let myBottomY = myYScreenCoordINT + zoomedCannonBallHeight-1;


        // If not on screen then return
        if (myRightX < 0){ return; }
        if (myLeftX >= screenWidth){ return; }
        if (myBottomY < 0){ return; }
        if (myTopY >= screenHeight){ return; }

        // So we know at least part of this ship is on the screen

        // Find x and y of image given its rotation
        let rotateX = myXScreenCoordINT + (zoomedCannonBallWidth-1)/2;
        let rotateY = myYScreenCoordINT + (zoomedCannonBallHeight-1)/2;
        let interpolatedOrientation = this.getFrameOrientation();

        //console.log(rotateX, rotateY)

        let imageToUse;
        let displayImageOrientation = interpolatedOrientation;
        
        // Determine orientation

        // Prepare the display
        translate(rotateX, rotateY);
        rotate(-1 * displayImageOrientation);

        // Game zoom
        scale(gameZoom * 1 / cannonBallImageSizeConstantX, gameZoom * 1 / cannonBallImageSizeConstantY);

        // Display Cannonball
        // TEMP
        displayImage(GC.getImage("cannon_ball"), 0 - (cannonBallWidth-1) / 2 * cannonBallImageSizeConstantX, 0 - (cannonBallHeight-1) / 2 * cannonBallImageSizeConstantY); 

        // Undo game zoom
        scale(1/gameZoom * cannonBallImageSizeConstantX, 1/gameZoom * cannonBallImageSizeConstantY);

        // Reset the rotation and translation
        rotate(displayImageOrientation);
        translate(-1 * rotateX, -1 * rotateY);

        // Temp
        //stop();
    }
}

// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { CannonBall }
}