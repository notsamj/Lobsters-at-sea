// If using NodeJS then do imports
if (typeof window === "undefined"){
    BotPerception = require("./bot_perception.js").BotPerception;
}
class BotShipController {
    constructor(botShipControllerJSON){
        this.ship = botShipControllerJSON["ship"];

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
        this.perception.inputData("my_orientation_rad", myShip.getTickOrientation(), currentTick);
        this.perception.inputData("my_speed", myShip.getSpeed(), currentTick);
        this.perception.inputData("my_x", myShip.getTickX(), currentTick);
        this.perception.inputData("my_y", myShip.getTickY(), currentTick);
        this.perception.inputData("my_x_v", myShip.getTickXV(), currentTick);
        this.perception.inputData("my_y_v", myShip.getTickYV(), currentTick);
        
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
        this.perception.inputData("wind_direction_rad", windDirectionRAD, currentTick);

        // Save wind magnitude
        let windDirectionMagnitude = wind.getWindMagnitude();
        this.perception.inputData("wind_direction_magnitude", windDirectionMagnitude, currentTick);

        // Save wind xa
        let windXA = wind.getXA();
        this.perception.inputData("wind_xa", windXA, currentTick);

        // Save wind ya
        let windYA = wind.getYA();
        this.perception.inputData("wind_ya", windYA, currentTick);

        // Save other ship data
        let allShips = game.getShips();
        let allShipData = {}
        for (let [ship, shipIndex] of allShips){
            // Skip my ship
            if (ship.getID() === myShip.getID()){ continue; }
            allShipData[ship.getID()] = {
                "alive": ship.isAlive(),
                "x": ship.getTickX(),
                "y": ship.getTickY(),
                "x_v": ship.getTickXV(),
                "y_v": ship.getTickYV()
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
    }

    determineDesiredHeading(){
        if (this.updateHeadingLock.isLocked() || this.workingData["best_enemy"] === undefined){
            return;
        }
        this.updateHeadingLock.lock();
        
        let currentTick = this.workingData["tick"];

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

        // Cannon ball info
        let game = this.getShip().getGame();
        let flightTimeSeconds = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"] / 1000;
        let cannonShotSpeed = game.getGameProperties()["cannon_settings"]["shot_speed"];

        // Find desired position
        let totalWindDisplacementX = flightTimeSeconds * windXA * game.getGameProperties()["cannon_ball_wind_effect_coefficient"];
        let totalWindDisplacementY = flightTimeSeconds * windYA * game.getGameProperties()["cannon_ball_wind_effect_coefficient"];

        let desiredPositionX = bestEnemyX;
        let desiredPositionY = bestEnemyY;

        // Take into consideration the wind
        desiredPositionX -= totalWindDisplacementX;
        desiredPositionY -= totalWindDisplacementY;

        // Take into account difference in position based on our realtive velocities
        let relativeVelocityX = myXV - bestEnemyXV;
        let relativeVelocityY = myYV - bestEnemyYV;

        let totalRelativeVelocityDisplacementX = relativeVelocityX * flightTimeSeconds;
        let totalRelativeVelocityDisplacementY = relativeVelocityY * flightTimeSeconds;

        // Take into consideration the relative velocity
        desiredPositionX -= totalRelativeVelocityDisplacementX;
        desiredPositionY -= totalRelativeVelocityDisplacementY;

        // Take into account cannon speed (i'm unse of this one)
        let angleFromEnemyShipToCurrentOffsetPointRAD = displacementToRadians(desiredPositionX - bestEnemyX, desiredPositionY - bestEnemyY);

        desiredPositionX += Math.cos(angleFromEnemyShipToCurrentOffsetPointRAD) * cannonShotSpeed * flightTimeSeconds;
        desiredPositionY += Math.sin(angleFromEnemyShipToCurrentOffsetPointRAD) * cannonShotSpeed * flightTimeSeconds;

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
        //console.log(distanceToDesire, desiredPositionX, desiredPositionY);
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

        let currentTick = this.workingData["tick"];
        let myShip = this.getShip();
        let game = myShip.getGame();
        let shotFlyingTimeMS = game.getGameProperties()["cannon_ball_settings"]["ms_until_hit_water"];
        let shotSpeed = game.getGameProperties()["cannon_settings"]["shot_speed"];
        let shotDistance = shotSpeed * shotFlyingTimeMS / 1000;

        let myShipX = this.perception.getDataToReactTo("my_x", currentTick);
        let myShipY = this.perception.getDataToReactTo("my_y", currentTick);
        let myShipXV = this.perception.getDataToReactTo("my_x_v", currentTick);
        let myShipYV = this.perception.getDataToReactTo("my_y_v", currentTick);
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
            if (isNaN(shipDistance)){
                debugger;
            }
            if (shipDistance <= shotDistanceWithMaxWindHelp){
                shipsWithinRange.push({"ship": ship, "distance": shipDistance});
            }
        }

        // Sort
        let sortLeastToMoveFunc = (a, b) => {
            return a["distance"] - b["distance"];
        }
        shipsWithinRange.sort(sortLeastToMoveFunc);

        // Create time chunks
        let timeMSDivides = 5;
        let timeChunks = [];
        let reactionTimeMS = this.reactionTimeMS;

        for (let i = 0; i < timeMSDivides; i++){
            timeChunks.push(reactionTimeMS + shotFlyingTimeMS * i / (timeMSDivides - 1));
        }

        let myCannons = myShip.getCannons();
        let myCannonData = this.perception.getDataToReactTo("my_cannon_data", currentTick);

        // Go through each ship (closest to furthest)
        for (let shipObj of shipsWithinRange){
            //console.log("Here")
            let ship = shipObj["ship"];
            let shipData = enemyShipData[ship.getID()];

            // Check ship position at each time point
            for (let timeStampMS of timeChunks){
                let shipXAtTime = shipData["x"] + shipData["x_v"] * timeStampMS / 1000;
                let shipYAtTime = shipData["y"] + shipData["y_v"] * timeStampMS / 1000;

                // Check the number of cannons LOADED and CAN_AIM_AT_LOCATION
                let cannonCount = 0;
                for (let cannon of myCannons){
                    let cannonIsLoaded = myCannonData[cannon.getCannonIndex()]["is_loaded"];
                    if (!cannonIsLoaded){ continue; }
                    let rangeCWL = cannon.getRangeCWL();
                    let rangeCWR = cannon.getRangeCWR();
                    let cannonXCenterOffset = cannon.getXCenterOffset();
                    let cannonYCenterOffset = cannon.getYCenterOffset();
                    let cannonTickX = Cannon.getTickX(myShipX, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);
                    let cannonTickY = Cannon.getTickY(myShipY, myShipTickOrientation, cannonXCenterOffset, cannonYCenterOffset);

                    let cannonCouldAimAtIt = Cannon.couldAimAt(rangeCWL, rangeCWR, myShipTickOrientation, cannonTickX, cannonTickY, shipXAtTime, shipYAtTime);
                    // Record that 1 more cannon can aim at it
                    if (cannonCouldAimAtIt){
                        cannonCount += 1;
                    }
                }

                // If no cannons can SHOOT and AIM AT IT then skip
                if (cannonCount === 0){
                    continue;
                }

                // Now run a simulation from the center of my ship to the location and see if it hits a ship and WHEN (It's approximate because obviously they're not shot from my ship center)
                
                let angleToPoint = displacementToRadians(shipXAtTime-myShipX, shipYAtTime-myShipY);
                let cannonBallStartX = myShipX;
                let cannonBallStartY = myShipY;
                let cannonBallXV = myShipXV + windXA * windEffectCoefficient + Math.cos(angleToPoint) * shotSpeed;
                let cannonBallYV = myShipYV + windYA * windEffectCoefficient + Math.sin(angleToPoint) * shotSpeed; 
                let cannonBallEndX = myShipX + cannonBallXV * timeStampMS / 1000;
                let cannonBallEndY = myShipY + cannonBallXV * timeStampMS / 1000;

                let shipWidth = ship.getWidth();
                let shipHeight = ship.getHeight();

                let collisionObject = game.checkCannonBallCollisionOverTime(shotFlyingTimeMS/1000, cannonBallStartX, cannonBallStartY, cannonBallEndX, cannonBallEndY, shipData["x"], shipData["y"], shipXAtTime, shipYAtTime, shipWidth, shipHeight);
                //debugger;
                //let collisionObject = game.checkCannonBallCollisionOverTime(shotFlyingTimeMS/1000, 178.13834688048587,154.73534558335564,-894.2136104700219,-917.6166117671521,0,0,0,0,128,128);
                //console.log("Waht", collisionObject)
                let hit = collisionObject["collision"];

                // if hit -> fire and return
                if (hit){
                    console.log("Good")
                    this.decisions["aiming_cannons"] = true;
                    this.decisions["aiming_cannons_position_x"] = shipXAtTime - myShipX;
                    this.decisions["aiming_cannons_position_y"] = shipYAtTime - myShipY;
                    this.decisions["fire_cannons"] = true;
                    return;
                }else{
                    console.log(cannonBallStartX, cannonBallStartY, cannonBallEndX, cannonBallEndY, shipData["x"], shipData["y"], shipXAtTime, shipYAtTime, shipWidth, shipHeight)
                    if (!objectHasKey(this.workingData, "debug_line")){
                        this.workingData["debug_line"] = new DebugLine("#ff0000", cannonBallStartX, cannonBallStartY, cannonBallEndX, cannonBallEndY, 10);
                        //game.visualEffects.push(this.workingData["debug_line"]);
                    }
                    //console.log(cannonBallStartX-myShip.getTickX(), cannonBallStartY - myShip.getTickY())
                    this.workingData["debug_line"].update(cannonBallStartX, cannonBallStartY, cannonBallEndX, cannonBallEndY);

                    if (!objectHasKey(this.workingData, "debug_circle2")){
                        this.workingData["debug_circle2"] = new DebugCircle("#730d85", 0, 0, 64);
                        //game.visualEffects.push(this.workingData["debug_circle2"]);
                    }
                    this.workingData["debug_circle2"].x = shipXAtTime;
                    this.workingData["debug_circle2"].y = shipYAtTime;
                }
            }
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
                right = pointM1;
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
