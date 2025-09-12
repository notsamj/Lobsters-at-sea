/*
    Class Name: HumanShipController
    Class Description: Provides the abillity for the user to control the ship
*/
class HumanShipController {
    /*
        Method Name: constructor
        Method Parameters: 
            ship:
                Ship being controlled
        Method Description: constructor
        Method Return: constructor
    */
    constructor(ship){
        this.ship = ship;
        this.radar = new Radar(ship, MD["radar_settings"]);

        this.usingAutomatedSails = true;

        this.touchState = "nothing";
        this.touchTapLock = new TickLock(MD["mobile_settings"]["max_tap_time_ticks"]);
    }

    /*
        Method Name: setUsingAutomatedSails
        Method Parameters: 
            boolValue:
                A value specifying whether automated sails are being used
        Method Description: Setter
        Method Return: void
    */
    setUsingAutomatedSails(boolValue){
        this.usingAutomatedSails = boolValue;
    }

    /*
        Method Name: isUsingAutomatedSails
        Method Parameters: None
        Method Description: Checks if automated sails are being used
        Method Return: boolean
    */
    isUsingAutomatedSails(){
        return this.usingAutomatedSails;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Tick actions
        Method Return: void
    */
    tick(){
        this.radar.tick();
        this.touchTapLock.tick();
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
        Method Name: getDecisionJSON
        Method Parameters: None
        Method Description: Gets the decisions at the moment
        Method Return: JSON
    */
    getDecisionJSON(){
        if (GC.isMobile()){
            return this.getMobileDecisionJSON();
        }else{
            return this.getPCDecisionJSON();
        }
    }

    /*
        Method Name: getMobileDecisionJSON
        Method Parameters: None
        Method Description: Gets the decisions at the moment (if the user is on Mobile)
        Method Return: JSON
    */
    getMobileDecisionJSON(){
        let inputManager = GC.getGameUserInputManager();

        let pressingTouch = inputManager.isActivated("touch_press");
        let aimingCannonsFiring = false;

        // If pressing touch and not in the midst of a timer -> Start the timer
        if (pressingTouch && this.touchState === "nothing" && this.touchTapLock.isUnlocked()){
            this.touchState = "timer";
            this.touchTapLock.lock();
        }
        // Pressing touch and waiting for timer but timer is done -> Change state
        else if (pressingTouch && this.touchState === "timer" && this.touchTapLock.isUnlocked()){
            this.touchState = "holding";
        }
        // If not touching but in the waiting for timer state -> fire and reset
        else if (!pressingTouch && this.touchState === "timer"){
            this.touchState = "nothing";
            aimingCannonsFiring = true;
        }
        // If holding stops
        else if (!pressingTouch && this.touchState === "holding"){
            this.touchState = "nothing";
        }

        let lrV = 0;

        // If holding touch
        if (this.touchState === "holding"){
            let desiredOrientation = displacementToRadians(GC.getGMouseX() - getScreenWidth()/2, getScreenHeight()/2 - GC.getGMouseY());
            let minAmount = toRadians(0.5);
            let myOrientationRAD = this.getShip().getTickOrientation();
            let distanceCW = calculateAngleDiffCWRAD(myOrientationRAD, desiredOrientation);
            let distanceCCW = calculateAngleDiffCCWRAD(myOrientationRAD, desiredOrientation);

            // Determine if turning

            if (distanceCW <= distanceCCW && distanceCW >= minAmount){
                lrV = 1;
            }else if (distanceCCW < distanceCW && distanceCW >= minAmount){
                lrV = -1;
            }
        }


        let cannonX = null;
        let cannonY = null;
        // If aiming cannon find out where
        if (aimingCannonsFiring){
            let ship = this.getShip();
            let game = ship.getGame();
            let middleOfScreenX = game.getFocusedTickX();
            let middleOfScreenY = game.getFocusedTickY();

            let approximateCanvasMiddleX = getScreenWidth()/2;
            let approximateCanvasMiddleY = getScreenHeight()/2;

            // Get a pretty good estimate of cannon x and y
            cannonX = GC.getGMouseX() - approximateCanvasMiddleX + middleOfScreenX;
            cannonY = approximateCanvasMiddleY - GC.getGMouseY() + middleOfScreenY;

            // Make relative to the ship
            cannonX = cannonX - ship.getTickX();
            cannonY = cannonY - ship.getTickY();
                
            // Round
            cannonX = Math.round(cannonX);
            cannonY = Math.round(cannonY);
        }

        let finalDecisionJSON = {
            "orientation_direction_change": lrV,
            "new_sail_strength": this.autoDetermineShipSailStrength(),
            "aiming_cannons": aimingCannonsFiring,
            "aiming_cannons_position_x": cannonX,
            "aiming_cannons_position_y": cannonY,
            "fire_cannons": aimingCannonsFiring
        }
        return finalDecisionJSON;
    }

    /*
        Method Name: autoDetermineShipSailStrength
        Method Parameters: None
        Method Description: Comes up with ship sail strength
        Method Return: float in [0,1]
    */
    autoDetermineShipSailStrength(){
        let ship = this.getShip();
        let game = ship.getGame();
        let myOrientation = ship.getTickOrientation();
        let wind = game.getWind();
        let windDirectionRAD = wind.getWindDirectionRAD();
        let currentSpeed = ship.getSpeed();
        let windXA = wind.getXA();
        let windYA = wind.getYA();

        let windEffectMagnitude = Ship.calculateWindEffectMagnitude(myOrientation, windDirectionRAD);

        // Modify by regular wind resistence
        windEffectMagnitude *= game.getGameProperties()["ship_air_affectedness_coefficient"];

        let propulsionConstant = ship.getPropulsionConstant();

        let willPowerA = propulsionConstant;

        let exponent = game.getGameProperties()["will_reduction_on_account_of_sail_strength_exponent"];

        let scoreFunction = (windSailStrength) => {
            let hypotheticalWillPowerA = willPowerA * Math.pow(windSailStrength, exponent)
            let hypotheticalSpeed = Math.pow(hypotheticalWillPowerA, 2); // vMax = a**2
            let cosOrientation = Math.cos(myOrientation);
            let sinOrientation = Math.sin(myOrientation);
            let speedXV = hypotheticalSpeed * cosOrientation;
            let speedYV = hypotheticalSpeed * sinOrientation;
            let xV = speedXV + windXA * windSailStrength * windEffectMagnitude;
            let yV = speedYV + windYA * windSailStrength * windEffectMagnitude;

            let xVScore = xV * safeDivide(cosOrientation, Math.abs(cosOrientation), 0.0001, 0);
            let yVScore = yV * safeDivide(sinOrientation, Math.abs(sinOrientation), 0.0001, 0);
            return xVScore + yVScore;
        }

        // Use ternary search
        let left = 0;
        let right = 1;
        let precision = 0.01;
        
        // Loop until percision is found
        while (right - left > precision){
            let rightLeftDifference = right - left;
            let pointM1 = left + rightLeftDifference / 3;
            let pointM2 = right - rightLeftDifference / 3;

            // If score is better on the right -> Move search right
            if (scoreFunction(pointM1) < scoreFunction(pointM2)){
                left = pointM1;
            }else{
                right = pointM2;
            }
        }

        let finalValueSettleOn = right; // Lean to more sail rather than less

        // pick the best one
        return finalValueSettleOn;
    }

    /*
        Method Name: getPCDecisionJSON
        Method Parameters: None
        Method Description: Get decision JSON when user is on PC rather than mobile
        Method Return: JSON
    */
    getPCDecisionJSON(){
        let inputManager = GC.getGameUserInputManager();

        let lrV = 0;
        let pV = this.getShip().getTickSailStrength();

        let aimingCannons = inputManager.isActivated("aiming_cannon");


        if (inputManager.isActivated("ship_left")){
            lrV = -1;
        }else if (inputManager.isActivated("ship_right")){
            lrV = 1;
        }

        if (inputManager.isActivated("sails_inc")){
            pV = this.getShip().getTickSailStrength() + 1;
        }else if (inputManager.isActivated("sails_dec")){
            pV = this.getShip().getTickSailStrength() - 1;
        }


        let firingCannons = false;
        let cannonX = null;
        let cannonY = null;
        // If aiming cannon find out where
        if (aimingCannons){
            let ship = this.getShip();
            let game = ship.getGame();

            let approximateCanvasMiddleX = getScreenWidth()/2;
            let approximateCanvasMiddleY = getScreenHeight()/2;

            // Get a pretty good estimate of cannon x and y
            cannonX = (GC.getGMouseX() - approximateCanvasMiddleX) / gameZoom;
            cannonY = (approximateCanvasMiddleY - GC.getGMouseY()) / gameZoom;
            
            // Round
            cannonX = Math.round(cannonX);
            cannonY = Math.round(cannonY);

            firingCannons = inputManager.isActivated("fire_cannons");
        }

        // If the sails are automated
        if (this.isUsingAutomatedSails()){
            pV = this.autoDetermineShipSailStrength();
        }

        let finalDecisionJSON = {
            "orientation_direction_change": lrV,
            "new_sail_strength": pV,
            "aiming_cannons": aimingCannons,
            "aiming_cannons_position_x": cannonX,
            "aiming_cannons_position_y": cannonY,
            "fire_cannons": firingCannons
        }
        return finalDecisionJSON;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the radar
        Method Return: void
    */
    display(){
        this.radar.display();
    }
}