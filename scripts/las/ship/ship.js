class Ship {
    constructor(shipJSON){
        this.xPos = shipJSON["starting_x_pos"];
        this.yPos = shipJSON["starting_y_pos"];

        this.xV = shipJSON["starting_x_velocity"];
        this.yV = shipJSON["starting_y_velocity"];

        this.orientationRAD = shipJSON["starting_orientation_rad"];

        this.shipOrientationPower = shipJSON["orientation_power"];

        this.shipModel = shipJSON["ship_model"];

        this.gameInstance = shipJSON["game_instance"];
    }

    getShipModel(){
        return this.shipModel;
    }

    updateFromPilot(orientationDirection, shipOrientationPowerChange){
        // orientationDirection is either < 0, === 0, > 0 indicating how to turn

        // orientationPower is either < 0, === 0, > 0

    }

    moveOneTick(){
        let tickMS = this.getGame().getGameProperties()["ms_between_ticks"];
        
        // Update x,y
        this.x = this.getXInMS(tickMS);
        this.y = this.getYInMS(tickMS);
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
        return this.getXInMS(GC.getGameTickScheduler().getDisplayMSSinceLastTick());
    }

    // Note: Local only
    getFrameY(){
        return this.getYInMS(GC.getGameTickScheduler().getDisplayMSSinceLastTick());
    }

    // Note: Local only
    getFrameOrientation(){
        return this.getOrientationInMS(GC.getGameTickScheduler().getDisplayMSSinceLastTick());
    }

    getOrientationInMS(ms){
        // TODO: Change this angle
        return this.orientationRAD;
    }

    // Note: Local only
    display(centerXOfScreen, centerYOfScreen){
        let myCenterXOffsetFromScreenCenter = this.getFrameX() - centerXOfScreen;
        let myCenterYOffsetFromScreenCenter = this.getFrameY() - centerYOfScreen;

        // Get ship size
        let shipWidth = SD[this.getShipModel()]["ship_width"];
        let shipHeight = SD[this.getShipModel()]["ship_height"];
        let shipImageSizeConstantX = SD[this.getShipModel()]["image_width"] / shipWidth;
        let shipImageSizeConstantY = SD[this.getShipModel()]["image_height"] / shipHeight;

        // Get zoomed ship size
        let zoomedShipWidth = shipWidth * gameZoom;
        let zoomedShipHeight = shipHeight * gameZoom;

        // Save current screen width and height
        let screenWidth = getScreenWidth();
        let screenHeight = getScreenHeight();


        // 0,0 to screen coordinates (floats)
        let zeroXScreenCoordFL = (screenWidth - zoomedShipWidth) / 2;
        let zeroYScreenCoordFL = (screenHeight - zoomedShipHeight) / 2;

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
        let myRightX = myXScreenCoordINT + zoomedShipWidth-1;
        let myBottomY = myYScreenCoordINT + zoomedShipHeight-1;


        // If not on screen then return
        if (myRightX < 0){ return; }
        if (myLeftX >= screenWidth){ return; }
        if (myTopY < 0){ return; }
        if (myBottomY >= screenHeight){ return; }

        // So we know at least part of this ship is on the screen

        // Find x and y of image given its rotation
        let rotateX = myXScreenCoordINT + (zoomedShipWidth-1)/2;
        let rotateY = myYScreenCoordINT + (zoomedShipHeight-1)/2;
        let interpolatedOrientation = this.getFrameOrientation();


        // Prepare the display
        translate(rotateX, rotateY);
        rotate(-1 * interpolatedOrientation);


        // Game zoom
        scale(gameZoom * 1 / shipImageSizeConstantX, gameZoom * 1 / shipImageSizeConstantY);

        // Display Ship
        // TEMP
        displayImage(GC.getImage("generic_ship_up"), 0 - (shipWidth-1) / 2 * shipImageSizeConstantX, 0 - (shipHeight-1) / 2 * shipImageSizeConstantY); 

        // Undo game zoom
        scale(1/gameZoom * shipImageSizeConstantX, 1/gameZoom * shipImageSizeConstantY);

        // Reset the rotation and translation
        rotate(interpolatedOrientation);
        translate(-1 * rotateX, -1 * rotateY);
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