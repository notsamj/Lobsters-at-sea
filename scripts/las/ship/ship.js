// If run in NodeJS
if (typeof window === "undefined"){
    Cannon = require("./cannon/cannon.js").Cannon;
    angleBetweenCWRAD = require("../../general/math_helper.js").angleBetweenCWRAD;
    calculateEuclideanDistance = require("../../general/math_helper.js").calculateEuclideanDistance;
    rotateCCWRAD = require("../../general/math_helper.js").rotateCCWRAD;
    rotateCWRAD = require("../../general/math_helper.js").rotateCWRAD;
    displacementToRadians = require("../../general/math_helper.js").displacementToRadians;
}

class Ship {
    constructor(shipJSON){
        this.id = shipJSON["id"];

        this.health = shipJSON["health"];

        this.xPos = shipJSON["starting_x_pos"];
        this.yPos = shipJSON["starting_y_pos"];

        this.xV = 0;
        this.yV = 0;

        this.speed = shipJSON["starting_speed"];

        this.orientationRAD = shipJSON["starting_orientation_rad"];

        this.shipSailStrength = shipJSON["sail_strength"];

        this.shipModel = shipJSON["ship_model"];

        this.shipColour = shipJSON["ship_colour"];

        this.gameInstance = shipJSON["game_instance"];

        this.propulsionConstant = Math.sqrt(this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["max_self_propulsion_speed"]);

        this.cannons = [];
        this.setupCannons();

        this.establishedDecisions = {
            "orientation_direction_change": 0, // is either < 0, === 0, > 0 indicating how to turn
            "sail_strength_change": 0, // is either < 0, === 0, > 0
            "aiming_cannons": false, // false or true
            "fire_cannons": false, // false or true
            "aiming_cannons_position_x": null, // null or a float
            "aiming_cannons_position_y": null // null or a float
        }

        this.pendingDecisions = {
            "orientation_direction_change": 0, // is either < 0, === 0, > 0 indicating how to turn
            "sail_strength_change": 0, // is either < 0, === 0, > 0
            "aiming_cannons": false, // false or true
            "fire_cannons": false, // false or true
            "aiming_cannons_position_x": null, // null or a float
            "aiming_cannons_position_y": null // null or a float
        }
    }

    getEstablishedDecisions(){
        return this.establishedDecisions;
    }

    getColour(){
        return this.shipColour;
    }

    getSpeed(){
        return this.speed;
    }

    getCannons(){
        return this.cannons;
    }

    getPositionJSON(){
        return {
            "id": this.id,
            "x_pos": this.xPos,
            "y_pos": this.yPos,
            "x_v": this.xV,
            "y_v": this.yV,
            "speed": this.speed,
            "orientation_rad": this.orientationRAD,
            "sail_strength": this.shipSailStrength,
            "established_decisions": this.establishedDecisions,
            "pending_decisions": this.pendingDecisions
        }
    }

    getPendingDecisions(){
        return this.pendingDecisions;
    }

    updateFromJSONPosition(ticksAhead, shipPositionJSON){
        let startingX = this.xPos;
        let startingY = this.yPos;

        this.xPos = shipPositionJSON["x_pos"];
        this.yPos = shipPositionJSON["y_pos"];
        this.speed = shipPositionJSON["speed"];
        this.xV = shipPositionJSON["x_v"];
        this.yV = shipPositionJSON["y_v"];
        this.speed = shipPositionJSON["speed"];
        this.orientationRAD = shipPositionJSON["orientation_rad"];
        this.shipSailStrength = shipPositionJSON["sail_strength"];
        this.establishedDecisions = shipPositionJSON["established_decisions"];
        this.pendingDecisions = shipPositionJSON["pending_decisions"];

        // Move ahead in ticks
        if (ticksAhead > 0){
            let timeAheadMS = ticksAhead * this.getGame().getGameProperties()["ms_between_ticks"];
            let positionInfo = this.getPositionInfoInMS(timeAheadMS);

            this.speed = positionInfo["speed"];

            this.xV = positionInfo["x_v"];
            this.yV = positionInfo["y_v"];

            this.xPos = positionInfo["x_pos"];
            this.yPos = positionInfo["y_pos"];


        }

        //console.log(ticksAhead, "diff", Math.floor(calculateEuclideanDistance(startingX, startingY, this.xPos, this.yPos)));
    }

    hitWithCannonBall(posX, posY, cannonBallID){
        let game = this.getGame();
        //console.log("Cannon hit", posX, posY)

        // Report
        game.getGameRecorder().addToTimeline(game.getTickCount(), {
            "event_type": "cannon_ball_hit",
            "cannon_ball_id": cannonBallID,
            "x_pos": posX,
            "y_pos": posY
        });

        // Reduce health
        this.health -= 1;

        // If dead, put out the event
        if (this.isDead()){
            game.getGameRecorder().addToTimeline(game.getTickCount(), {
                "event_type": "ship_sunk",
                "ship_id": this.getID(),
                "x_pos": this.xPos,
                "y_pos": this.yPos
            });
        }
    }

    kill(){
        this.health = 0;
    }

    isDead(){
        return this.getHealth() <= 0;
    }

    isAlive(){
        return !this.isDead();
    }

    getHealth(){
        return this.health;
    }

    tick(){
        // Maintenance
        this.tickCannons();
    }

    tickCannons(){
        for (let cannon of this.cannons){
            cannon.tick();
        }
    }

    setupCannons(){
        let cannonJSONList = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["cannons"];
        let gameCannonSettings = this.getGame().getGameProperties()["cannon_settings"];
        for (let cannonJSON of cannonJSONList){
            this.cannons.push(new Cannon(this, cannonJSON, gameCannonSettings));
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

        this.pendingDecisions["aiming_cannons"] = false;
        this.pendingDecisions["fire_cannons"] = false;
        this.pendingDecisions["aiming_cannons_position_x"] = null;
        this.pendingDecisions["aiming_cannons_position_y"] = null;
    }

    getShipModel(){
        return this.shipModel;
    }

    updateFromPilot(updateJSON){
        this.pendingDecisions["sail_strength_change"] = updateJSON["sail_strength_change"];
        this.pendingDecisions["orientation_direction_change"] = updateJSON["orientation_direction_change"];

        this.pendingDecisions["aiming_cannons"] = updateJSON["aiming_cannons"];
        this.pendingDecisions["fire_cannons"] = updateJSON["fire_cannons"];
        this.pendingDecisions["aiming_cannons_position_x"] = updateJSON["aiming_cannons_position_x"];
        this.pendingDecisions["aiming_cannons_position_y"] = updateJSON["aiming_cannons_position_y"];
    }

    // local
    displayWhenFocused(){
        // Display cannon crosshair
        this.displayCannonCrosshair();
    }

    checkShoot(){
        // If not bothing aiming and firing then you can't shoot
        /*if (this.getID() === 3){
                console.log(this.establishedDecisions["aiming_cannons"])
        }*/
        
        if (!(this.establishedDecisions["aiming_cannons"] && this.establishedDecisions["fire_cannons"])){
            return;
        }
        //console.log("Firing")

        let aimingCannonsPositionX = this.establishedDecisions["aiming_cannons_position_x"];
        let aimingCannonsPositionY = this.establishedDecisions["aiming_cannons_position_y"];

        // Fire elligible cannons
        for (let cannon of this.cannons){
            if (cannon.canAimAt(aimingCannonsPositionX, aimingCannonsPositionY) && cannon.isLoaded()){
                cannon.fire(aimingCannonsPositionX, aimingCannonsPositionY);
            }
        }
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

        let cannonCount = 0;
    
        // Count the number of cannons that can aim at the current position
        for (let cannon of this.cannons){
            if (cannon.canAimAt(aimingCannonsPositionX, aimingCannonsPositionY) && cannon.isLoaded()){
                cannonCount++;
            }
        }

        // No cannons can hit this angle ->
        if (cannonCount === 0){
            return;
        }

        // Cannons can hit it, display crosshair
        let centerXOfScreen = this.getGame().getFocusedTickX();
        let centerYOfScreen = this.getGame().getFocusedTickY();
        let myCenterXOffsetFromScreenCenter = aimingCannonsPositionX - centerXOfScreen;
        let myCenterYOffsetFromScreenCenter = aimingCannonsPositionY - centerYOfScreen;

        // Get ship size
        let crosshairImage = GC.getImage("crosshair");
        let crosshairWidth = crosshairImage.width;
        let crosshairHeight = crosshairImage.height;

        // Save current screen width and height
        let screenWidth = getScreenWidth();
        let screenHeight = getScreenHeight();


        // 0,0 to screen coordinates (floats)
        let zeroXScreenCoordFL = screenWidth / 2;
        let zeroYScreenCoordFL = screenHeight / 2;

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
        let myRightX = myXScreenCoordINT + crosshairWidth-1;
        let myBottomY = myYScreenCoordINT + crosshairHeight-1;

        // If not on screen then return
        if (myRightX < 0){ return; }
        if (myLeftX >= screenWidth){ return; }
        if (myBottomY < 0){ return; }
        if (myTopY >= screenHeight){ return; }

        // So we know at least part of this crosshair is on the screen

        translate(myXScreenCoordINT, myYScreenCoordINT);

        // Game zoom
        scale(gameZoom, gameZoom);

        // Display crosshair
        displayImage(crosshairImage, 0 - (crosshairWidth-1) / 2, 0 - (crosshairHeight-1) / 2); 

        // Game zoom
        scale(1 / gameZoom, 1 / gameZoom);

        translate(-1 * myXScreenCoordINT, -1 * myYScreenCoordINT);
    }



    updateShipOrientationAndSailPower(){
        // orientationDirectionChange is either < 0, === 0, > 0 indicating how to turn
        this.establishedDecisions["orientation_direction_change"] = this.pendingDecisions["orientation_direction_change"];

        // orientationPowerChange is either < 0, === 0, > 0
        this.establishedDecisions["sail_strength_change"] = this.pendingDecisions["sail_strength_change"];

        this.establishedDecisions["aiming_cannons"] = this.pendingDecisions["aiming_cannons"];
        this.establishedDecisions["fire_cannons"] = this.pendingDecisions["fire_cannons"];
        this.establishedDecisions["aiming_cannons_position_x"] = this.pendingDecisions["aiming_cannons_position_x"];
        this.establishedDecisions["aiming_cannons_position_y"] = this.pendingDecisions["aiming_cannons_position_y"];


        // Reset the pending decisions
        //this.resetPendingDecisions();
    }

    moveOneTick(){
        let tickMS = this.getGame().getGameProperties()["ms_between_ticks"];

        let positionInfo = this.getPositionInfoInMS(tickMS);

        // Get old positions
        let oldX = this.xPos;
        let oldY = this.yPos;

        // Get new positions
        let newX = positionInfo["x_pos"];
        let newY = positionInfo["y_pos"];

        let distanceMoved = calculateEuclideanDistance(oldX, oldY, newX, newY);

        // Update x,y
        this.xPos = newX;
        this.yPos = newY;

        // Update xv, yv
        this.xV = positionInfo["x_v"];
        this.yV = positionInfo["y_v"];

        this.speed = positionInfo["speed"];

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
        return this.getXInMS(this.getGame().getDisplayMSSinceLastTick());
    }

    // Note: Local only
    getFrameY(){
        return this.getYInMS(this.getGame().getDisplayMSSinceLastTick());
    }

    // Note: Local only
    getFrameOrientation(){
        return this.getOrientationInMS(this.getGame().getDisplayMSSinceLastTick());
    }

    getOrientationInMS(ms){
        // TODO: Change this angle
        return this.orientationRAD;
    }

    getWidth(){
        return this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["ship_width"];
    }

    getHeight(){
        return this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["ship_height"];
    }

    // Note: Local only
    display(centerXOfScreen, centerYOfScreen){
        let myCenterXOffsetFromScreenCenter = this.getFrameX() - centerXOfScreen;
        let myCenterYOffsetFromScreenCenter = this.getFrameY() - centerYOfScreen;

        // Get ship size
        let shipWidth = this.getWidth();
        let shipHeight = this.getHeight();
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
        displayImage(GC.getImage(this.getShipModel() + "_" + imageToUse + "_" + this.getColour()), 0 - (shipWidth-1) / 2 * shipImageSizeConstantX, 0 - (shipHeight-1) / 2 * shipImageSizeConstantY); 

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

    static calculateWindEffect(shipOrientationRAD, windOrientationRAD){
        return Math.sin(Math.abs(shipOrientationRAD - windOrientationRAD) + toRadians(90))
    }

    static calculateWindEffectMagnitude(shipOrientationRAD, windOrientationRAD){
        return Math.abs(Ship.calculateWindEffect(shipOrientationRAD, windOrientationRAD));
    }

    getTickOrientation(){
        return this.orientationRAD;
    }

    getPositionInfoInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let msProportionOfASecond = ms / 1000;
        let windXA = windObJ.getXA();
        let windYA = windObJ.getYA();
        //debugger;
        // How strong the sails are affects the wind
        windXA *= this.shipSailStrength;
        windYA *= this.shipSailStrength;

        // Modify based on wind direction and ship orientation
        let windEffectMagnitude = Ship.calculateWindEffectMagnitude(this.getTickOrientation(), windObJ.getWindDirectionRAD());

        // Modify by regular wind resistence
        windEffectMagnitude *= game.getGameProperties()["ship_air_affectedness_coefficient"];
        
        windXA *= Math.abs(windEffectMagnitude);
        windYA *= Math.abs(windEffectMagnitude);

        let willPowerA = this.propulsionConstant;

        // Modify based on sail strength

        let willReductionOnAccountOfSailStrength = 1 - this.shipSailStrength;
        let willReductionOnAccountOfSailStrengthMultiplier = game.getGameProperties()["will_reduction_on_account_of_sail_strength_multiplier"];
        let willReductionOnAccountOfSailStrengthCoefficient = willReductionOnAccountOfSailStrength * willReductionOnAccountOfSailStrengthMultiplier;
        //debugger;
        // Modify
        willPowerA *= (1 - willReductionOnAccountOfSailStrengthCoefficient);
        let currentSpeed = this.speed;

        let shipMovementResistanceA = Math.sqrt(currentSpeed);

        let newSpeed = currentSpeed + (willPowerA - shipMovementResistanceA) * msProportionOfASecond;
        newSpeed = Math.max(0, newSpeed);

        let newXV = newSpeed * Math.cos(this.getTickOrientation()) + windXA;
        let newXP = this.xPos + newXV * msProportionOfASecond;

        let newYV = newSpeed * Math.sin(this.getTickOrientation()) + windYA;
        let newYP = this.yPos + newYV * msProportionOfASecond;

        if (isNaN(newXV)){
            debugger;
        }
        return {"x_pos": newXP, "x_v": newXV, "y_pos": newYP, "y_v": newYV, "speed": newSpeed}
    }

    getXInMS(ms){
        return this.getPositionInfoInMS(ms)["x_pos"];
    }

    getYInMS(ms){
        return this.getPositionInfoInMS(ms)["y_pos"];
    }
}

// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { Ship }
}