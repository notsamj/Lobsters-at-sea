// If run in NodeJS
if (typeof window === "undefined"){
    displacementToRadians = require("../../../../general/math_helper.js").displacementToRadians;
}
/*
    Class Name: CannonBall
    Class Description: A cannon ball
*/
class CannonBall {
    /*
        Method Name: constructor
        Method Parameters: 
            cannonBallJSON:
                Details about this cannon ball instance
        Method Description: constructor
        Method Return: constructor
    */
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

    /*
        Method Name: hasHitWater
        Method Parameters: 
            tick:
                A tick (int)
        Method Description: Checks if the cannon ball has hit the water
        Method Return: boolean
    */
    hasHitWater(tick){
        return tick >= this.deathTick;
    }

    /*
        Method Name: getTickX
        Method Parameters: None
        Method Description: Gets the x position at a tick
        Method Return: float
    */
    getTickX(){
        return this.xPos;
    }

    /*
        Method Name: getTickY
        Method Parameters: None
        Method Description: Gets the y position at a tick
        Method Return: float
    */
    getTickY(){
        return this.yPos;
    }

    /*
        Method Name: getGame
        Method Parameters: None
        Method Description: Gets the game instance
        Method Return: LASGame
    */
    getGame(){
        return this.gameInstance;
    }

    /*
        Method Name: getOrientationRAD
        Method Parameters: None
        Method Description: Determines the current orientation
        Method Return: radians
    */
    getOrientationRAD(){
        return displacementToRadians(this.xV, this.vY);
    }

    /*
        Method Name: getShooterID
        Method Parameters: None
        Method Description: Getter
        Method Return: any
    */
    getShooterID(){
        return this.shooterID;
    }

    /*
        Method Name: getID
        Method Parameters: None
        Method Description: Getter
        Method Return: any
    */
    getID(){
        return this.cannonBallID;
    }

    /*
        Method Name: updateMovementOneTickWithWind
        Method Parameters: 
            windDataJSON:
                data about the wind
        Method Description: Updates the movement for one tick with wind data
        Method Return: void
    */
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
    }

    /*
        Method Name: move
        Method Parameters: None
        Method Description: Moves the cannon ball 1 tick
        Method Return: void
    */
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
    }

    /*
        Method Name: getTickOrientation
        Method Parameters: None
        Method Description: Determines the current orientation
        Method Return: radians
    */
    getTickOrientation(){
        return this.getOrientationRAD();
    }

    /*
        Method Name: getXInfoInMS
        Method Parameters: 
            ms:
                Miliseconds ahead of the last saved position
        Method Description: Gets the x location information after a given ms
        Method Return: JSON
    */
    getXInfoInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let windXA = windObJ.getXA();

        return this.getXInfoInMSWithXA(ms, windXA);
    }

    /*
        Method Name: getXInfoInMSWithXA
        Method Parameters: 
            ms:
                Miliseconds ahead of the last saved position
            windXA:
                Wind x acceleration quantity
        Method Description: Gets the x location information after a given ms
        Method Return: JSON
    */
    getXInfoInMSWithXA(ms, windXA){
        let game = this.getGame();
        let msProportionOfASecond = ms / 1000;

        let airResistanceCoefficient = this.getGame().getGameProperties()["cannon_ball_wind_effect_coefficient"];
        let totalA = windXA * airResistanceCoefficient;
        let newXV = this.xV + totalA * msProportionOfASecond;
        let newXP = this.xPos + newXV * msProportionOfASecond;

        return {"x_pos": newXP, "x_v": newXV}
    }

    /*
        Method Name: getXInMS
        Method Parameters: 
            ms:
                Miliseconds ahead of the last saved position
        Method Description: Gets the x position information after a given ms
        Method Return: float
    */
    getXInMS(ms){
        return this.getXInfoInMS(ms)["x_pos"];
    }

    /*
        Method Name: getYInfoInMS
        Method Parameters: 
            ms:
                Miliseconds ahead of the last saved position
        Method Description: Gets the y location information after a given ms
        Method Return: JSON
    */
    getYInfoInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let windYA = windObJ.getYA();
        return this.getYInfoInMSWithYA(ms, windYA);
    }

    /*
        Method Name: getYInfoInMSWithYA
        Method Parameters: 
            ms:
                Miliseconds ahead of the last saved position
            windXA:
                Wind y acceleration quantity
        Method Description: Gets the y location information after a given ms
        Method Return: JSON
    */
    getYInfoInMSWithYA(ms, windYA){
        let game = this.getGame();
        let msProportionOfASecond = ms / 1000;

        let airResistanceCoefficient = this.getGame().getGameProperties()["cannon_ball_wind_effect_coefficient"];
        let totalA = windYA * airResistanceCoefficient;
        let newYV = this.yV + totalA * msProportionOfASecond;
        let newYP = this.yPos + newYV * msProportionOfASecond;
        return {"y_pos": newYP, "y_v": newYV}
    }

    /*
        Method Name: getYInMS
        Method Parameters: 
            ms:
                Miliseconds ahead of the last saved position
        Method Description: Gets the y position information after a given ms
        Method Return: float
    */
    getYInMS(ms){
        return this.getYInfoInMS(ms)["y_pos"];
    }

    /*
        Method Name: getFrameX
        Method Parameters: None
        Method Description: Gets the X of the cannon ball at the current frame
        Method Return: float
        Note: Local only
    */
    getFrameX(){
        return this.getXInMS(this.getGame().getDisplayMSSinceLastTick());
    }

    /*
        Method Name: getFrameY
        Method Parameters: None
        Method Description: Gets the Y of the cannon ball at the current frame
        Method Return: float
        Method Note: Local only
    */
    getFrameY(){
        return this.getYInMS(this.getGame().getDisplayMSSinceLastTick());
    }

    /*
        Method Name: getFrameOrientation
        Method Parameters: None
        Method Description: Gets the orientation of the cannon ball at the current frame
        Method Return: radians
        Method Note: well this is actually last tick so it's a little delayed
    */
    getFrameOrientation(){
        return this.getTickOrientation();
    }

    /*
        Method Name: display
        Method Parameters: 
            centerXOfScreen:
                The game x center of the screen
            centerYOfScreen:
                The game y center of the screen
        Method Description: Displays the cannon ball
        Method Return: void
        Method Note: Local only
    */
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

        let imageToUse;
        let displayImageOrientation = interpolatedOrientation;
        
        // Determine orientation

        // Prepare the display
        translate(rotateX, rotateY);
        rotate(-1 * displayImageOrientation);

        // Game zoom
        scale(gameZoom * 1 / cannonBallImageSizeConstantX, gameZoom * 1 / cannonBallImageSizeConstantY);

        // Display Cannonball
        displayImage(GC.getImage("cannon_ball"), 0 - (cannonBallWidth-1) / 2 * cannonBallImageSizeConstantX, 0 - (cannonBallHeight-1) / 2 * cannonBallImageSizeConstantY); 

        // Undo game zoom
        scale(1/gameZoom * cannonBallImageSizeConstantX, 1/gameZoom * cannonBallImageSizeConstantY);

        // Reset the rotation and translation
        rotate(displayImageOrientation);
        translate(-1 * rotateX, -1 * rotateY);
    }
}

// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { CannonBall }
}