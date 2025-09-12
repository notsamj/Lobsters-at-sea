// If using NodeJS then do imports
if (typeof window === "undefined"){
    BotPerception = require("./bot_perception/bot_perception.js").BotPerception;
    Ship = require("../ship.js").Ship;
    randomFloatBetween = require("../../../general/helper_functions.js").randomFloatBetween;
    fixRadians = require("../../../general/math_helper.js").fixRadians;
}
/*
    Class Name: BotShipController
    Class Description: A controller for bots
*/
class BotShipController {
    /*
        Method Name: constructor
        Method Parameters: 
            botShipControllerJSON:
                JSON with information on the bot controller
        Method Description: constructor
        Method Return: constructor
    */
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

    /*
        Method Name: getOffset
        Method Parameters: 
            offsetName:
                The name of the offset
        Method Description: Gets an offset value for a given offset type
        Method Return: Array with 2 elements, both float
    */
    getOffset(offsetName){
        if (objectHasKey(this.offsets, offsetName)){
            return this.offsets[offsetName];
        }
        throw new Error("Offet: " + offsetName + " not found.");
    }

    /*
        Method Name: generateOffset
        Method Parameters: 
            offsetName:
                Name of the offset
        Method Description: Generates a value given an offet with properties
        Method Return: float
    */
    generateOffset(offsetName){
        let offset = this.getOffset(offsetName);
        return randomFloatBetween(offset[0], offset[1]);
    }

    /*
        Method Name: resetDecisions
        Method Parameters: None
        Method Description: Resets the decisions
        Method Return: void
    */
    resetDecisions(){
        copyOverObject(Ship.getDefaultDecisions(), this.decisions);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles tick actions
        Method Return: void
    */
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

    /*
        Method Name: updatePerception
        Method Parameters: None
        Method Description: Updates the bot perception
        Method Return: void
    */
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
        this.perception.inputData("my_speed", myShip.getSpeed() + this.generateOffset("my_speed"), currentTick);
        this.perception.inputData("my_x", myShip.getTickX() + this.generateOffset("my_x"), currentTick);
        this.perception.inputData("my_y", myShip.getTickY() + this.generateOffset("my_y"), currentTick);
        this.perception.inputData("my_x_v", myShip.getTickXV() + this.generateOffset("my_x_v"), currentTick);
        this.perception.inputData("my_y_v", myShip.getTickYV() + this.generateOffset("my_y_v"), currentTick);
        this.perception.inputData("my_ship_sail_strength", myShip.getTickSailStrength(), currentTick);
        
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
                "orientation_rad": ship.getTickOrientation(),
                "ship_sail_strength": ship.getTickSailStrength(),
                "speed": ship.getSpeed()
            }
        }
        this.perception.inputData("enemy_ship_data", allShipData, currentTick);
    }

    /*
        Method Name: makeDecisions
        Method Parameters: None
        Method Description: Makes decisions
        Method Return: void
    */
    makeDecisions(){
        // If no data -> No decision changes
        if (!this.perception.hasDataToReactTo("default", this.workingData["tick"])){ return; }

        this.determineBestEnemy();
        this.determineDesiredHeading();
        this.determineSailStrength();
        this.determineShooting();
    }

    /*
        Method Name: determineDesiredHeading
        Method Parameters: None
        Method Description: Comes up with a heading for the ship
        Method Return: void
    */
    determineDesiredHeading(){
        if (this.updateHeadingLock.isLocked() || this.workingData["best_enemy"] === undefined){
            return;
        }
        this.updateHeadingLock.lock();

        let currentTick = this.workingData["tick"];
        let reactionTimeMS = this.reactionTimeMS;
        let myShip = this.getShip();
        let game = myShip.getGame();

        // My info
        let myX = this.perception.getDataToReactTo("my_x", currentTick);
        let myY = this.perception.getDataToReactTo("my_y", currentTick);
        let myXV = this.perception.getDataToReactTo("my_x_v", currentTick);
        let myYV = this.perception.getDataToReactTo("my_y_v", currentTick);
        let mySpeed = this.perception.getDataToReactTo("my_speed", currentTick);
        let myShipXAfterReactionTime = myX + (reactionTimeMS * myXV / 1000);
        let myShipYAfterReactionTime = myY + (reactionTimeMS * myYV / 1000);
        let myOrientationRAD = this.perception.getDataToReactTo("my_orientation_rad", currentTick);
        let myDataJSON = {
            "x": myX,
            "y": myY,
            "x_v": myXV,
            "y_v": myYV,
            "orientation_rad": myOrientationRAD
        }

        // Enemy info
        let bestEnemyShipID = this.workingData["best_enemy"].getID();
        let enemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick)[bestEnemyShipID];
        let enemyXAfterReactionTime = enemyShipData["x"] + (reactionTimeMS * enemyShipData["x_v"] / 1000);
        let enemyYAfterReactionTime = enemyShipData["y"] + (reactionTimeMS * enemyShipData["y_v"] / 1000);

        let currentCannonResultOnEnemy = this.getCannonFireResult(enemyShipData, myDataJSON);
        let canAimAtEnemy = currentCannonResultOnEnemy["cannon_count_aim"] > 0;

        let currentCannonResultEnemyOnMe = this.getCannonFireResult(myDataJSON, enemyShipData);
        let enemyCanAimAtMe = currentCannonResultEnemyOnMe["cannon_count_aim"] > 0;

        // Turn procedure
        let turnTimesMS = game.getGameProperties()["bot_settings"]["turn_calculation_times_ms"];
        let tickMS = game.getGameProperties()["ms_between_ticks"];
        let turningRadiusDegrees = game.getGameProperties()["ship_data"][myShip.getShipModel()]["turning_radius_degrees"];
        let shipSailStrength = this.perception.getDataToReactTo("my_ship_sail_strength", currentTick);

        let windDirectionRAD = this.perception.getDataToReactTo("wind_direction_rad", currentTick);
        let windXA = this.perception.getDataToReactTo("wind_xa", currentTick);
        let windYA = this.perception.getDataToReactTo("wind_ya", currentTick);
        let shipAirAffectednessCoefficient = game.getGameProperties()["ship_air_affectedness_coefficient"];
        let willReductionOnAccountOfSailStrengthExponent = game.getGameProperties()["will_reduction_on_account_of_sail_strength_exponent"];
        let propulsionConstant = myShip.getPropulsionConstant();
        let windEffectCoefficient = game.getGameProperties()["cannon_ball_wind_effect_coefficient"];
        let shotFlyingTimeMS = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"];

        let windDiplacementInTimeX = 0.5 * windXA * windEffectCoefficient * Math.pow(shotFlyingTimeMS / 1000, 2);
        let windDiplacementInTimeY = 0.5 * windYA * windEffectCoefficient * Math.pow(shotFlyingTimeMS / 1000, 2);

        let perfectLocationToHitEnemyX = enemyXAfterReactionTime - windDiplacementInTimeX;
        let perfectLocationToHitEnemyY = enemyYAfterReactionTime - windDiplacementInTimeY;

        let considerTurn = () => {
            // Left turn
            let leftTurnResults = considerTurnInDirection(-1);

            // Right turn
            let rightTurnResults = considerTurnInDirection(1);

            // Take the best cannon count and return it
            let bestResult = null;

            for (let turnResult of leftTurnResults){
                let score = turnResult["my_cannon_count"] - turnResult["enemy_cannon_count"];
                // If we found a better score
                if (bestResult === null || score > bestResult["my_cannon_count"] - bestResult["enemy_cannon_count"]){
                    bestResult = turnResult;
                }
            }

            for (let turnResult of rightTurnResults){
                let score = turnResult["my_cannon_count"] - turnResult["enemy_cannon_count"];
                // If we found a better score
                if (bestResult === null || score > bestResult["my_cannon_count"] - bestResult["enemy_cannon_count"]){
                    bestResult = turnResult;
                }
            }

            if (bestResult === null){
                throw new Error("Unable to run turn simulation.");
            }
            return bestResult;
        }

        let considerTurnInDirection = (turnDirection) => {
            let turnResults = [];
            let turnXPos = myShipXAfterReactionTime;
            let turnYPos = myShipYAfterReactionTime;
            let turnXV = myXV;
            let turnYY = myYV;
            let turnSpeed = mySpeed;
            let turnNewSailStrength = shipSailStrength; // Not changing
            let turnOrientationRAD = myOrientationRAD;
            let totalMSShipMoved = 0;

            for (let turnTimeMS of turnTimesMS){
                // Simulate ship catching up to tick
                while (totalMSShipMoved < turnTimesMS){
                    // Prepare my info at point in time
                    let positionInfo = Ship.getPositionInfoInMS(msChange, windXA, windYA, shipSailStrength, turnOrientationRAD, windDirectionRAD, shipAirAffectednessCoefficient, willReductionOnAccountOfSailStrengthExponent, propulsionConstant, turnSpeed, turnXPos, turnYPos);
                    let result = Ship.moveOneTick(positionInfo, turnXPos, turnYPos, turnDirection, turnOrientationRAD, turningRadiusDegrees, turnNewSailStrength, shipSailStrength);
                    // Update from results
                    turnXPos = result["new_x_pos"];
                    turnYPos = result["new_y_pos"];

                    turnXV = result["new_x_v"];
                    turnYY = result["new_y_v"];

                    turnSpeed = result["new_speed"];

                    turnOrientationRAD = result["new_orientation_rad"];

                    totalMSShipMoved += tickMS;
                }

                // Update enemy position at time
                let enemyPropulsionConstant = this.workingData["best_enemy"].getPropulsionConstant();
                let enemyPositionInfo = Ship.getPositionInfoInMS(turnTimeMS, windXA, windYA, enemyShipData["ship_sail_strength"], enemyShipData["orientation_rad"], windDirectionRAD, shipAirAffectednessCoefficient, willReductionOnAccountOfSailStrengthExponent, enemyPropulsionConstant, enemyShipData["speed"], enemyShipData["x"], enemyShipData["y"]);
                let enemyJSONAfterITurn = copyObject(enemyShipData);
                enemyJSONAfterITurn["x"] = enemyPositionInfo["x_pos"];
                enemyJSONAfterITurn["y"] = enemyPositionInfo["y_pos"];

                enemyJSONAfterITurn["x_v"] = enemyPositionInfo["x_v"];
                enemyJSONAfterITurn["y_v"] = enemyPositionInfo["y_v"];

                // Check cannon count
                let myTurnedJSON = {
                    "x": turnXPos,
                    "y": turnYPos,
                    "x_v": turnXV,
                    "y_v": turnYY,
                    "orientation_rad": turnOrientationRAD
                }
                let myTurnedCannonCount = this.getCannonFireResult(enemyJSONAfterITurn, myTurnedJSON)["cannon_count_aim"];

                // Check enemy
                let myTurnedEnemyCannonCount = this.getCannonFireResult(myTurnedJSON, enemyJSONAfterITurn)["cannon_count_aim"];

                // Record
                turnResults.push({
                    "heading": turnOrientationRAD,
                    "my_cannon_count_aim": myTurnedCannonCount,
                    "enemy_cannon_count_aim": myTurnedEnemyCannonCount,
                    "ms": turnTimeMS
                });
            }
            return turnResults;
        }

        let heading;
        // If I can aim at enemy and they can't aim at me -> keep aiming in the same direction
        if (canAimAtEnemy && !enemyCanAimAtMe){
            heading = myOrientationRAD;        }
        // Neither of us can aim at one another -> Turn or head straight fo rthem
        else if (!canAimAtEnemy && !enemyCanAimAtMe){
            let turnResult = considerTurn();

            // If turn helps me -> Follow turn procedure
            if (turnResult["my_cannon_count_aim"] > 0 && turnResult["my_cannon_count_aim"] >= turnResult["enemy_cannon_count_aim"]){
                heading = turnResult["heading"];
            }
            // Turn doesn't help me -> Point to the ideal location to hit the enemy from
            else{
                heading = displacementToRadians(perfectLocationToHitEnemyX - myShipXAfterReactionTime, perfectLocationToHitEnemyY - myShipYAfterReactionTime);
            }
        }
        // If enemy can aim at me but I can't aim at it
        else if (enemyCanAimAtMe && !canAimAtEnemy){
            let turnResult = considerTurn();

            // If turn helps me -> Follow turn procedure
            if (turnResult["my_cannon_count_aim"] >= turnResult["enemy_cannon_count_aim"]){
                heading = turnResult["heading"];
            }
            // Turn doesn't help me -> Point to the ideal location to hit the enemy from
            else{
                //heading = windDirectionRAD;
                heading = displacementToRadians(perfectLocationToHitEnemyX - myShipXAfterReactionTime, perfectLocationToHitEnemyY - myShipYAfterReactionTime);
            }
        }
        // Else -> We can both aim at one another
        else{
            // If my count > their count -> keep on course
            if (currentCannonResultOnEnemy["cannon_count_aim"] > currentCannonResultEnemyOnMe["cannon_count_aim"]){
                heading = myOrientationRAD;
            }
            // Else -> They have the advantage -> Consider a turn
            else{
                let turnResult = considerTurn();

                // If turn helps me -> Follow turn procedure
                if (turnResult["my_cannon_count_aim"] > currentCannonResultOnEnemy["cannon_count_aim"] && turnResult["my_cannon_count_aim"] >= turnResult["enemy_cannon_count_aim"]){
                    heading = turnResult["heading"];
                }
                // Turn doesn't help me -> Point to the ideal location to hit the enemy from
                else{
                    //heading = windDirectionRAD;
                    heading = displacementToRadians(perfectLocationToHitEnemyX - myShipXAfterReactionTime, perfectLocationToHitEnemyY - myShipYAfterReactionTime);
                }
            }
        }

        // Now just get the angle
        
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
    }

    /*
        Method Name: determineBestEnemy
        Method Parameters: None
        Method Description: Determines which opponent to target
        Method Return: void
    */
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

    /*
        Method Name: getCannonFireResult
        Method Parameters: 
            enemyShipData:
                JSON with enemy ship data
            myShipData:
                JSON with data about my ship
        Method Description: Finds out information on shooting a cannon from my ship at an enemy ship
        Method Return: void
    */
    getCannonFireResult(enemyShipData, myShipData){
        let currentTick = this.workingData["tick"];
        let myShip = this.getShip();
        let game = myShip.getGame();
        let reactionTimeMS = this.reactionTimeMS;
        let shotFlyingTimeMS = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"];
        let shotSpeed = game.getGameProperties()["cannon_settings"]["shot_speed"];


        let myShipX = myShipData["x"];
        let myShipY = myShipData["y"];
        let myShipXV = myShipData["x_v"];
        let myShipYV = myShipData["y_v"];
        let myShipXAfterReactionTime = myShipX + (reactionTimeMS * myShipXV / 1000);
        let myShipYAfterReactionTime = myShipY + (reactionTimeMS * myShipYV / 1000);
        let myShipTickOrientation = myShipData["orientation_rad"];

        let windXA = this.perception.getDataToReactTo("wind_xa", currentTick);
        let windYA = this.perception.getDataToReactTo("wind_ya", currentTick);
        let windEffectCoefficient = game.getGameProperties()["cannon_ball_wind_effect_coefficient"];

        let myCannons = myShip.getCannons();
        let myCannonData = this.perception.getDataToReactTo("my_cannon_data", currentTick);

        let searchPrecision = game.getGameProperties()["bot_settings"]["search_precision_ms"]; // ms

        let mdfStart = game.getGameProperties()["bot_settings"]["start_max_expected_hit_distance"];
        let mdfMax = game.getGameProperties()["bot_settings"]["max_expected_hit_distance"];
        let mdfConst = game.getGameProperties()["bot_settings"]["constant_max_expected_hit_distance"];
        let maxDistanceFunction = (x) => {
            return mdfStart + (mdfMax - mdfStart) * (1 - Math.pow(Math.E, -1 * x / mdfConst));
        }

        // Calculator required stuff

        let distanceFromTargetCalculator = (enemyShipData, timeStampMS, reactionTimeMS) => {
            let shipXAtTime = enemyShipData["x"] + enemyShipData["x_v"] * (timeStampMS + reactionTimeMS) / 1000;
            let shipYAtTime = enemyShipData["y"] + enemyShipData["y_v"] * (timeStampMS + reactionTimeMS) / 1000; 

            let windDiplacementInTimeX = 0.5 * windXA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);
            let windDiplacementInTimeY = 0.5 * windYA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);

            let aimAtX = shipXAtTime - windDiplacementInTimeX;
            let aimAtY = shipYAtTime - windDiplacementInTimeY;

            let angleToPoint = displacementToRadians(aimAtX - myShipXAfterReactionTime, aimAtY - myShipYAfterReactionTime);

            let cannonBallXV = myShipXV + Math.cos(angleToPoint) * shotSpeed;
            let cannonBallYV = myShipYV + Math.sin(angleToPoint) * shotSpeed; 
            let cannonBallSimpleEndX = myShipXAfterReactionTime + cannonBallXV * timeStampMS / 1000;
            let cannonBallSimpleEndY = myShipYAfterReactionTime + cannonBallYV * timeStampMS / 1000;

            return { "distance": calculateEuclideanDistance(aimAtX, aimAtY, cannonBallSimpleEndX, cannonBallSimpleEndY), "time": timeStampMS };
        }

        let countCannons = (enemyShipData, timeStampMS, reactionTimeMS) => {
            let shipXAtTime = enemyShipData["x"] + enemyShipData["x_v"] * (reactionTimeMS + timeStampMS) / 1000;
            let shipYAtTime = enemyShipData["y"] + enemyShipData["y_v"] * (reactionTimeMS + timeStampMS) / 1000; 

            let windDiplacementInTimeX = 0.5 * windXA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);
            let windDiplacementInTimeY = 0.5 * windYA * windEffectCoefficient * Math.pow(timeStampMS / 1000, 2);

            let aimAtX = shipXAtTime - windDiplacementInTimeX;
            let aimAtY = shipYAtTime - windDiplacementInTimeY;

            // Check the number of cannons LOADED and CAN_AIM_AT_LOCATION
            let cannonCount = 0;
            let cannonCountAim = 0; // Just aim not necessarily loaded
            for (let cannon of myCannons){
                let cannonIsLoaded = myCannonData[cannon.getCannonIndex()]["is_loaded"];
                let rangeCWL = cannon.getRangeCWL();
                let rangeCWR = cannon.getRangeCWR();
                let cannonXCenterOffset = cannon.getXCenterOffset();
                let cannonYCenterOffset = cannon.getYCenterOffset();
                let cannonTickX = Cannon.getTickX(myShipXAfterReactionTime, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);
                let cannonTickY = Cannon.getTickY(myShipYAfterReactionTime, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);

                let cannonCouldAimAtIt = Cannon.couldAimAt(rangeCWL, rangeCWR, myShipTickOrientation, cannonTickX, cannonTickY, aimAtX, aimAtY);
                // Record that 1 more cannon can aim at it
                if (cannonCouldAimAtIt){
                    if (cannonIsLoaded){
                        cannonCount += 1;
                    }
                    cannonCountAim += 1;
                }
            }
            return {"aim_at_x": aimAtX, "aim_at_y": aimAtY, "cannon_count": cannonCount, "cannon_count_aim": cannonCountAim, "target_ship_x": shipXAtTime, "target_ship_y": shipYAtTime}
        }

         // Use ternary search
        let minTime = 0;
        let maxTime = shotFlyingTimeMS;

        let currentResult;

        // Loop until percision is found
        while (maxTime - minTime > searchPrecision){
            let rightLeftDifference = maxTime - minTime;
            let pointM1 = minTime + rightLeftDifference / 3;
            let pointM2 = maxTime - rightLeftDifference / 3;

            // If score is better on the right -> Move search right
            let m1Result = distanceFromTargetCalculator(enemyShipData, pointM1, reactionTimeMS);
            let m2Result = distanceFromTargetCalculator(enemyShipData, pointM2, reactionTimeMS);
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
        let maxDistance = maxDistanceFunction(bestTime);
        if (bestDistance > maxDistance){
            return {"cannon_count": 0, "cannon_count_aim": 0, "best_distance": bestDistance} // Cannot hit this ship with any cannon
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
            let m1Result = distanceFromTargetCalculator(enemyShipData, pointM1, reactionTimeMS);
            let m2Result = distanceFromTargetCalculator(enemyShipData, pointM2, reactionTimeMS);
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
            let m1Result = distanceFromTargetCalculator(enemyShipData, pointM1, reactionTimeMS);
            let m2Result = distanceFromTargetCalculator(enemyShipData, pointM2, reactionTimeMS);
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
        let shootCannonsResult = countCannons(enemyShipData, bestTime, reactionTimeMS);
        let currentTime = minTime;
        // Loop until out of time or find a cannon to shoot
        while (shootCannonsResult["cannon_count"] === 0 && currentTime < maxTime){
            shootCannonsResult = countCannons(enemyShipData, currentTime, reactionTimeMS);
            currentTime += searchPrecision;
        }

        // Add best distance for debugging
        shootCannonsResult["best_distance"] = bestDistance;

        return shootCannonsResult;
    }

    /*
        Method Name: determineShooting
        Method Parameters: None
        Method Description: Determine whether or not I should shoot and where
        Method Return: void
    */
    determineShooting(){
        /*
            Get shot flying time ms
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
        let windTotalDistanceHelp = 0.5 * Math.sqrt(Math.pow(windXA, 2) + Math.pow(windYA, 2)) * windEffectCoefficient * Math.pow(shotFlyingTimeMS / 1000, 2);

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

        let myShipData = {
            "x": myShipX,
            "y": myShipY,
            "x_v": myShipXV,
            "y_v": myShipYV,
            "orientation_rad": myShipTickOrientation
        }

        // Go through each ship (closest to furthest)
        for (let shipObj of shipsWithinRange){
            let ship = shipObj["ship"];
            let enemyShipJSON = enemyShipData[ship.getID()];

            let shootCannonsResult = this.getCannonFireResult(enemyShipJSON, myShipData);
            // No cannons can shoot
            if (shootCannonsResult["cannon_count"] === 0){
                continue;
            }

           

            // First at location
            this.decisions["aiming_cannons"] = true;
            this.decisions["aiming_cannons_position_x"] = shootCannonsResult["aim_at_x"] - myShipX;
            this.decisions["aiming_cannons_position_y"] = shootCannonsResult["aim_at_y"] - myShipY;
            this.decisions["fire_cannons"] = true;


            // End function
            return;
        }

        // Else don't shoot
        this.decisions["fire_cannons"] = false;
    }

    /*
        Method Name: determineSailStrength
        Method Parameters: None
        Method Description: Comes up with a sail strength for the ship
        Method Return: void
    */
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
        Method Description: Getter
        Method Return: JSON
    */
    getDecisionJSON(){
        return this.decisions;
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { BotShipController }
}