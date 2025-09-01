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
        // TODO

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

        if (!objectHasKey(this.workingData, "debug_circle2")){
            this.workingData["debug_circle2"] = new DebugCircle("#730d85", 0, 0, 64);
            //game.visualEffects.push(this.workingData["debug_circle2"]);
        }
        this.workingData["debug_circle2"].x = desiredPositionX;
        this.workingData["debug_circle2"].y = desiredPositionY;

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
        let distanceToDesire = calculateEuclideanDistance(desiredPositionX, desiredPositionY, myX, myY);
        if (!objectHasKey(this.workingData, "debug_circle")){
            this.workingData["debug_circle"] = new DebugCircle("#ff0000", 0, 0, 64);
            //game.visualEffects.push(this.workingData["debug_circle"]);
        }
        this.workingData["debug_circle"].x = desiredPositionX;
        this.workingData["debug_circle"].y = desiredPositionY;
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

            let shipDistance = calculateEuclideanDistance(shipData["tick_x"], shipData["tick_y"], myShipX, myShipY);
            if (closestShip === undefined || closestShipDistance > shipDistance){
                closestShip = ship;
                closestShipDistance = shipDistance;
            }
        }

        this.workingData["best_enemy"] = closestShip;
    }

    determineShooting(){
        let enemyIsAliveAndWell = false;
        let currentTick = this.workingData["tick"];

        // If enemy is defined
        if (this.workingData["best_enemy"] != undefined){
            let bestEnemyShipID = this.workingData["best_enemy"].getID();
            let bestEnemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick)[bestEnemyShipID];
            // Check alive
            enemyIsAliveAndWell = bestEnemyShipData["alive"];
        }

        // Can't shoot if enemy is not there to shoot at
        if (!enemyIsAliveAndWell){
            return;
        }


        // Just shoot at best enemy for now

        let enemyShip = this.workingData["best_enemy"];
        let bestEnemyShipID = enemyShip.getID();
        let enemyShipData = this.perception.getDataToReactTo("enemy_ship_data", currentTick)[bestEnemyShipID];
        let bestEnemyX = enemyShipData["x"];
        let bestEnemyY = enemyShipData["y"];

        let myShipX = this.perception.getDataToReactTo("my_x", currentTick);
        let myShipY = this.perception.getDataToReactTo("my_y", currentTick);

        this.decisions["aiming_cannons"] = true;
        this.decisions["aiming_cannons_position_x"] = bestEnemyX - myShipX;
        this.decisions["aiming_cannons_position_y"] = bestEnemyY - myShipY;
        this.decisions["fire_cannons"] = true;
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
