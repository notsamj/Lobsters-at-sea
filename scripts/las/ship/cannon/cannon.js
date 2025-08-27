// If run in NodeJS
if (typeof window === "undefined"){
    rotateCWRAD = require("../../../general/math_helper.js").rotateCWRAD;
    toRadians = require("../../../general/math_helper.js").toRadians;
    TickLock = require("../../../general/tick_lock.js").TickLock;
}
class Cannon {
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

    getReloadLock(){
        return this.reloadLock;
    }

    getCannonIndex(){
        return this.cannonIndex;
    }

    isLoaded(){
        return this.reloadLock.isUnlocked();
    }

    getShotSpeed(){
        return this.shotSpeed;
    }

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

    getShip(){
        return this.ship;
    }

    getTickX(){
        let shipCenterX = this.ship.getTickX();
        let shipOrientationRAD = this.ship.getTickOrientation();
        let adjustedOrientation = rotateCWRAD(shipOrientationRAD, toRadians(90));

        let rotatedX = shipCenterX + (Math.cos(adjustedOrientation) * this.xCenterOffset - Math.sin(adjustedOrientation) * this.yCenterOffset);
        return rotatedX;
    }

    getTickY(){
        let shipCenterY = this.ship.getTickY();
        let shipOrientationRAD = this.ship.getTickOrientation();
        let adjustedOrientation = rotateCWRAD(shipOrientationRAD, toRadians(90));
        let rotatedY = shipCenterY + (Math.sin(adjustedOrientation) * this.xCenterOffset + Math.cos(adjustedOrientation) * this.yCenterOffset);
        return rotatedY;
    }

    canAimAt(locX, locY){
        let aimingAngleRAD = displacementToRadians(locX - this.getTickX(), locY - this.getTickY());
        let shipOrientationRAD = this.ship.getTickOrientation();
        let currentRangeCWL = rotateCCWRAD(this.rangeCWL, shipOrientationRAD);
        let currentRangeCWR = rotateCCWRAD(this.rangeCWR, shipOrientationRAD);
        return angleBetweenCWRAD(aimingAngleRAD, currentRangeCWL, currentRangeCWR);
    }

    tick(){
        this.reloadLock.tick();
    }
}


// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { Cannon }
}