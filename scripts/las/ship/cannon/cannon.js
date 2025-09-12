// If run in NodeJS
if (typeof window === "undefined"){
    rotateCWRAD = require("../../../general/math_helper.js").rotateCWRAD;
    toRadians = require("../../../general/math_helper.js").toRadians;
    TickLock = require("../../../general/tick_lock.js").TickLock;
}
/*
    Class Name: Cannon
    Class Description: A cannon on a ship
*/
class Cannon {
    /*
        Method Name: constructor
        Method Parameters: 
            ship:
                The ship that the cannon belongs to
            cannonJSON:
                Cannon data JSON
            gameCannonSettings:
                Game settings for cannons
        Method Description: constructor
        Method Return: constructor
    */
    constructor(ship, cannonJSON, gameCannonSettings){
        this.ship = ship;
        this.reloadLock = new TickLock(gameCannonSettings["reload_ticks"]);
        this.shotSpeed = gameCannonSettings["shot_speed"];
        this.rangeCWL = rotateCWRAD(toRadians(cannonJSON["range_cw"][0]), toRadians(90)); // JSON values expected for ship facing @90DEG so prepare them for @0DEG
        this.rangeCWR = rotateCWRAD(toRadians(cannonJSON["range_cw"][1]), toRadians(90)); // JSON values expected for ship facing @90DEG so prepare them for @0DEG
        this.xCenterOffset = undefined;
        this.yCenterOffset = undefined;
        this.cannonIndex = cannonJSON["cannon_index"];

        this.calculateRealOffsets(cannonJSON);
    }

    /*
        Method Name: getRangeCWL
        Method Parameters: None
        Method Description: Gets the "clockwise-left" angle
        Method Return: float in [0, 2*Math.PI)
    */
    getRangeCWL(){
        return this.rangeCWL;
    }

    /*
        Method Name: getRangeCWR
        Method Parameters: None
        Method Description: Gets the "clockwise-right" angle
        Method Return: float in [0, 2*PI)
    */
    getRangeCWR(){
        return this.rangeCWR;
    }

    /*
        Method Name: getXCenterOffset
        Method Parameters: None
        Method Description: Get the x center offset of the cannon
        Method Return: float
    */
    getXCenterOffset(){
        return this.xCenterOffset;
    }

    /*
        Method Name: getYCenterOffset
        Method Parameters: None
        Method Description: Get the y center offset of the cannon
        Method Return: float
    */
    getYCenterOffset(){
        return this.yCenterOffset;
    }

    /*
        Method Name: getReloadLock
        Method Parameters: None
        Method Description: Getter
        Method Return: TickLock
    */
    getReloadLock(){
        return this.reloadLock;
    }

    /*
        Method Name: getCannonIndex
        Method Parameters: None
        Method Description: Gets the cannon index
        Method Return: int
    */
    getCannonIndex(){
        return this.cannonIndex;
    }

    /*
        Method Name: isLoaded
        Method Parameters: None
        Method Description: Checks if loaded
        Method Return: boolean
    */
    isLoaded(){
        return this.reloadLock.isUnlocked();
    }

    /*
        Method Name: getShotSpeed
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getShotSpeed(){
        return this.shotSpeed;
    }

    /*
        Method Name: fire
        Method Parameters: 
            locX:
                X coordinate of location to fire at
            locY:
                Y coordinate of location to fire at
        Method Description: Fires the cannon
        Method Return: void
    */
    fire(locX, locY){
        let aimingAngleRAD = displacementToRadians(locX - this.getTickX(), locY - this.getTickY());

        // Lock reload lock
        this.reloadLock.lock();

        // Add shot to timeline
        let vIX = this.getShip().getTickXV() + Math.cos(aimingAngleRAD) * this.getShotSpeed();
        let vIY = this.getShip().getTickYV() + Math.sin(aimingAngleRAD) * this.getShotSpeed();
        let game = this.getShip().getGame();
        game.getTickTimeline().addToTimeline({
            "event_type": "cannon_shot",
            "angle_rad": aimingAngleRAD,
            "x_origin": this.getTickX(),
            "y_origin": this.getTickY(),
            "launch_wind_magnitude": game.getWind().getWindMagnitude(),
            "launch_wind_direction_rad": game.getWind().getWindDirectionRAD(),
            "v_i_x": vIX,
            "v_i_y": vIY,
            "ship_origin_id": this.getShip().getID(),
            "cannon_index": this.getCannonIndex(),
            "cannon_ball_id": game.getIDManager().generateNewID()
        });
    }

    /*
        Method Name: calculateRealOffsets
        Method Parameters: 
            cannonJSON:
                Details of this cannon
        Method Description: Calculates the "real" offsets of this cannon
        Method Return: void
    */
    calculateRealOffsets(cannonJSON){
        let shipData = this.getShip().getGame().getGameProperties()["ship_data"][this.getShip().getShipModel()];
        let imageWidth = shipData["image_width"];
        let imageHeight = shipData["image_height"];

        let imageCenterX = imageWidth/2-0.5;
        let imageCenterY = imageHeight/2-0.5;

        let xCenterOffsetImage = cannonJSON["x"] - imageCenterX;
        let yCenterOffsetImage = imageCenterY - cannonJSON["y"];

        let imageWidthMultiplier = imageWidth / shipData["ship_width"];
        let imageHeightMultiplier = imageHeight / shipData["ship_height"];

        this.xCenterOffset = xCenterOffsetImage / imageWidthMultiplier;
        this.yCenterOffset = yCenterOffsetImage / imageHeightMultiplier;
    }

    /*
        Method Name: getShip
        Method Parameters: None
        Method Description: Getter
        Method Return: Ship
    */
    getShip(){
        return this.ship;
    }

    /*
        Method Name: getTickX
        Method Parameters: None
        Method Description: Gets the x location of this cannon at a tick
        Method Return: float
    */
    getTickX(){
        return Cannon.getTickX(this.ship.getTickX(), this.ship.getTickOrientation(), this.xCenterOffset, this.yCenterOffset);
    }

    /*
        Method Name: getTickX
        Method Parameters: 
            shipTickX:
                Ship x location at tick
            shipTickOrientation:
                Ship orientation at tick (radians)
            cannonXCenterOffset:
                Cannon x offset
            cannonYCenterOffset:
                Cannon y offset
        Method Description: Gets the x location of this cannon at a tick
        Method Return: float
    */
    static getTickX(shipTickX, shipTickOrientation, cannonXCenterOffset, cannonYCenterOffset){
        let shipCenterX = shipTickX;
        let shipOrientationRAD = shipTickOrientation;
        let adjustedOrientation = rotateCWRAD(shipOrientationRAD, toRadians(90));

        let rotatedX = shipCenterX + (Math.cos(adjustedOrientation) * cannonXCenterOffset - Math.sin(adjustedOrientation) * cannonYCenterOffset);
        return rotatedX;
    }

    /*
        Method Name: getTickY
        Method Parameters: None
        Method Description: Gets the y location of this cannon at a tick
        Method Return: float
    */
    getTickY(){
        return Cannon.getTickX(this.ship.getTickY(), this.ship.getTickOrientation(), this.xCenterOffset, this.yCenterOffset);
    }

    /*
        Method Name: getTickY
        Method Parameters: 
            shipTickY:
                Ship y location at tick
            shipTickOrientation:
                Ship orientation at tick (radians)
            cannonXCenterOffset:
                Cannon x offset
            cannonYCenterOffset:
                Cannon y offset
        Method Description: Gets the y location of this cannon at a tick
        Method Return: float
    */
    static getTickY(shipTickY, shipTickOrientation, cannonXCenterOffset, cannonYCenterOffset){
        let shipCenterY = shipTickY;
        let shipOrientationRAD = shipTickOrientation;
        let adjustedOrientation = rotateCWRAD(shipOrientationRAD, toRadians(90));

        let rotatedY = shipCenterY + (Math.sin(adjustedOrientation) * cannonXCenterOffset + Math.cos(adjustedOrientation) * cannonYCenterOffset);
        return rotatedY;
    }

    /*
        Method Name: canAimAt
        Method Parameters: 
            locX:
                X coordinate of location to aim at
            locY:
                Y coordinate of location to aim at
        Method Description: Checks if the cannon can aim at a location
        Method Return: boolean
    */
    canAimAt(locX, locY){
        return Cannon.couldAimAt(this.rangeCWL, this.rangeCWR, this.ship.getTickOrientation(), this.getTickX(), this.getTickY(), locX, locY);
    }

    /*
        Method Name: couldAimAt
        Method Parameters: 
            rangeCWL:
                the "clockwise-left" angle of the cannon's range
            rangeCWR:
                the "clockwise-right" angle of the cannon's range
            shipTickOrientation:
                Ship's orientation
            cannonTickX:
                Cannon x at tick
            cannonTickY:
                Cannon y at tick
            locX:
                X coordinate of location to aim at
            locY:
                Y coordinate of location to aim at
        Method Description: Checks if the cannon can aim at a location
        Method Return: boolean
    */
    static couldAimAt(rangeCWL, rangeCWR, shipTickOrientation, cannonTickX, cannonTickY, locX, locY){
        let aimingAngleRAD = displacementToRadians(locX - cannonTickX, locY - cannonTickY);
        let shipOrientationRAD = shipTickOrientation;
        let currentRangeCWL = rotateCCWRAD(rangeCWL, shipOrientationRAD);
        let currentRangeCWR = rotateCCWRAD(rangeCWR, shipOrientationRAD);
        return angleBetweenCWRAD(aimingAngleRAD, currentRangeCWL, currentRangeCWR);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: tick actions
        Method Return: void
    */
    tick(){
        this.reloadLock.tick();
    }
}


// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { Cannon }
}