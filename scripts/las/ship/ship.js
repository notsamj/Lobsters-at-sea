 // If run in NodeJS
if (typeof window === "undefined"){
    Cannon = require("./cannon/cannon.js").Cannon;
    angleBetweenCWRAD = require("../../general/math_helper.js").angleBetweenCWRAD;
    calculateEuclideanDistance = require("../../general/math_helper.js").calculateEuclideanDistance;
    rotateCCWRAD = require("../../general/math_helper.js").rotateCCWRAD;
    rotateCWRAD = require("../../general/math_helper.js").rotateCWRAD;
    displacementToRadians = require("../../general/math_helper.js").displacementToRadians;
}

/*
    Class Name: Ship
    Class Description: A ship
*/
class Ship {
    /*
        Method Name: constructor
        Method Parameters: 
            shipJSON:
                Ship setup details JSON
        Method Description: constructor
        Method Return: constructor
    */
    constructor(shipJSON){
        this.id = shipJSON["id"];

        this.health = shipJSON["health"];

        this.xPos = shipJSON["starting_x_pos"];
        this.yPos = shipJSON["starting_y_pos"];

        this.xV = 0;
        this.yV = 0;

        this.speed = shipJSON["starting_speed"];

        this.orientationRAD = shipJSON["starting_orientation_rad"];

        this.shipSailStrength = shipJSON["starting_sail_strength"];

        this.shipModel = shipJSON["ship_model"];

        this.shipColour = shipJSON["ship_colour"];

        this.gameInstance = shipJSON["game_instance"];

        this.propulsionConstant = Math.sqrt(this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["max_self_propulsion_speed"]);

        this.cannons = [];
        this.setupCannons();

        this.establishedDecisions = Ship.getDefaultDecisions();

        this.pendingDecisions = Ship.getDefaultDecisions();
    }

    /*
        Method Name: getDefaultDecisions
        Method Parameters: None
        Method Description: Gets the default decisions for a ship
        Method Return: JSON
    */
    static getDefaultDecisions(){
        return {
            "orientation_direction_change": 0, // is either < 0, === 0, > 0 indicating how to turn
            "new_sail_strength": null, // on continuous [0, 1]
            "aiming_cannons": false, // false or true
            "fire_cannons": false, // false or true
            "aiming_cannons_position_x": null, // null or a float
            "aiming_cannons_position_y": null // null or a float
        }
    }

    /*
        Method Name: setHealth
        Method Parameters: 
            health:
                A health value (number)
        Method Description: Sets the health of the ship
        Method Return: void
    */
    setHealth(health){
        this.health = health;
    }

    /*
        Method Name: getPendingDecisions
        Method Parameters: None
        Method Description: Getter
        Method Return: JSON
    */
    getPendingDecisions(){
        return this.pendingDecisions;
    }

    /*
        Method Name: getEstablishedDecisions
        Method Parameters: None
        Method Description: Getter
        Method Return: JSON
    */
    getEstablishedDecisions(){
        return this.establishedDecisions;
    }

    /*
        Method Name: getColour
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getColour(){
        return this.shipColour;
    }

    /*
        Method Name: getSpeed
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getSpeed(){
        return this.speed;
    }

    /*
        Method Name: getCannons
        Method Parameters: None
        Method Description: Getter
        Method Return: Array of Cannon
    */
    getCannons(){
        return this.cannons;
    }

    /*
        Method Name: getPositionJSON
        Method Parameters: None
        Method Description: Creates a JSON with position information
        Method Return: JSON
    */
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

    /*
        Method Name: getPendingDecisions
        Method Parameters: None
        Method Description: Getter
        Method Return: JSON
    */
    getPendingDecisions(){
        return this.pendingDecisions;
    }

    /*
        Method Name: updateFromJSONPosition
        Method Parameters: 
            ticksAhead:
                The number of ticks ahead of the position JSON that the game is currently
            shipPositionJSON:
                SHIP positional info JSON
        Method Description: Updates the ship from a JSON
        Method Return: void
    */
    updateFromJSONPosition(ticksAhead, shipPositionJSON){
        let startingX = this.xPos;
        let startingY = this.yPos;

        this.xPos = shipPositionJSON["x_pos"];
        this.yPos = shipPositionJSON["y_pos"];
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

    }

    /*
        Method Name: hitWithCannonBall
        Method Parameters: 
            posX:
                Position x of the cannon ball hit
            posY:
                Position y of the cannon ball hit
            cannonBallID:
                ID of the cannon ball
        Method Description: Handles a hit from a cannon ball
        Method Return: void
    */
    hitWithCannonBall(posX, posY, cannonBallID){
        let game = this.getGame();


        // Report
        game.getTickTimeline().addToTimeline({
            "event_type": "cannon_ball_hit",
            "cannon_ball_id": cannonBallID,
            "x_pos": posX,
            "y_pos": posY
        });

        // Reduce health
        this.health -= 1;

        // If dead, put out the event
        if (this.isDead()){
            game.getTickTimeline().addToTimeline({
                "event_type": "ship_sunk",
                "ship_id": this.getID(),
                "x_pos": this.xPos,
                "y_pos": this.yPos,
                "shooter_ship_id": game.findCannonBall(cannonBallID).getShooterID()
            });
        }
    }

    /*
        Method Name: kill
        Method Parameters: None
        Method Description: Kills the ship
        Method Return: void
    */
    kill(){
        this.health = 0;

        this.getGame().getTickTimeline().addToTimeline({
            "event_type": "ship_sunk",
            "ship_id": this.getID(),
            "x_pos": this.xPos,
            "y_pos": this.yPos,
            "shooter_ship_id": null
        });
    }

    /*
        Method Name: isDead
        Method Parameters: None
        Method Description: Checks if the ship is dead
        Method Return: boolean
    */
    isDead(){
        return this.getHealth() <= 0;
    }

    /*
        Method Name: isAlive
        Method Parameters: None
        Method Description: Checks if the ship is alive
        Method Return: boolean
    */
    isAlive(){
        return !this.isDead();
    }

    /*
        Method Name: getHealth
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getHealth(){
        return this.health;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles tick actions
        Method Return: void
    */
    tick(){
        // Maintenance
        this.tickCannons();
    }

    /*
        Method Name: tickCannons
        Method Parameters: None
        Method Description: Ticks the cannons
        Method Return: void
    */
    tickCannons(){
        for (let cannon of this.cannons){
            cannon.tick();
        }
    }

    /*
        Method Name: setupCannons
        Method Parameters: None
        Method Description: Sets up the cannons
        Method Return: void
    */
    setupCannons(){
        let cannonJSONList = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["cannons"];
        let gameCannonSettings = this.getGame().getGameProperties()["cannon_settings"];
        for (let cannonJSON of cannonJSONList){
            this.cannons.push(new Cannon(this, cannonJSON, gameCannonSettings));
        }
    }

    /*
        Method Name: getID
        Method Parameters: None
        Method Description: Getter
        Method Return: any
    */
    getID(){
        return this.id;
    }

    /*
        Method Name: getTickSailStrength
        Method Parameters: None
        Method Description: Gets the tick sail strength at the current tick
        Method Return: float in [0, 1]
    */
    getTickSailStrength(){
        return this.shipSailStrength;
    }

    /*
        Method Name: getShipModel
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getShipModel(){
        return this.shipModel;
    }

    /*
        Method Name: getAdjustedCannonAimingX
        Method Parameters: None
        Method Description: Calculate the position the ship is aiming at
        Method Return: void
    */
    getAdjustedCannonAimingX(){
        return this.getTickX() + this.pendingDecisions["aiming_cannons_position_x"];
    }

    /*
        Method Name: getAdjustedCannonAimingY
        Method Parameters: None
        Method Description: Calculate the position the ship is aiming at
        Method Return: void
    */
    getAdjustedCannonAimingY(){
        return this.getTickY() + this.pendingDecisions["aiming_cannons_position_y"];
    }

    /*
        Method Name: updateFromPilot
        Method Parameters: 
            updateJSON:
                Decision update JSON
        Method Description: Updates the decisions
        Method Return: void
    */
    updateFromPilot(updateJSON){
        for (let key of Object.keys(updateJSON)){
            this.pendingDecisions[key] = updateJSON[key];
        }
    }

    /*
        Method Name: displayWhenFocused
        Method Parameters: None
        Method Description: Displays the crosshair
        Method Return: void
        Method Note: Local only
    */
    displayWhenFocused(){
        // Display cannon crosshair
        this.displayCannonCrosshair();
    }

    /*
        Method Name: checkShoot
        Method Parameters: None
        Method Description: Checks if the ship is going to shoot
        Method Return: void
    */
    checkShoot(){
        // If not bothing aiming and firing then you can't shoot
        if (this.establishedDecisions["fire_cannons"]){
            console.log("Dec", this.establishedDecisions["fire_cannons"], this.establishedDecisions["aiming_cannons"], this.getAdjustedCannonAimingX(), this.getAdjustedCannonAimingY(), this.getGame().getTickCount())
        }
        
        if (!(this.establishedDecisions["aiming_cannons"] && this.establishedDecisions["fire_cannons"])){
            return;
        }


        let aimingCannonsPositionX = this.getAdjustedCannonAimingX();
        let aimingCannonsPositionY = this.getAdjustedCannonAimingY();

        // Fire elligible cannons
        for (let cannon of this.cannons){
            if (cannon.canAimAt(aimingCannonsPositionX, aimingCannonsPositionY) && cannon.isLoaded()){
                cannon.fire(aimingCannonsPositionX, aimingCannonsPositionY);
                console.log("fire", this.getGame().getTickCount());
            }
        }
    }

    /*
        Method Name: displayCannonCrosshair
        Method Parameters: None
        Method Description: Displays the cannon crosshair
        Method Return: void
        Method Note: Local only
    */
    displayCannonCrosshair(){
        // Allowed to display?
        if (!this.establishedDecisions["aiming_cannons"]){
            return;
        }

        // Check with cannons can be aimed at the position
        let aimingCannonsPositionX = this.getAdjustedCannonAimingX();
        let aimingCannonsPositionY = this.getAdjustedCannonAimingY();

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



    /*
        Method Name: updateEstablishedDecisions
        Method Parameters: None
        Method Description: Updates the ship's established decisions
        Method Return: void
    */
    updateEstablishedDecisions(){
        // orientationDirectionChange is either < 0, === 0, > 0 indicating how to turn
        this.establishedDecisions["orientation_direction_change"] = this.pendingDecisions["orientation_direction_change"];

        // Update new sail strength
        this.establishedDecisions["new_sail_strength"] = this.pendingDecisions["new_sail_strength"];

        this.establishedDecisions["aiming_cannons"] = this.pendingDecisions["aiming_cannons"];
        this.establishedDecisions["fire_cannons"] = this.pendingDecisions["fire_cannons"];
        this.establishedDecisions["aiming_cannons_position_x"] = this.pendingDecisions["aiming_cannons_position_x"];
        this.establishedDecisions["aiming_cannons_position_y"] = this.pendingDecisions["aiming_cannons_position_y"];
    }

    /*
        Method Name: moveOneTick
        Method Parameters: None
        Method Description: Moves the ship one tick
        Method Return: void
    */
    moveOneTick(){
        let tickMS = this.getGame().getGameProperties()["ms_between_ticks"];
        let positionInfo = this.getPositionInfoInMS(tickMS);

        let xPos = this.xPos;
        let yPos = this.yPos;
        let orientationDirectionChange = this.establishedDecisions["orientation_direction_change"];
        let orientationRAD = this.getTickOrientation();
        let turningRadiusDegrees = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["turning_radius_degrees"];
        let newSailStrength = this.establishedDecisions["new_sail_strength"];
        let shipSailStrength = this.shipSailStrength;
        let result = Ship.moveOneTick(positionInfo, xPos, yPos, orientationDirectionChange, orientationRAD, turningRadiusDegrees, newSailStrength, shipSailStrength);

        // Update from results
        this.xPos = result["new_x_pos"];
        this.yPos = result["new_y_pos"];

        this.xV = result["new_x_v"];
        this.yV = result["new_y_v"];

        this.speed = result["new_speed"];

        this.orientationRAD = result["new_orientation_rad"];

        this.shipSailStrength = result["new_ship_sail_strength"];
    }

    /*
        Method Name: moveOneTick
        Method Parameters: 
            positionInfo:
                JSON with info on ship's new position
            xPos:
                X position
            yPos:
                Y position
            orientationDirectionChange:
                1, 0, -1 -> Whether the orientation will change
            orientationRAD:
                Orientation of the ship
            turningRadiusDegrees:
                The turning radius of the ship
            newSailStrength:
                The new ship sail strength
            shipSailStrength:
                The current ship sail strength
        Method Description: Moves the ship by one tick and returns resulting values
        Method Return: void
    */
    static moveOneTick(positionInfo, xPos, yPos, orientationDirectionChange, orientationRAD, turningRadiusDegrees, newSailStrength, shipSailStrength){
        // Get old positions
        let oldX = xPos;
        let oldY = yPos;

        // Get new positions
        let newXPos = positionInfo["x_pos"];
        let newYPos = positionInfo["y_pos"];

        let distanceMoved = calculateEuclideanDistance(oldX, oldY, newXPos, newYPos);

        // Update xv, yv
        let newXV = positionInfo["x_v"];
        let newYV = positionInfo["y_v"];

        let newSpeed = positionInfo["speed"];

        // Update orientation
        let newOrientation = orientationRAD;
        if (orientationDirectionChange > 0){
            newOrientation = rotateCWRAD(orientationRAD, distanceMoved / 1000 * toRadians(turningRadiusDegrees));
        }else if (orientationDirectionChange < 0){
            newOrientation = rotateCCWRAD(orientationRAD, distanceMoved / 1000 * toRadians(turningRadiusDegrees));
        }

        // Update power
        let changeAmount = 0.01;
        let changeVector = 0;
        // Clearly articulating the two options for a change vector other than zero
        if (newSailStrength != null && newSailStrength > shipSailStrength){
            changeVector = changeAmount;
        }else if (newSailStrength != null && newSailStrength < shipSailStrength){
            changeVector = -1 * changeAmount;
        }

        // If within changeAmount then don't change
        if (Math.abs(newSailStrength - shipSailStrength) < changeAmount){
            changeVector = 0;
        }

        let newShipSailStrength = Math.max(0, Math.min(1, changeVector + shipSailStrength));
        return {"new_x_pos": newXPos, "new_y_pos": newYPos, "new_x_v": newXV, "new_y_v": newYV, "new_speed": newSpeed, "new_orientation_rad": newOrientation, "new_ship_sail_strength": newShipSailStrength}
    }

    /*
        Method Name: getGame
        Method Parameters: None
        Method Description: Gets the game instance of the ship
        Method Return: LASGame
    */
    getGame(){
        return this.gameInstance;
    }

    /*
        Method Name: getTickX
        Method Parameters: None
        Method Description: Gets the x position at the latest tick
        Method Return: float
    */
    getTickX(){
        return this.xPos;
    }

    /*
        Method Name: getTickY
        Method Parameters: None
        Method Description: Gets the y position at the latest tick
        Method Return: float
    */
    getTickY(){
        return this.yPos;
    }

    /*
        Method Name: getTickXV
        Method Parameters: None
        Method Description: Gets the x velocity at the latest tick
        Method Return: float
    */
    getTickXV(){
        return this.xV;
    }

    /*
        Method Name: getTickYV
        Method Parameters: None
        Method Description: Gets the y velocity at the latest tick
        Method Return: float
    */
    getTickYV(){
        return this.yV;
    }

    /*
        Method Name: getFrameX
        Method Parameters: None
        Method Description: Calculates the x value at the current frame
        Method Return: float
        Method Note: local only
    */
    getFrameX(){
        return this.getXInMS(this.getGame().getDisplayMSSinceLastTick());
    }

    /*
        Method Name: getFrameY
        Method Parameters: None
        Method Description: Calculates the y value at the current frame
        Method Return: float
        Method Note: local only
    */
    getFrameY(){
        return this.getYInMS(this.getGame().getDisplayMSSinceLastTick());
    }

    /*
        Method Name: getFrameOrientation
        Method Parameters: None
        Method Description: Gets the same 
        Method Return: radians
        Method Note: Local only
    */
    getFrameOrientation(){
        return this.getOrientationInMS(this.getGame().getDisplayMSSinceLastTick());
    }

    /*
        Method Name: getOrientationInMS
        Method Parameters: 
            ms:
                Miliseconds into the future
        Method Description: Finds the orientation after some time
        Method Return: void
    */
    getOrientationInMS(ms){
        let orientationDirectionChange = this.establishedDecisions["orientation_direction_change"];
        let positionInfo = this.getPositionInfoInMS(ms);
        let newXPos = positionInfo["x_pos"];
        let newYPos = positionInfo["y_pos"];

        let oldX = this.getTickX();
        let oldY = this.getTickY();

        let distanceMoved = calculateEuclideanDistance(oldX, oldY, newXPos, newYPos);
        let turningRadiusDegrees = this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["turning_radius_degrees"];
        
        // Update orientation
        let orientationRAD = this.getTickOrientation();
        let newOrientation = orientationRAD;
        if (orientationDirectionChange > 0){
            newOrientation = rotateCWRAD(orientationRAD, distanceMoved / 1000 * toRadians(turningRadiusDegrees));
        }else if (orientationDirectionChange < 0){
            newOrientation = rotateCCWRAD(orientationRAD, distanceMoved / 1000 * toRadians(turningRadiusDegrees));
        }
        return newOrientation;
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Gets the ship width
        Method Return: int
    */
    getWidth(){
        return this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["ship_width"];
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Gets the ship height
        Method Return: int
    */
    getHeight(){
        return this.getGame().getGameProperties()["ship_data"][this.getShipModel()]["ship_height"];
    }

    /*
        Method Name: display
        Method Parameters: 
            centerXOfScreen:
                The game x of the screen center
            centerYOfScreen:
                The game y of the screen center
        Method Description: Displays the ship
        Method Return: void
        Method Note: local only
    */
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

    /*
        Method Name: calculateWindEffect
        Method Parameters: 
            shipOrientationRAD:
                The ship's orientation
            windOrientationRAD:
                The wind's orientation
        Method Description: Calculates the effect of the wind on the sails
        Method Return: float in [-1, 1]
    */
    static calculateWindEffect(shipOrientationRAD, windOrientationRAD){
        return Math.sin(Math.abs(shipOrientationRAD - windOrientationRAD) + toRadians(90))
    }

    /*
        Method Name: calculateWindEffectMagnitude
        Method Parameters: 
            shipOrientationRAD:
                The ship's orientation
            windOrientationRAD:
                The wind's orientation
        Method Description: Calculates the effect of the wind on the sails
        Method Return: float in [0, 1]
    */
    static calculateWindEffectMagnitude(shipOrientationRAD, windOrientationRAD){
        return Math.abs(Ship.calculateWindEffect(shipOrientationRAD, windOrientationRAD));
    }

    /*
        Method Name: getTickOrientation
        Method Parameters: None
        Method Description: Gets orientation of the ship at the last tikc
        Method Return: radian
    */
    getTickOrientation(){
        return this.orientationRAD;
    }

    /*
        Method Name: getPropulsionConstant
        Method Parameters: None
        Method Description: Getter
        Method Return: float in [0, 1]
    */
    getPropulsionConstant(){
        return this.propulsionConstant;
    }

    /*
        Method Name: getPositionInfoInMS
        Method Parameters: 
            ms:
                Miliseconds since the last tick
        Method Description: Calculates the position information at a given time since the last tick
        Method Return: JSON
    */
    getPositionInfoInMS(ms){
        let game = this.getGame();
        let windObJ = this.getGame().getWind();
        let windXA = windObJ.getXA();
        let windYA = windObJ.getYA();
        let shipSailStrength = this.shipSailStrength;
        let tickOrientation = this.getTickOrientation();
        let windDirectionRAD = windObJ.getWindDirectionRAD();
        let shipAirAffectednessCoefficient = game.getGameProperties()["ship_air_affectedness_coefficient"];
        let propulsionConstant = this.getPropulsionConstant();
        let willReductionOnAccountOfSailStrengthExponent = game.getGameProperties()["will_reduction_on_account_of_sail_strength_exponent"];
        let speed = this.speed;
        let xPos = this.xPos;
        let yPos = this.yPos;
        
        let res = Ship.getPositionInfoInMS(ms, windXA, windYA, shipSailStrength, tickOrientation, windDirectionRAD, shipAirAffectednessCoefficient, willReductionOnAccountOfSailStrengthExponent, propulsionConstant, speed, xPos, yPos);
        return res;
    }

    /*
        Method Name: getPositionInfoInMS
        Method Parameters: 
            ms:
                Miliseconds since the last tick
            windXA:
                Wind acceleration 
            windYA:
                Wind acceleration 
            shipSailStrength:
                Ships' sail strength
            tickOrientation:
                Orientation of the ship
            windDirectionRAD:
                Wind direction in radians
            shipAirAffectednessCoefficient:
                The coefficient for how much the ship is affected by the wind
            willReductionOnAccountOfSailStrengthExponent:
                The reduction of will-power based on having lower wind 
            propulsionConstant:
                The propulsion constant for the sip
            speed:
                The speed of the ship
            xPos:
                The x position of the ship
            yPos:
                The y position of the ship
        Method Description: Gets the y position of the ship
        Method Return: JSON
    */
    static getPositionInfoInMS(ms, windXA, windYA, shipSailStrength, tickOrientation, windDirectionRAD, shipAirAffectednessCoefficient, willReductionOnAccountOfSailStrengthExponent, propulsionConstant, speed, xPos, yPos){
        let msProportionOfASecond = ms / 1000;
        // How strong the sails are affects the wind
        windXA *= shipSailStrength;
        windYA *= shipSailStrength;

        // Modify based on wind direction and ship orientation
        let windEffectMagnitude = Ship.calculateWindEffectMagnitude(tickOrientation, windDirectionRAD);

        // Modify by regular wind resistence
        windEffectMagnitude *= shipAirAffectednessCoefficient;

        let willPowerA = propulsionConstant;

        // Modify based on sail strength

        // Modify
        let exponent = willReductionOnAccountOfSailStrengthExponent;
        willPowerA *= Math.pow(shipSailStrength, exponent);
        let currentSpeed = speed;

        let shipMovementResistanceA = Math.sqrt(currentSpeed);

        let newSpeed = currentSpeed + (willPowerA - shipMovementResistanceA) * msProportionOfASecond;
        newSpeed = Math.max(0, newSpeed);

        let newXV = newSpeed * Math.cos(tickOrientation) + windXA * shipSailStrength * windEffectMagnitude;
        let newXP = xPos + newXV * msProportionOfASecond;

        let newYV = newSpeed * Math.sin(tickOrientation) + windYA * shipSailStrength * windEffectMagnitude;
        let newYP = yPos + newYV * msProportionOfASecond;

        return {"x_pos": newXP, "x_v": newXV, "y_pos": newYP, "y_v": newYV, "speed": newSpeed}
    }

    /*
        Method Name: getXInMS
        Method Parameters: 
            ms:
                miliseconds since the last tick
        Method Description: Calculates the x position at a given time
        Method Return: float
    */
    getXInMS(ms){
        return this.getPositionInfoInMS(ms)["x_pos"];
    }

    /*
        Method Name: getYInMS
        Method Parameters: 
            ms:
                miliseconds since the last tick
        Method Description: Calculates the x position at a given time
        Method Return: float
    */
    getYInMS(ms){
        return this.getPositionInfoInMS(ms)["y_pos"];
    }
}

// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { Ship }
}