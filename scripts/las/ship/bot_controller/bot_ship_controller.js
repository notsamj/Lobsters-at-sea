// If using NodeJS then do imports
if (typeof window === "undefined"){
    BotPerception = require("./bot_perception/bot_perception.js").BotPerception;
    Ship = require("../ship.js").Ship;
    randomFloatBetween = require("../../../general/helper_functions.js").randomFloatBetween;
    fixRadians = require("../../../general/math_helper.js").fixRadians;
}
class BotShipController {
    constructor(botShipControllerJSON){
        this.ship = botShipControllerJSON["ship"];

        this.offsets = botShipControllerJSON["offsets"];

        this.perception = new BotPerception(botShipControllerJSON["reaction_time_ticks"]);

        this.workingData = {
            "tick": undefined,
            "best_enemy": null
        }

        this.reactionTimeMS = this.ship.getGame().getGameProperties()["ms_between_ticks"] + botShipControllerJSON["reaction_time_ticks"];

        this.updateBestEnemyLock = new TickLock(botShipControllerJSON["update_enemy_ticks"]);
        this.updateHeadingLock = new TickLock(botShipControllerJSON["update_heading_ticks"]);
        this.updateSailTickLock = new TickLock(botShipControllerJSON["update_sail_ticks"]);

        this.decisions = copyObject(Ship.getDefaultDecisions());
    }

    getOffset(offsetName){
        if (objectHasKey(this.offsets, offsetName)){
            return this.offsets[offsetName];
        }
        throw new Error("Offet: " + offsetName + " not found.");
    }

    generateOffset(offsetName){
        let offset = this.getOffset(offsetName);
        return randomFloatBetween(offset[0], offset[1]);
    }

    resetDecisions(){
        copyOverObject(Ship.getDefaultDecisions(), this.decisions);
    }

    tick(){
        // Update tick locks
        this.updateBestEnemyLock.tick();
        this.updateHeadingLock.tick();
        this.updateSailTickLock.tick();

        // Save tick
        this.workingData["tick"] = this.getShip().getGame().getTickCount();

        // Update perception
        this.updatePerception();

        // Make decisions
        this.makeDecisions();
    }

    updatePerception(){
        let currentTick = this.workingData["tick"];

        let myShip = this.getShip();
        let game = myShip.getGame();
        let wind = game.getWind();

        // Whether I have any data for this tick
        this.perception.inputData("default", true, currentTick);

        // Save my data
        let myOrientationRAD = fixRadians(myShip.getTickOrientation() + toRadians(this.generateOffset("my_orientation_deg")));
        this.perception.inputData("my_orientation_rad", myOrientationRAD, currentTick);
        //debugger;
        this.perception.inputData("my_speed", myShip.getSpeed() + this.generateOffset("my_speed"), currentTick);
        this.perception.inputData("my_x", myShip.getTickX() + this.generateOffset("my_x"), currentTick);
        this.perception.inputData("my_y", myShip.getTickY() + this.generateOffset("my_y"), currentTick);
        this.perception.inputData("my_x_v", myShip.getTickXV() + this.generateOffset("my_x_v"), currentTick);
        this.perception.inputData("my_y_v", myShip.getTickYV() + this.generateOffset("my_y_v"), currentTick);
        
        // My cannon data
        let cannonData = []
        for (let cannon of myShip.getCannons()){
            let cannonObj = {
                "is_loaded": cannon.isLoaded()
            }
            cannonData.push(cannonObj);
        }
        this.perception.inputData("my_cannon_data", cannonData, currentTick);

        // Save wind direction
        let windDirectionRAD = wind.getWindDirectionRAD();
        windDirectionRAD = fixRadians(windDirectionRAD + toRadians(this.generateOffset("wind_direction_deg")));
        this.perception.inputData("wind_direction_rad", windDirectionRAD, currentTick);
        //console.log(windDirectionRAD)

        // Save wind magnitude
        let windDirectionMagnitude = wind.getWindMagnitude();
        this.perception.inputData("wind_direction_magnitude", windDirectionMagnitude + this.generateOffset("wind_direction_magnitude"), currentTick);

        // Save wind xa
        this.perception.inputData("wind_xa", Math.cos(windDirectionRAD) * windDirectionMagnitude, currentTick);

        // Save wind ya
        this.perception.inputData("wind_ya", Math.sin(windDirectionRAD) * windDirectionMagnitude, currentTick);

        // Save other ship data
        let allShips = game.getShips();
        let allShipData = {}
        for (let [ship, shipIndex] of allShips){
            // Skip my ship
            if (ship.getID() === myShip.getID()){ continue; }
            allShipData[ship.getID()] = {
                "alive": ship.isAlive(),
                "x": ship.getTickX() + this.generateOffset("enemy_x"),
                "y": ship.getTickY() + this.generateOffset("enemy_y"),
                "x_v": ship.getTickXV() + this.generateOffset("enemy_x_v"),
                "y_v": ship.getTickYV() + this.generateOffset("enemy_y_v"),
                "orientation_rad": ship.getTickOrientation()
            }
        }
        this.perception.inputData("enemy_ship_data", allShipData, currentTick);
    }

    makeDecisions(){
        // If no data -> No decision changes
        if (!this.perception.hasDataToReactTo("default", this.workingData["tick"])){ return; }

        /*
            Determine best target ship
            Aim to go upwind of the target ship
            desermineBestEnemy:
                Find the enemy who can shoot at me best
            determineDesiredHeading();
                Find the most dangerous ship to you. Aim upwind of it.
            determineShooting();
                Find all ships that you can hit. Shoot at them.
        */
        this.determineBestEnemy();
        this.determineDesiredHeading();
        this.determineSailStrength();
        this.determineShooting();
        //this.testDetermineShooting();
    }

    /*testDetermineShooting(){
        let currentTick = this.workingData["tick"];
        let reactionTimeMS = this.reactionTimeMS;
        let myShip = this.getShip();
        let game = myShip.getGame();
        let shotFlyingTimeMS = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"];
        let shotSpeed = game.getGameProperties()["cannon_settings"]["shot_speed"];
        let shotDistance = shotSpeed * shotFlyingTimeMS / 1000;

        let myShipX = this.perception.getDataToReactTo("my_x", currentTick);
        let myShipY = this.perception.getDataToReactTo("my_y", currentTick);
        let myShipXV = this.perception.getDataToReactTo("my_x_v", currentTick);
        let myShipYV = this.perception.getDataToReactTo("my_y_v", currentTick);
        let myShipXAfterReactionTime = myShipX + (reactionTimeMS * myShipXV / 1000);
        let myShipYAfterReactionTime = myShipY + (reactionTimeMS * myShipYV / 1000);
        let myShipTickOrientation = this.perception.getDataToReactTo("my_orientation_rad", currentTick);

        // Add a simplified wind reduction
        let windXA = this.perception.getDataToReactTo("wind_xa", currentTick);
        let windYA = this.perception.getDataToReactTo("wind_ya", currentTick);
        let windEffectCoefficient = game.getGameProperties()["cannon_ball_wind_effect_coefficient"];
        let windTotalDistanceHelp = Math.sqrt(Math.pow(windXA, 2) + Math.pow(windYA, 2)) * windEffectCoefficient * shotFlyingTimeMS / 1000;

        let shotDistanceWithMaxWindHelp = shotDistance + windTotalDistanceHelp;


        // Find ships within this
        let shipsWithinRange = [];

        let myCannons = myShip.getCannons();
        let myCannonData = this.perception.getDataToReactTo("my_cannon_data", currentTick);

        // Check all ships
        let allShips = game.getShips();
        let enemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick);

        let searchPrecision = 1; // ms
        let maxDistance = game.getGameProperties()["bot_settings"]["max_expected_hit_distance"];

        // Calculator required stuff

        let countCannons = (shipData, timeStampMS, reactionTimeMS) => {
            let shipXAtTime = shipData["x"] + shipData["x_v"] * (reactionTimeMS + timeStampMS) / 1000;
            let shipYAtTime = shipData["y"] + shipData["y_v"] * (reactionTimeMS + timeStampMS) / 1000; 

            let windDiplacementInTimeX = 0.5 * windXA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);
            let windDiplacementInTimeY = 0.5 * windYA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);

            let aimAtX = shipXAtTime - windDiplacementInTimeX;
            let aimAtY = shipYAtTime - windDiplacementInTimeY;

            let angleToPoint = displacementToRadians(aimAtX - myShipX, aimAtY - myShipY);

            let cannonBallXV = myShipXV + Math.cos(angleToPoint) * shotSpeed;
            let cannonBallYV = myShipYV + Math.sin(angleToPoint) * shotSpeed; 
            let cannonBallEndX = myShipXAfterReactionTime + cannonBallXV * timeStampMS / 1000;
            let cannonBallEndY = myShipYAfterReactionTime + cannonBallYV * timeStampMS / 1000;

            let expectedHitX = cannonBallEndX + windDiplacementInTimeX;
            let expectedHitY = cannonBallEndY + windDiplacementInTimeY;

            // Check the number of cannons LOADED and CAN_AIM_AT_LOCATION
            let cannonCount = 0;
            for (let cannon of myCannons){
                let cannonIsLoaded = myCannonData[cannon.getCannonIndex()]["is_loaded"];
                if (!cannonIsLoaded){ continue; }
                let rangeCWL = cannon.getRangeCWL();
                let rangeCWR = cannon.getRangeCWR();
                let cannonXCenterOffset = cannon.getXCenterOffset();
                let cannonYCenterOffset = cannon.getYCenterOffset();
                let cannonTickX = Cannon.getTickX(myShipXAfterReactionTime, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);
                let cannonTickY = Cannon.getTickY(myShipYAfterReactionTime, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);

                let cannonCouldAimAtIt = Cannon.couldAimAt(rangeCWL, rangeCWR, myShipTickOrientation, cannonTickX, cannonTickY, aimAtX, aimAtY);
                // Record that 1 more cannon can aim at it
                if (cannonCouldAimAtIt){
                    cannonCount += 1;
                }
            }
            return {"aim_at_x": aimAtX, "aim_at_y": aimAtY, "cannon_count": cannonCount, "time": timeStampMS, "shipXAtTime": shipXAtTime, "shipYAtTime": shipYAtTime, "expectedHitX": expectedHitX, "expectedHitY": expectedHitY}
        }

        let distanceFromTargetCalculator = (shipData, timeStampMS, reactionTimeMS) => {
            let shipXAtTime = shipData["x"] + shipData["x_v"] * (timeStampMS + reactionTimeMS) / 1000;
            let shipYAtTime = shipData["y"] + shipData["y_v"] * (timeStampMS + reactionTimeMS) / 1000; 

            let windDiplacementInTimeX = 0.5 * windXA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);
            let windDiplacementInTimeY = 0.5 * windYA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);

            let aimAtX = shipXAtTime - windDiplacementInTimeX;
            let aimAtY = shipYAtTime - windDiplacementInTimeY;

            let angleToPoint = displacementToRadians(aimAtX - myShipX, aimAtY - myShipY);

            let cannonBallXV = myShipXV + Math.cos(angleToPoint) * shotSpeed;
            let cannonBallYV = myShipYV + Math.sin(angleToPoint) * shotSpeed; 
            let cannonBallEndX = myShipXAfterReactionTime + cannonBallXV * timeStampMS / 1000;
            let cannonBallEndY = myShipYAfterReactionTime + cannonBallYV * timeStampMS / 1000;

            let expectedHitX = cannonBallEndX + windDiplacementInTimeX;
            let expectedHitY = cannonBallEndY + windDiplacementInTimeY;

            return { "distance": calculateEuclideanDistance(aimAtX, aimAtY, cannonBallEndX, cannonBallEndY), "time": timeStampMS, "shipXAtTime": shipXAtTime, "shipYAtTime": shipYAtTime, "expectedHitX": expectedHitX, "expectedHitY": expectedHitY};
        }

        // Go through each ship (closest to furthest)
        let ship = allShips.get(0);
        let shipData = enemyShipData[ship.getID()];

        // Use ternary search
        let minTime = 0;
        let maxTime = shotFlyingTimeMS;
        let currentResult;

        // Loop until percision is found
        //debugger;
        while (maxTime - minTime > searchPrecision){
            let rightLeftDifference = maxTime - minTime;
            let pointM1 = minTime + rightLeftDifference / 3;
            let pointM2 = maxTime - rightLeftDifference / 3;

            // If score is better on the right -> Move search right
            let m1Result = distanceFromTargetCalculator(shipData, pointM1, reactionTimeMS);
            let m2Result = distanceFromTargetCalculator(shipData, pointM2, reactionTimeMS);
            let distanceM1 = m1Result["distance"];
            let distanceM2 = m2Result["distance"];

            if (distanceM1 > distanceM2){
                minTime = pointM1;
                currentResult = m2Result;
            }else{
                maxTime = pointM2;
                currentResult = m1Result;
            }
        }

        let bestDistance = currentResult["distance"];
        let bestTime = currentResult["time"];

        // Search for left bound
        minTime = 0;
        maxTime = bestTime;
        let leftBoundTime = bestTime;
        while (maxTime - minTime > searchPrecision){
            let rightLeftDifference = maxTime - minTime;
            let pointM1 = minTime + rightLeftDifference / 3;
            let pointM2 = maxTime - rightLeftDifference / 3;

            // Find distance to MAX_DISTANCE
            let m1Result = distanceFromTargetCalculator(shipData, pointM1, reactionTimeMS);
            let m2Result = distanceFromTargetCalculator(shipData, pointM2, reactionTimeMS);
            let distanceM1 = Math.abs(m1Result["distance"] - maxDistance);
            let distanceM2 = Math.abs(m2Result["distance"] - maxDistance);
            if (distanceM1 > distanceM2){
                minTime = pointM1;
            }else{
                maxTime = pointM2;
                leftBoundTime = m1Result["time"]; // Always keep right result
            }
        } 

        // Search for right bound
        minTime = bestTime;
        maxTime = shotFlyingTimeMS;
        let rightBoundTime = bestTime;
        while (maxTime - minTime > searchPrecision){
            let rightLeftDifference = maxTime - minTime;
            let pointM1 = minTime + rightLeftDifference / 3;
            let pointM2 = maxTime - rightLeftDifference / 3;

            // Find distance to MAX_DISTANCE
            let m1Result = distanceFromTargetCalculator(shipData, pointM1, reactionTimeMS);
            let m2Result = distanceFromTargetCalculator(shipData, pointM2, reactionTimeMS);
            let distanceM1 = Math.abs(m1Result["distance"] - maxDistance);
            let distanceM2 = Math.abs(m2Result["distance"] - maxDistance);
            if (distanceM1 > distanceM2){
                minTime = pointM1;
                rightBoundTime = m1Result["time"]; // Always keep left result
            }else{
                maxTime = pointM2;
            }
        } 

        minTime = leftBoundTime;
        maxTime = rightBoundTime;

        let shootCannonsResult = countCannons(shipData, bestTime, reactionTimeMS);
        let timeDown = bestTime - searchPrecision;
        let timeUp = bestTime + searchPrecision;
        
        // Check upwards
        while (shootCannonsResult["cannon_count"] === 0 && (timeUp < maxTime || timeDown > minTime)){
            let downResult = {"cannon_count": 0}
            let upResult = {"cannon_count": 0}

            if (timeDown > minTime){
                downResult = countCannons(shipData, timeDown, reactionTimeMS);

                // Move to next timeDown
                timeDown -= searchPrecision;
            }

            if (timeUp < maxTime){
                upResult = countCannons(shipData, timeUp, reactionTimeMS);

                // Move to next timeUp
                timeUp += searchPrecision;
            }

            if (downResult["cannon_count"] > upResult["cannon_count"]){
                shootCannonsResult = downResult;
            }else{
                shootCannonsResult = upResult;
            }
        }


        // No cannons can shoot
        if (shootCannonsResult["cannon_count"] === 0){
            return;
        }

        currentResult = shootCannonsResult;


        if (!objectHasKey(this.workingData, "debug_circle")){
            this.workingData["debug_circle"] = new DebugCircle("#000000", 0, 0, 20);
            game.visualEffects.push(this.workingData["debug_circle"]);
        }
        this.workingData["debug_circle"].update(currentResult["shipXAtTime"], currentResult["shipYAtTime"]);

        if (!objectHasKey(this.workingData, "debug_circle2")){
            this.workingData["debug_circle2"] = new DebugCircle("#00ff00", 0, 0, 20);
            game.visualEffects.push(this.workingData["debug_circle2"]);
        }

        this.workingData["debug_circle2"].update(currentResult["expectedHitX"], currentResult["expectedHitY"]);
    }*/

    /*determineDesiredHeading(){
        if (this.updateHeadingLock.isLocked() || this.workingData["best_enemy"] === undefined){
            return;
        }
        this.updateHeadingLock.lock();
        
        let currentTick = this.workingData["tick"];
        let game = this.getShip().getGame();

        // My info
        let myX = this.perception.getDataToReactTo("my_x", currentTick);
        let myY = this.perception.getDataToReactTo("my_y", currentTick);
        let myOrientationRAD = this.perception.getDataToReactTo("my_orientation_rad", currentTick);

        // My aim for enemy rump
        let bestEnemyShipID = this.workingData["best_enemy"].getID();
        let enemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick)[bestEnemyShipID];
        let bestEnemyX = enemyShipData["x"];
        let bestEnemyY = enemyShipData["y"];
        let enemyOrientation = enemyShipData["orientation_rad"];

        let desiredPositionX = bestEnemyX - Math.cos(enemyOrientation) * 32;
        let desiredPositionY = bestEnemyY - Math.sin(enemyOrientation) * 32;


        // Now just get the angle
        let heading = displacementToRadians(desiredPositionX - myX, desiredPositionY - myY);

        let minAmount = toRadians(0.5);

        let distanceCW = calculateAngleDiffCWRAD(myOrientationRAD, heading);
        let distanceCCW = calculateAngleDiffCCWRAD(myOrientationRAD, heading);

        // Determine if turning

        if (distanceCW <= distanceCCW && distanceCW >= minAmount){
            this.decisions["orientation_direction_change"] = 1;
        }else if (distanceCCW < distanceCW && distanceCW >= minAmount){
            this.decisions["orientation_direction_change"] = -1;
        }else{
            this.decisions["orientation_direction_change"] = 0;
        }
    }*/

    /*determineDesiredHeading(){
        if (this.updateHeadingLock.isLocked() || this.workingData["best_enemy"] === undefined){
            return;
        }
        this.updateHeadingLock.lock();
        
        let currentTick = this.workingData["tick"];
        let game = this.getShip().getGame();

        // My info
        let myX = this.perception.getDataToReactTo("my_x", currentTick);
        let myY = this.perception.getDataToReactTo("my_y", currentTick);
        let myXV = this.perception.getDataToReactTo("my_x_v", currentTick);
        let myYV = this.perception.getDataToReactTo("my_y_v", currentTick);
        let myOrientationRAD = this.perception.getDataToReactTo("my_orientation_rad", currentTick);

        // Enemy info
        let bestEnemyShipID = this.workingData["best_enemy"].getID();
        let enemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick)[bestEnemyShipID];
        let bestEnemyX = enemyShipData["x"];
        let bestEnemyY = enemyShipData["y"];
        let bestEnemyXV = enemyShipData["x_v"];
        let bestEnemyYV = enemyShipData["y_v"];

        // Wind info (Note: This is more like wind velocity not acceleration but whatever...)
        let windXA = this.perception.getDataToReactTo("wind_xa", currentTick);
        let windYA = this.perception.getDataToReactTo("wind_ya", currentTick);
        let windOppositeOrientation = rotateCWRAD(this.perception.getDataToReactTo("wind_direction_rad", currentTick), toRadians(180));
        let windEffectCoefficient = game.getGameProperties()["cannon_ball_wind_effect_coefficient"];

        // Cannon ball info
        let flightTimeSeconds = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"] / 1000;
        let cannonShotSpeed = game.getGameProperties()["cannon_settings"]["shot_speed"];

        let desiredPositionX = bestEnemyX;
        let desiredPositionY = bestEnemyY;

        // So the question is if the enemy fired against the wind, how far would the cannon ball go
        let cannonBallXV = bestEnemyXV + windXA * windEffectCoefficient + Math.cos(windOppositeOrientation) * cannonShotSpeed;
        let cannonBallYV = bestEnemyYV + windYA * windEffectCoefficient + Math.sin(windOppositeOrientation) * cannonShotSpeed;
        //console.log("x", bestEnemyXV, windXA * windEffectCoefficient, Math.cos(windOppositeOrientation) * cannonShotSpeed);
        //console.log("y", bestEnemyYV, windYA * windEffectCoefficient, Math.sin(windOppositeOrientation) * cannonShotSpeed);

        desiredPositionX = bestEnemyX + cannonBallXV * flightTimeSeconds;
        desiredPositionY = bestEnemyY + cannonBallYV * flightTimeSeconds;


        // Now just get the angle
        let heading = displacementToRadians(desiredPositionX - myX, desiredPositionY - myY);

        if (this.workingData["requested_shooting_angle"] != null){
            heading = this.workingData["requested_shooting_angle"];
        }

        let minAmount = toRadians(0.5);

        let distanceCW = calculateAngleDiffCWRAD(myOrientationRAD, heading);
        let distanceCCW = calculateAngleDiffCCWRAD(myOrientationRAD, heading);

        // Determine if turning

        if (distanceCW <= distanceCCW && distanceCW >= minAmount){
            this.decisions["orientation_direction_change"] = 1;
        }else if (distanceCCW < distanceCW && distanceCW >= minAmount){
            this.decisions["orientation_direction_change"] = -1;
        }else{
            this.decisions["orientation_direction_change"] = 0;
        }

        // Test
    }*/

    determineDesiredHeading(){
        if (this.updateHeadingLock.isLocked() || this.workingData["best_enemy"] === undefined){
            return;
        }
        this.updateHeadingLock.lock();
        
        let currentTick = this.workingData["tick"];
        let game = this.getShip().getGame();

        // Cannon infox
        let shotFlyingTimeMS = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"];
        let shotSpeed = game.getGameProperties()["cannon_settings"]["shot_speed"];

        // My info
        let myX = this.perception.getDataToReactTo("my_x", currentTick);
        let myY = this.perception.getDataToReactTo("my_y", currentTick);
        let myXV = this.perception.getDataToReactTo("my_x_v", currentTick);
        let myYV = this.perception.getDataToReactTo("my_y_v", currentTick);
        let myOrientationRAD = this.perception.getDataToReactTo("my_orientation_rad", currentTick);

        // Enemy info
        let bestEnemyShipID = this.workingData["best_enemy"].getID();
        let enemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick)[bestEnemyShipID];
        let bestEnemyX = enemyShipData["x"];
        let bestEnemyY = enemyShipData["y"];
        let bestEnemyXV = enemyShipData["x_v"];
        let bestEnemyYV = enemyShipData["y_v"];

        // Wind info (Note: This is more like wind velocity not acceleration but whatever...)
        let windXA = this.perception.getDataToReactTo("wind_xa", currentTick);
        let windYA = this.perception.getDataToReactTo("wind_ya", currentTick);
        let windOppositeOrientation = rotateCWRAD(this.perception.getDataToReactTo("wind_direction_rad", currentTick), toRadians(180));
        let windEffectCoefficient = game.getGameProperties()["cannon_ball_wind_effect_coefficient"];

        let getSign = (anInteger) => {
            if (anInteger >= 0){
                return 1;
            }else{
                return -1;
            }
        }

        let displacementEnemyToMeX = bestEnemyX - myX;
        let displacementEnemyToMeY = bestEnemyY - myY;

        let IHaveWindAdvantageX = getSign(displacementEnemyToMeX) === getSign(windXA);
        let IHaveWindAdvantageY = getSign(displacementEnemyToMeY) === getSign(windYA);

        let desiredPositionX;
        let desiredPositionY;
        // If I have both wind advantage
        if (IHaveWindAdvantageX && IHaveWindAdvantageY){
            console.log("a")
            desiredPositionX = bestEnemyX;
            desiredPositionY = bestEnemyY;
        }else if (IHaveWindAdvantageX){
            console.log("b")
            let totalCannonReachX = getSign(windXA) * shotSpeed * shotFlyingTimeMS / 1000 + 0.5 * windXA * Math.pow(shotFlyingTimeMS / 1000, 2);
            desiredPositionX = bestEnemyX + totalCannonReachX;
            desiredPositionY = bestEnemyY;
        }else if (IHaveWindAdvantageY){
            console.log("c")
            let totalCannonReachY = getSign(windYA) * shotSpeed * shotFlyingTimeMS / 1000 + 0.5 * windYA * Math.pow(shotFlyingTimeMS / 1000, 2);
            desiredPositionX = bestEnemyX;
            desiredPositionY = bestEnemyY + totalCannonReachY;  
        }else{  
            // Else, no advantage

            // Target higher speed direction and keep out of the way on the other one
            if (windXA < windYA){
                let totalCannonReachX = getSign(windXA) * shotSpeed * shotFlyingTimeMS / 1000 + 0.5 * windXA * Math.pow(shotFlyingTimeMS / 1000, 2);
                desiredPositionX = bestEnemyX + totalCannonReachX;
                desiredPositionY = bestEnemyY;
                console.log("d1")
            }else{
                let totalCannonReachY = getSign(windYA) * shotSpeed * shotFlyingTimeMS / 1000 + 0.5 * windYA * Math.pow(shotFlyingTimeMS / 1000, 2);
                desiredPositionX = bestEnemyX;
                desiredPositionY = bestEnemyY + totalCannonReachY;  
                console.log("d2")
            }
        }

        /*
        // Cannon ball info
        let flightTimeSeconds = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"] / 1000;
        let cannonShotSpeed = game.getGameProperties()["cannon_settings"]["shot_speed"];

        let desiredPositionX = bestEnemyX;
        let desiredPositionY = bestEnemyY;

        // So the question is if the enemy fired against the wind, how far would the cannon ball go
        let cannonBallXV = bestEnemyXV + windXA * windEffectCoefficient + Math.cos(windOppositeOrientation) * cannonShotSpeed;
        let cannonBallYV = bestEnemyYV + windYA * windEffectCoefficient + Math.sin(windOppositeOrientation) * cannonShotSpeed;
        //console.log("x", bestEnemyXV, windXA * windEffectCoefficient, Math.cos(windOppositeOrientation) * cannonShotSpeed);
        //console.log("y", bestEnemyYV, windYA * windEffectCoefficient, Math.sin(windOppositeOrientation) * cannonShotSpeed);

        desiredPositionX = bestEnemyX + cannonBallXV * flightTimeSeconds;
        desiredPositionY = bestEnemyY + cannonBallYV * flightTimeSeconds;*/


        // Now just get the angle
        let heading = displacementToRadians(desiredPositionX - myX, desiredPositionY - myY);
        let minAmount = toRadians(0.5);

        let distanceCW = calculateAngleDiffCWRAD(myOrientationRAD, heading);
        let distanceCCW = calculateAngleDiffCCWRAD(myOrientationRAD, heading);

        // Determine if turning

        if (distanceCW <= distanceCCW && distanceCW >= minAmount){
            this.decisions["orientation_direction_change"] = 1;
        }else if (distanceCCW < distanceCW && distanceCW >= minAmount){
            this.decisions["orientation_direction_change"] = -1;
        }else{
            this.decisions["orientation_direction_change"] = 0;
        }

        // Test
    }

    determineBestEnemy(){
        let enemyIsAliveAndWell = false;
        let currentTick = this.workingData["tick"];

        // If enemy is defined
        if (this.workingData["best_enemy"] != undefined){
            let bestEnemyShipID = this.workingData["best_enemy"].getID();
            let bestEnemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick)[bestEnemyShipID];
            // Check alive
            enemyIsAliveAndWell = bestEnemyShipData["alive"];
        }

        // If enemy is fine and on cooldown then don't update
        if (enemyIsAliveAndWell && this.updateBestEnemyLock.isLocked()){
            return;
        }

        this.updateBestEnemyLock.lock();

        let myShip = this.getShip();
        let myShipX = this.perception.getDataToReactTo("my_x", currentTick);
        let myShipY = this.perception.getDataToReactTo("my_y", currentTick);
        let game = myShip.getGame();

        let allShips = game.getShips();

        let closestShip = undefined;
        let closestShipDistance = undefined;

        // Check all ships
        let enemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick);
        for (let [ship, shipIndex] of allShips){
            // Skip my ship
            if (ship.getID() === myShip.getID()){ continue; }

            let shipData = enemyShipData[ship.getID()];

            // Skip dead ships
            if (!shipData["alive"]){ continue; }

            let shipDistance = calculateEuclideanDistance(shipData["x"], shipData["y"], myShipX, myShipY);
            if (closestShip === undefined || closestShipDistance > shipDistance){
                closestShip = ship;
                closestShipDistance = shipDistance;
            }
        }

        this.workingData["best_enemy"] = closestShip;
    }

    determineShooting(){
        /*
            Get shot flyin time ms
            Multiply by shot speed
            Filter ships that are within that distance
            Sort ships by close to far
            Take flying time ms
                Divide by N parts
                For each part of N parts
                    calculatePositionAtNTime
                    simulateShootingAtPosition and see if you hit a ship within flying time m
        */

        // Set flag for heading function

        let currentTick = this.workingData["tick"];
        let reactionTimeMS = this.reactionTimeMS;
        let myShip = this.getShip();
        let game = myShip.getGame();
        let shotFlyingTimeMS = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"];
        let shotSpeed = game.getGameProperties()["cannon_settings"]["shot_speed"];
        let shotDistance = shotSpeed * shotFlyingTimeMS / 1000;

        let myShipX = this.perception.getDataToReactTo("my_x", currentTick);
        let myShipY = this.perception.getDataToReactTo("my_y", currentTick);
        let myShipXV = this.perception.getDataToReactTo("my_x_v", currentTick);
        let myShipYV = this.perception.getDataToReactTo("my_y_v", currentTick);
        let myShipXAfterReactionTime = myShipX + (reactionTimeMS * myShipXV / 1000);
        let myShipYAfterReactionTime = myShipY + (reactionTimeMS * myShipYV / 1000);
        let myShipTickOrientation = this.perception.getDataToReactTo("my_orientation_rad", currentTick);

        // Add a simplified wind reduction
        let windXA = this.perception.getDataToReactTo("wind_xa", currentTick);
        let windYA = this.perception.getDataToReactTo("wind_ya", currentTick);
        let windEffectCoefficient = game.getGameProperties()["cannon_ball_wind_effect_coefficient"];
        let windTotalDistanceHelp = Math.sqrt(Math.pow(windXA, 2) + Math.pow(windYA, 2)) * windEffectCoefficient * shotFlyingTimeMS / 1000;

        let shotDistanceWithMaxWindHelp = shotDistance + windTotalDistanceHelp;


        // Find ships within this
        let shipsWithinRange = [];

        // Check all ships
        let allShips = game.getShips();
        let enemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick);
        for (let [ship, shipIndex] of allShips){
            // Skip my ship
            if (ship.getID() === myShip.getID()){ continue; }

            let shipData = enemyShipData[ship.getID()];

            // Skip dead ships
            if (!shipData["alive"]){ continue; }

            let shipDistance = calculateEuclideanDistance(shipData["x"], shipData["y"], myShipX, myShipY);
            if (shipDistance <= shotDistanceWithMaxWindHelp){
                shipsWithinRange.push({"ship": ship, "distance": shipDistance});
            }
        }

        // Sort
        let sortLeastToMoveFunc = (a, b) => {
            return a["distance"] - b["distance"];
        }
        shipsWithinRange.sort(sortLeastToMoveFunc);

        let myCannons = myShip.getCannons();
        let myCannonData = this.perception.getDataToReactTo("my_cannon_data", currentTick);

        let searchPrecision = 1; // ms
        let maxDistance = game.getGameProperties()["bot_settings"]["max_expected_hit_distance"];

        // Calculator required stuff

        let distanceFromTargetCalculator = (shipData, timeStampMS, reactionTimeMS) => {
            let shipXAtTime = shipData["x"] + shipData["x_v"] * (timeStampMS + reactionTimeMS) / 1000;
            let shipYAtTime = shipData["y"] + shipData["y_v"] * (timeStampMS + reactionTimeMS) / 1000; 

            let windDiplacementInTimeX = 0.5 * windXA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);
            let windDiplacementInTimeY = 0.5 * windYA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);

            let aimAtX = shipXAtTime - windDiplacementInTimeX;
            let aimAtY = shipYAtTime - windDiplacementInTimeY;

            let angleToPoint = displacementToRadians(aimAtX - myShipX, aimAtY - myShipY);

            let cannonBallXV = myShipXV + Math.cos(angleToPoint) * shotSpeed;
            let cannonBallYV = myShipYV + Math.sin(angleToPoint) * shotSpeed; 
            let cannonBallEndX = myShipXAfterReactionTime + cannonBallXV * timeStampMS / 1000;
            let cannonBallEndY = myShipYAfterReactionTime + cannonBallYV * timeStampMS / 1000;

            return { "distance": calculateEuclideanDistance(aimAtX, aimAtY, cannonBallEndX, cannonBallEndY), "time": timeStampMS };
        }

        let countCannons = (shipData, timeStampMS, reactionTimeMS) => {
            let shipXAtTime = shipData["x"] + shipData["x_v"] * (reactionTimeMS + timeStampMS) / 1000;
            let shipYAtTime = shipData["y"] + shipData["y_v"] * (reactionTimeMS + timeStampMS) / 1000; 

            let windDiplacementInTimeX = 0.5 * windXA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);
            let windDiplacementInTimeY = 0.5 * windYA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);

            let aimAtX = shipXAtTime - windDiplacementInTimeX;
            let aimAtY = shipYAtTime - windDiplacementInTimeY;

            // Check the number of cannons LOADED and CAN_AIM_AT_LOCATION
            let cannonCount = 0;
            for (let cannon of myCannons){
                let cannonIsLoaded = myCannonData[cannon.getCannonIndex()]["is_loaded"];
                if (!cannonIsLoaded){ continue; }
                let rangeCWL = cannon.getRangeCWL();
                let rangeCWR = cannon.getRangeCWR();
                let cannonXCenterOffset = cannon.getXCenterOffset();
                let cannonYCenterOffset = cannon.getYCenterOffset();
                let cannonTickX = Cannon.getTickX(myShipXAfterReactionTime, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);
                let cannonTickY = Cannon.getTickY(myShipYAfterReactionTime, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);

                let cannonCouldAimAtIt = Cannon.couldAimAt(rangeCWL, rangeCWR, myShipTickOrientation, cannonTickX, cannonTickY, aimAtX, aimAtY);
                // Record that 1 more cannon can aim at it
                if (cannonCouldAimAtIt){
                    cannonCount += 1;
                }
            }
            return {"aim_at_x": aimAtX, "aim_at_y": aimAtY, "cannon_count": cannonCount}
        }
        /*
        let countCannons = (shipData, timeStampMS, reactionTimeMS) => {
            let shipXAtTime = shipData["x"] + shipData["x_v"] * (reactionTimeMS + timeStampMS) / 1000;
            let shipYAtTime = shipData["y"] + shipData["y_v"] * (reactionTimeMS + timeStampMS) / 1000; 

            let windDiplacementInTimeX = 0.5 * windXA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);
            let windDiplacementInTimeY = 0.5 * windYA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);

            let aimAtX = shipXAtTime - windDiplacementInTimeX;
            let aimAtY = shipYAtTime - windDiplacementInTimeY;

            let angleToPoint = displacementToRadians(aimAtX - myShipX, aimAtY - myShipY);

            let cannonBallXV = myShipXV + Math.cos(angleToPoint) * shotSpeed;
            let cannonBallYV = myShipYV + Math.sin(angleToPoint) * shotSpeed; 
            let cannonBallEndX = myShipXAfterReactionTime + cannonBallXV * timeStampMS / 1000;
            let cannonBallEndY = myShipYAfterReactionTime + cannonBallYV * timeStampMS / 1000;

            let expectedHitX = cannonBallEndX + windDiplacementInTimeX;
            let expectedHitY = cannonBallEndY + windDiplacementInTimeY;

            // Check the number of cannons LOADED and CAN_AIM_AT_LOCATION
            let cannonCount = 0;
            for (let cannon of myCannons){
                let cannonIsLoaded = myCannonData[cannon.getCannonIndex()]["is_loaded"];
                if (!cannonIsLoaded){ continue; }
                let rangeCWL = cannon.getRangeCWL();
                let rangeCWR = cannon.getRangeCWR();
                let cannonXCenterOffset = cannon.getXCenterOffset();
                let cannonYCenterOffset = cannon.getYCenterOffset();
                let cannonTickX = Cannon.getTickX(myShipXAfterReactionTime, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);
                let cannonTickY = Cannon.getTickY(myShipYAfterReactionTime, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);

                let cannonCouldAimAtIt = Cannon.couldAimAt(rangeCWL, rangeCWR, myShipTickOrientation, cannonTickX, cannonTickY, aimAtX, aimAtY);
                // Record that 1 more cannon can aim at it
                if (cannonCouldAimAtIt){
                    cannonCount += 1;
                }
            }
            return {"aim_at_x": aimAtX, "aim_at_y": aimAtY, "cannon_count": cannonCount, "time": timeStampMS, "shipXAtTime": shipXAtTime, "shipYAtTime": shipYAtTime, "expectedHitX": expectedHitX, "expectedHitY": expectedHitY}
        }*/

        // Go through each ship (closest to furthest)
        for (let shipObj of shipsWithinRange){
            //debugger;
            //console.log("Here")
            let ship = shipObj["ship"];
            let shipData = enemyShipData[ship.getID()];

            // Use ternary search
            let minTime = 0;
            let maxTime = shotFlyingTimeMS;
            let currentResult;

            // Loop until percision is found
            //debugger;
            while (maxTime - minTime > searchPrecision){
                let rightLeftDifference = maxTime - minTime;
                let pointM1 = minTime + rightLeftDifference / 3;
                let pointM2 = maxTime - rightLeftDifference / 3;

                // If score is better on the right -> Move search right
                let m1Result = distanceFromTargetCalculator(shipData, pointM1, reactionTimeMS);
                let m2Result = distanceFromTargetCalculator(shipData, pointM2, reactionTimeMS);
                let distanceM1 = m1Result["distance"];
                let distanceM2 = m2Result["distance"];

                if (distanceM1 > distanceM2){
                    minTime = pointM1;
                    currentResult = m2Result;
                }else{
                    maxTime = pointM2;
                    currentResult = m1Result;
                }
            }

            let bestDistance = currentResult["distance"];
            let bestTime = currentResult["time"];

            // If distance is too big
            if (bestDistance > maxDistance){
                continue;
            }

            // Search for left bound
            minTime = 0;
            maxTime = bestTime;
            let leftBoundTime = bestTime;
            while (maxTime - minTime > searchPrecision){
                let rightLeftDifference = maxTime - minTime;
                let pointM1 = minTime + rightLeftDifference / 3;
                let pointM2 = maxTime - rightLeftDifference / 3;

                // Find distance to MAX_DISTANCE
                let m1Result = distanceFromTargetCalculator(shipData, pointM1, reactionTimeMS);
                let m2Result = distanceFromTargetCalculator(shipData, pointM2, reactionTimeMS);
                let distanceM1 = Math.abs(m1Result["distance"] - maxDistance);
                let distanceM2 = Math.abs(m2Result["distance"] - maxDistance);
                if (distanceM1 > distanceM2){
                    minTime = pointM1;
                }else{
                    maxTime = pointM2;
                    leftBoundTime = m1Result["time"]; // Always keep right result
                }
            } 

            // Search for right bound
            minTime = bestTime;
            maxTime = shotFlyingTimeMS;
            let rightBoundTime = bestTime;
            while (maxTime - minTime > searchPrecision){
                let rightLeftDifference = maxTime - minTime;
                let pointM1 = minTime + rightLeftDifference / 3;
                let pointM2 = maxTime - rightLeftDifference / 3;

                // Find distance to MAX_DISTANCE
                let m1Result = distanceFromTargetCalculator(shipData, pointM1, reactionTimeMS);
                let m2Result = distanceFromTargetCalculator(shipData, pointM2, reactionTimeMS);
                let distanceM1 = Math.abs(m1Result["distance"] - maxDistance);
                let distanceM2 = Math.abs(m2Result["distance"] - maxDistance);
                if (distanceM1 > distanceM2){
                    minTime = pointM1;
                    rightBoundTime = m1Result["time"]; // Always keep left result
                }else{
                    maxTime = pointM2;
                }
            } 

            minTime = leftBoundTime;
            maxTime = rightBoundTime;
            let shootCannonsResult = countCannons(shipData, bestTime, reactionTimeMS);
            let currentTime = minTime;
            // Loop until out of time or find a cannon to shoot
            while (shootCannonsResult["cannon_count"] === 0 && currentTime < maxTime){
                shootCannonsResult = countCannons(shipData, currentTime, reactionTimeMS);
                currentTime += searchPrecision;
            }

            // No cannons can shoot
            if (shootCannonsResult["cannon_count"] === 0){
                continue;
            }

            /*
            if (!objectHasKey(this.workingData, "debug_circle2")){
                this.workingData["debug_circle2"] = new DebugCircle("#00ff00", 0, 0, 20);
                game.visualEffects.push(this.workingData["debug_circle2"]);
            }
            let debugResult = debugCalculation(shipData, debugFinalTime);
            this.workingData["debug_circle2"].update(debugResult["cannon_ball_end_x"], debugResult["cannon_ball_end_y"]);*/

            // Now we have the window for acceptable distance -> Search for location that the most guns can shoot at


            /*if (!objectHasKey(this.workingData, "debug_line")){
                this.workingData["debug_line"] = new DebugLine(game.getGameProperties()["colour_to_colour_code"][myShip.getColour()], result["cannon_ball_end_x"], result["cannon_ball_end_y"], result["aim_at_x"], result["aim_at_y"], 5);
                game.visualEffects.push(this.workingData["debug_line"]);
            }

            this.workingData["debug_line"].update(result["cannon_ball_end_x"], result["cannon_ball_end_y"], result["aim_at_x"], result["aim_at_y"]);

            if (!objectHasKey(this.workingData, "debug_line")){
                this.workingData["debug_line"] = new DebugLine(game.getGameProperties()["colour_to_colour_code"][myShip.getColour()], myShipX, myShipY, result["aim_at_x"], result["aim_at_y"], 10);
                game.visualEffects.push(this.workingData["debug_line"]);
            }

            this.workingData["debug_line"].update(myShipX, myShipY, result["aim_at_x"], result["aim_at_y"]);
            */

            // First at location
            this.decisions["aiming_cannons"] = true;
            this.decisions["aiming_cannons_position_x"] = shootCannonsResult["aim_at_x"] - myShipX;
            this.decisions["aiming_cannons_position_y"] = shootCannonsResult["aim_at_y"] - myShipY;
            this.decisions["fire_cannons"] = true;

           /* if (!objectHasKey(this.workingData, "debug_circle2")){
                //this.workingData["debug_circle2"] = new DebugCircle("#00ff00", 0, 0, 20);
                //game.visualEffects.push(this.workingData["debug_circle2"]);
            }

            //this.workingData["debug_circle2"].update(shootCannonsResult["expectedHitX"], shootCannonsResult["expectedHitY"]);

            if (!objectHasKey(this.workingData, "debug_circle1")){
                //this.workingData["debug_circle1"] = new DebugCircle("#ff0000", 0, 0, 20);
                //game.visualEffects.push(this.workingData["debug_circle1"]);
            }

            //this.workingData["debug_circle1"].update(shootCannonsResult["aim_at_x"], shootCannonsResult["aim_at_y"]);

            //console.log("Firing", shootCannonsResult["time"]);
            */

            // End function
            return;
        }

        // Else don't shoot
        this.decisions["fire_cannons"] = false;
    }

    determineSailStrength(){
        if (this.updateSailTickLock.isLocked()){
            return;
        }
        this.updateSailTickLock.lock();

        let currentTick = this.workingData["tick"];
        let ship = this.getShip();
        let game = ship.getGame();
        let myOrientation = this.perception.getDataToReactTo("my_orientation_rad", currentTick);
        let windDirectionRAD = this.perception.getDataToReactTo("wind_direction_magnitude", currentTick);
        let currentSpeed = this.perception.getDataToReactTo("my_speed", currentTick);
        let windXA = this.perception.getDataToReactTo("wind_xa", currentTick);
        let windYA = this.perception.getDataToReactTo("wind_ya", currentTick);

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
        this.decisions["new_sail_strength"] = finalValueSettleOn;
    }

    getShip(){
        return this.ship;
    }

    getDecisionJSON(){
        return this.decisions;
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { BotShipController }
}
