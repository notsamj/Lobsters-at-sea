class Cannon {
    constructor(ship, cannonJSON){
        this.ship = ship;
        this.rangeCWL = rotateCWRAD(cannonJSON["range_cw"][0], toRadians(90)); // JSON values expected for ship facing @90DEG so prepare them for @0DEG
        this.rangeCWR = rotateCWRAD(cannonJSON["range_cw"][1], toRadians(90)); // JSON values expected for ship facing @90DEG so prepare them for @0DEG
        this.xCenterOffset = undefined;
        this.yCenterOffset = undefined;

        this.loaded = true; // TODO: Loading stuff

        this.calculateRealOffsets(cannonJSON);
    }

    isLoaded(){
        return this.loaded;
    }

    calculateRealOffsets(cannonJSON){
        let shipData = this.getShip().getGame().getGameProperties()["ship_data"][this.getShip().getShipModel()];
        let imageWidth = shipData["image_width"];
        let imageHeight = shipData["image_height"];

        let imageCenterX = imageWidth/2-0.5;
        let imageCenterY = imageHeight/2-0.5;

        let xCenterOffsetImage = cannonJSON["x"] - imageCenterX;
        let yCenterOffsetImage = yCenterOffsetImage - cannonJSON["y"];

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

        let rotatedX = Math.cos(shipOrientationRAD) * this.xCenterOffset - Math.sin(shipOrientationRAD) * this.yCenterOffset + shipCenterX;
        return rotatedX;
    }

    getTickY(){
        let shipCenterX = this.ship.getTickY();
        let shipOrientationRAD = this.ship.getTickOrientation();
        let rotatedY = Math.sin(shipOrientationRAD) * this.xCenterOffset + Math.cos(shipOrientationRAD) * this.yCenterOffset + shipCenterY;
        return rotatedY;
    }

    canAimAt(angleRAD){
        let shipOrientationRAD = this.ship.getTickOrientation();
        let currentRangeCWL = rotateCCWRAD(this.currentRangeCWL, shipOrientationRAD);
        let currentRangeCWR = rotateCCWRAD(this.currentRangeCWR, shipOrientationRAD);
        return angleBetweenCWRAD(angleRAD, currentRangeCWL, currentRangeCWR);
    }
}
