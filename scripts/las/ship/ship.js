class Ship {
    constructor(shipJSON){
        this.id = shipJSON["id"];

        this.xPos = shipJSON["starting_x_pos"];
        this.yPos = shipJSON["starting_y_pos"];

        this.xV = shipJSON["starting_x_velocity"];
        this.yV = shipJSON["starting_y_velocity"];

        this.orientationRAD = shipJSON["starting_orientation_rad"];

        this.shipSailStrength = shipJSON["sail_strength"];

        this.shipModel = shipJSON["ship_model"];

        this.gameInstance = shipJSON["game_instance"];

        this.cannons = [];
        this.setupCannons();

        this.establishedDecisions = {
            "orientation_direction_change": 0, // is either < 0, === 0, > 0 indicating how to turn
            "sail_strength_change": 0 // is either < 0, === 0, > 0
        }

        this.pendingDecisions = {
            "orientation_direction_change": 0, // is either < 0, === 0, > 0 indicating how to turn
            "sail_strength_change": 0 // is either < 0, === 0, > 0
        }
    }

    setupCannons(){
        let cannonJSONList = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["cannons"];
        for (let cannonJSON of cannonJSONList){
            this.cannons.push(new Cannon(this, cannonJSON));
        }
    }

    getID(){
        return this.id;
    }

    getTickSailStrength(){
        return this.shipSailStrength;
    }

    resetPendingDecisions(){
        this.pendingDecisions["sail_strength_change"] = 0;
        this.pendingDecisions["orientation_direction_change"] = 0;
    }

    getShipModel(){
        return this.shipModel;
    }

    updateFromPilot(updateJSON){
        this.pendingDecisions["sail_strength_change"] = updateJSON["sail_strength_change"];
        this.pendingDecisions["orientation_direction_change"] = updateJSON["orientation_direction_change"];
    }

    // local
    displayWhenFocused(){
        // Display cannon crosshair
        this.displayCannonCrosshair();
    }

    // local
    displayCannonCrosshair(){
        // Allowed to display?
        if (!this.establishedDecisions["aiming_cannons"]){
            return;
        }

        // Check with cannons can be aimed at the position
        let aimingCannonsPositionX = this.establishedDecisions["aiming_cannons_position_x"];
        let aimingCannonsPositionY = this.establishedDecisions["aiming_cannons_position_y"];

        let aimingAngleRAD = 1; // TODO

        let cannonCount = 0;
    
        // Count the number of cannons that can aim at the current position
        for (let cannon of this.cannons){
            if (cannon.canAimAt(aimingAngleRAD) && cannon.isLoaded()){
                cannonCount++;
            }
        }

        // No cannons can hit this angle ->
        if (cannonCount === 0){
            return;
        }

        // Cannons can hit it, display crosshair
        // TODO: GET centerXOfScreen, centerYOfScreen

        let screenX = 1; // TODO
        let screenY = 1; // TODO
        let crosshairImage = GC.getImage("crosshair");
        let crosshairWidth = crosshairImage.width;
        let crosshairHeight = crosshairImage.height;
        translate(screenX, screenY);

        // Game zoom
        scale(gameZoom, gameZoom);

        drawingContext.drawImage(crosshairImage, -1 * crosshairWidth / 2, -1 * crosshairHeight / 2);

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * screenX, -1 * screenY);
    }



    updateShipOrientationAndSailPower(){
        // orientationDirectionChange is either < 0, === 0, > 0 indicating how to turn
        this.establishedDecisions["orientation_direction_change"] = this.pendingDecisions["orientation_direction_change"];

        // orientationPowerChange is either < 0, === 0, > 0
        this.establishedDecisions["sail_strength_change"] = this.pendingDecisions["sail_strength_change"];

        // Reset the pending decisions
        this.resetPendingDecisions();
    }

    moveOneTick(){
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

        // Update orientation
        if (this.establishedDecisions["orientation_direction_change"] > 0){
            this.orientationRAD = rotateCWRAD(this.orientationRAD, distanceMoved / 1000 * toRadians(this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["turning_radius_degrees"]));
        }else if (this.establishedDecisions["orientation_direction_change"] < 0){
            this.orientationRAD = rotateCCWRAD(this.orientationRAD, distanceMoved / 1000 * toRadians(this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["turning_radius_degrees"]));
        }

        // Update power
        let changeAmount = 0.01; // TODO save this somewhere (how fast you can change the sails)
        this.shipSailStrength = Math.max(0, Math.min(1, this.establishedDecisions["sail_strength_change"] * changeAmount + this.shipSailStrength));
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

    getTickXV(){
        return this.xV;
    }

    getTickYV(){
        return this.yV;
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
        let shipWidth = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["ship_width"];
        let shipHeight = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["ship_height"];
        let shipImageSizeConstantX = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["image_width"] / shipWidth;
        let shipImageSizeConstantY = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["image_height"] / shipHeight;

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
        if (myBottomY < 0){ return; }
        if (myTopY >= screenHeight){ return; }

        // So we know at least part of this ship is on the screen

        // Find x and y of image given its rotation
        let rotateX = myXScreenCoordINT + (zoomedShipWidth-1)/2;
        let rotateY = myYScreenCoordINT + (zoomedShipHeight-1)/2;
        let interpolatedOrientation = this.getFrameOrientation();

        let imageToUse;
        let isFacingRight = false;
        let displayImageOrientation;
        
        // Determine orientation

        // If in top range
        if (angleBetweenCWRAD(interpolatedOrientation, toRadians(135), toRadians(45))){
            displayImageOrientation = rotateCWRAD(interpolatedOrientation, toRadians(90)); // Rotate the top image 90 deg CW for proper display
            imageToUse = "up";
        }
        // If it is in the right range
        else if (angleBetweenCWRAD(interpolatedOrientation, toRadians(45), toRadians(315))){
            displayImageOrientation = interpolatedOrientation; // No need to rotate
            isFacingRight = true;
            imageToUse = "left"; // right uses left image but flipped
        }

        // If it is in the bottom range
        else if (angleBetweenCWRAD(interpolatedOrientation, toRadians(315), toRadians(225))){
            displayImageOrientation = rotateCWRAD(interpolatedOrientation, 270); // Rotate the bottom image 270 deg CW for proper display
            imageToUse = "down";
        }

        // Otherwise it is in the left range
        else{
            displayImageOrientation = rotateCWRAD(interpolatedOrientation, 135); // Rotate the bottom image 180 deg CW for proper display
            imageToUse = "left";
        }



        // Prepare the display
        translate(rotateX, rotateY);
        rotate(-1 * displayImageOrientation);

        // Flip for right side
        if (isFacingRight){
            scale(-1, 1);
        }

        // Game zoom
        scale(gameZoom * 1 / shipImageSizeConstantX, gameZoom * 1 / shipImageSizeConstantY);

        // Display Ship
        // TEMP
        displayImage(GC.getImage("generic_ship_" + imageToUse), 0 - (shipWidth-1) / 2 * shipImageSizeConstantX, 0 - (shipHeight-1) / 2 * shipImageSizeConstantY); 

        // Undo game zoom
        scale(1/gameZoom * shipImageSizeConstantX, 1/gameZoom * shipImageSizeConstantY);

        // Undo Flip for right side
        if (isFacingRight){
            scale(-1, 1);
        }

        // Reset the rotation and translation
        rotate(displayImageOrientation);
        translate(-1 * rotateX, -1 * rotateY);
    }

    getXInMS(ms){
        return this.getXInfoInMS(ms)["x"];
    }

    static calculateWindEffect(shipOrientationRAD, windOrientationRAD){
        return Math.sin(Math.abs(shipOrientationRAD - windOrientationRAD) + toRadians(90))
    }

    static calculateWindEffectMagnitude(shipOrientationRAD, windOrientationRAD){
        return Math.abs(Ship.calculateWindEffect(shipOrientationRAD, windOrientationRAD));
    }

    getTickOrientation(){
        return this.orientationRAD;
    }

    getXInfoInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let msProportionOfASecond = ms / 1000;
        let windA = windObJ.getXA();
        // How strong the sails are affects the wind
        windA *= this.shipSailStrength;

        // Modify based on wind direction and ship orientation
        windA *= Math.abs(Ship.calculateWindEffectMagnitude(this.getTickOrientation(), windObJ.getWindDirectionRAD()));

        let willPowerA = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["will_power_acceleration"] * Math.cos(this.getTickOrientation()); // TODO: Resume here

        let shipMovementResistanceA = 1/2 * -1 * this.xV * Math.abs(this.xV) * this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["size_metric"] * this.getGame().getGameProperties()["ship_movement_resistance_coefficient"];
        let totalA = windA + shipMovementResistanceA + willPowerA;
        let newXV = this.xV + totalA * msProportionOfASecond;
        let newXP = this.xPos + newXV * msProportionOfASecond;
        return {"x": newXP, "x_v": newXV}
    }

    getYInfoInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let msProportionOfASecond = ms / 1000;
        let windA = windObJ.getYA();

        // How strong the sails are affects the wind
        windA *= this.shipSailStrength;

        // Modify based on wind direction and ship orientation
        windA *= Ship.calculateWindEffectMagnitude(this.getTickOrientation(), windObJ.getWindDirectionRAD());

        let willPowerA = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["will_power_acceleration"] * Math.sin(this.getTickOrientation()); // TODO: Resume here

        let sizeMetric = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["size_metric"];
        let airResistanceCoefficient = this.getGame().getGameProperties()["ship_movement_resistance_coefficient"];
        let shipMovementResistanceA = 1/2 * -1 * this.yV * Math.abs(this.yV) * sizeMetric * airResistanceCoefficient;
        let totalA = windA + shipMovementResistanceA + willPowerA;
        let newYV = this.yV + totalA * msProportionOfASecond;
        let newYP = this.yPos + newYV * msProportionOfASecond;
        return {"y": newYP, "y_v": newYV}
    }

    getYInMS(ms){
        return this.getYInfoInMS(ms)["y"];
    }
}