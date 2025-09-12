// If using NodeJS then do imports
if (typeof window === "undefined"){
    CannonBall = require("./ship/cannon/cannon_ball/cannon_ball.js").CannonBall;
    TickTimeline = require("./tick_timeline.js").TickTimeline;
    IDManager = require("../general/id_manager.js").IDManager;
    SeededRandomizer = require("../general/seeded_randomizer.js").SeededRandomizer;
    Wind = require("./wind/wind.js").Wind;
    NotSamLinkedList = require("../general/notsam_linked_list.js").NotSamLinkedList;
    copyObject = require("../general/helper_functions.js").copyObject;
    copyArray = require("../general/helper_functions.js").copyArray;
    rectangleCollidesWithRectangle = require("../general/math_helper.js").rectangleCollidesWithRectangle;
    safeDivide = require("../general/math_helper.js").safeDivide;
    getIntervalOverlapDetails = require("../general/math_helper.js").getIntervalOverlapDetails;
}

/*
    Class Name: LasGame
    Class Description: The base game for Lobsters At Sea
*/
class LasGame {
    /*
        Method Name: constructor
        Method Parameters: 
            gameProperties:
                Game properties JSON
        Method Description: constructor
        Method Return: constructor
    */
    constructor(gameProperties){
        this.gameProperties = gameProperties;
        this.tickTimeline = new TickTimeline();
        this.idManager = new IDManager();
        this.wind = new Wind(this);
        this.ships = new NotSamLinkedList();
        this.cannonBalls = new NotSamLinkedList();
        this.tickCount = 0;
        this.colours = copyArray(gameProperties["ship_colours"]);

        this.cannonBallPositions = new NotSamLinkedList(); // Temporary data
        this.shipPositions = new NotSamLinkedList(); // Temporary data
    }

    /*
        Method Name: resetColours
        Method Parameters: None
        Method Description: Resets the colours available
        Method Return: void
    */
    resetColours(){
        // Remove colours
        while (this.colours.length > 0){
            this.colours.pop();
        }
        // Add colours
        for (let colour of this.getGameProperties()["ship_colours"]){
            this.colours.push(colour);
        }
    }

    /*
        Method Name: pickShipColour
        Method Parameters: None
        Method Description: Picks a color for a ship
        Method Return: String
    */
    pickShipColour(){
        if (this.colours.length === 0){ throw new Error("No colors remaining.")}
        return this.colours.shift();
    }

    /*
        Method Name: getCannonBalls
        Method Parameters: None
        Method Description: Getter
        Method Return: LinkedList<CannonBall>
    */
    getCannonBalls(){
        return this.cannonBalls;
    }

    /*
        Method Name: recordCannonBallPositions
        Method Parameters: None
        Method Description: Records cannon ball positions
        Method Return: void
    */
    recordCannonBallPositions(){
        // Reset
        this.cannonBallPositions.clear();

        // Save positions
        for (let [cannonBall, cannonBallIndex] of this.cannonBalls){
            this.cannonBallPositions.push({"x_pos": cannonBall.getTickX(), "y_pos": cannonBall.getTickY()});
        }
    }

    /*
        Method Name: recordShipPositions
        Method Parameters: None
        Method Description: Records ship positions
        Method Return: void
    */
    recordShipPositions(){
        // Reset
        this.shipPositions.clear();
        for (let [ship, shipIndex] of this.ships){
            this.shipPositions.push({"x_pos": ship.getTickX(), "y_pos": ship.getTickY()});
        }
    }

    /*
        Method Name: findCannonBall
        Method Parameters: 
            cannonBallID:
                ID of a cannon ball
        Method Description: Finds a cannon ball
        Method Return: void
    */
    findCannonBall(cannonBallID){
        for (let [cannonBall, cannonBallIndex] of this.cannonBalls){
            if (cannonBall.getID() === cannonBallID){
                return cannonBall;
            }
        }
        throw new Error("Failed to find cannonball with id: " + cannonBallID);
    }

    /*
        Method Name: handleCannonBallCollisionsAndDeaths
        Method Parameters: None
        Method Description: Finds/creates cannon ball collisions and deaths
        Method Return: void
    */
    handleCannonBallCollisionsAndDeaths(){
        // Check each cannon ball
        let cannonBallsToDelete = new NotSamLinkedList();
        for (let [cannonBall, cannonBallIndex] of this.cannonBalls){
            // Note: These lists should line up 0->0, 1->1, etc.
            let cannonBallPosData = this.cannonBallPositions.get(cannonBallIndex);
            let cannonBallDead = false;

            // Check each ship
            for (let [ship, shipIndex] of this.ships){
                // Skip dead ships
                if (ship.isDead()){ continue; }
                // Skip hitting self
                if (ship.getID() === cannonBall.getShooterID()){ continue; }

                let shipPosData = this.shipPositions.get(shipIndex);
                let collisionDetails = this.checkCannonBallCollisionInTick(cannonBallPosData["x_pos"], cannonBallPosData["y_pos"], cannonBall.getTickX(), cannonBall.getTickY(), shipPosData["x_pos"], shipPosData["y_pos"], ship.getTickX(), ship.getTickY(), ship.getWidth(), ship.getHeight());
                // Hit
                if (collisionDetails["collision"]){
                    cannonBallDead = true;
                    ship.hitWithCannonBall(collisionDetails["x_pos"], collisionDetails["y_pos"], cannonBall.getID());
                    break;
                }
            }
            // Check for hitting water
            if (!cannonBallDead && cannonBall.hasHitWater(this.getTickCount())){
                cannonBallDead = true;
                // Record the watery death of the cannon ball
                this.getTickTimeline().addToTimeline({
                    "event_type": "cannon_ball_sunk",
                    "x_pos": cannonBall.getTickX(),
                    "y_pos": cannonBall.getTickY(),
                    "cannon_ball_id": cannonBall.getID()
                });
            }

            // If it's dead, get ready to delte it
            if (cannonBallDead){
                cannonBallsToDelete.push(cannonBallIndex);
            }
        }

        // Delete cannon balls, last to first
        for (let i = cannonBallsToDelete.getLength() - 1; i >= 0; i--){
            this.cannonBalls.pop(cannonBallsToDelete.get(i));
        }
    }

    /*
        Method Name: handleNewCannonShots
        Method Parameters: None
        Method Description: Proceses new cannon shots
        Method Return: void
    */
    handleNewCannonShots(){
        let newCannonShots = this.getTickTimeline().getEventsOfType("cannon_shot");
        let cannonBallSettings = this.getGameProperties()["cannon_ball_settings"];
        for (let [cannonShotObj, index] of newCannonShots){
            let objCopy = copyObject(cannonShotObj);
            objCopy["game_instance"] = this;
            objCopy["death_tick"] = this.getTickCount() + cannonBallSettings["ticks_until_hit_water"];
            this.cannonBalls.push(new CannonBall(objCopy));
        }
    }

    /*
        Method Name: checkCannonBallCollisionInTick
        Method Parameters: 
            cannonBallStartX:
                Starting X location of the cannon ball
            cannonBallStartY:
                Starting Y location of the cannon ball
            cannonBallEndX:
                Ending X location of the cannon ball
            cannonBallEndY:
                Ending Y location of the cannon ball
            shipStartX:
                Starting X location of the ship
            shipStartY:
                Starting Y location of the ship
            shipEndX:
                Ending X location of the ship
            shipEndY:
                Ending Y location of the ship
            shipWidth:
                Width of the ship
            shipHeight:
                Height of the ship
        Method Description: Checks for collisions between a ship and a cannon ball within the time of atick
        Method Return: JSON
    */
    checkCannonBallCollisionInTick(cannonBallStartX, cannonBallStartY, cannonBallEndX, cannonBallEndY, shipStartX, shipStartY, shipEndX, shipEndY, shipWidth, shipHeight){
        let timeAsProportionOfASecond = this.getGameProperties()["tick_proportion_of_a_second"];
        return this.checkCannonBallCollisionOverTime(timeAsProportionOfASecond, cannonBallStartX, cannonBallStartY, cannonBallEndX, cannonBallEndY, shipStartX, shipStartY, shipEndX, shipEndY, shipWidth, shipHeight);
    }

    /*
        Method Name: checkCannonBallCollisionOverTime
        Method Parameters: 
            timeAsProportionOfASecond:
                Time as a propotion of a second (e.g. 50ms = 0.05s -> 0.05)
            cannonBallStartX:
                Starting X location of the cannon ball
            cannonBallStartY:
                Starting Y location of the cannon ball
            cannonBallEndX:
                Ending X location of the cannon ball
            cannonBallEndY:
                Ending Y location of the cannon ball
            shipStartX:
                Starting X location of the ship
            shipStartY:
                Starting Y location of the ship
            shipEndX:
                Ending X location of the ship
            shipEndY:
                Ending Y location of the ship
            shipWidth:
                Width of the ship
            shipHeight:
                Height of the ship
        Method Description: Checks for collisions between a ship and a cannon ball within the time proivded
        Method Return: JSON
    */
    checkCannonBallCollisionOverTime(timeAsProportionOfASecond, cannonBallStartX, cannonBallStartY, cannonBallEndX, cannonBallEndY, shipStartX, shipStartY, shipEndX, shipEndY, shipWidth, shipHeight){
        let cannonBallSettings = this.getGameProperties()["cannon_ball_settings"];
        let cannonBallWidth = cannonBallSettings["cannon_ball_width"];
        let cannonBallHeight = cannonBallSettings["cannon_ball_height"];


        // Check for collision at start
        // Note: Assuming ship rotation doesn't rotate the hitbox 
        let startsWithAHit = rectangleCollidesWithRectangle(shipStartX-(shipWidth-1)/2, shipStartX+(shipWidth-1)/2, shipStartY+(shipHeight-1)/2, shipStartY-(shipHeight-1)/2, cannonBallStartX-(cannonBallWidth-1)/2, cannonBallStartX+(cannonBallWidth-1)/2, cannonBallStartY+(cannonBallHeight-1)/2, cannonBallStartY-(cannonBallHeight-1)/2);
        if (startsWithAHit){
            return {"collision": true, "x_pos": cannonBallStartX, "y_pos": cannonBallStartY};
        }

        /*
        // Check for collision at end
        let endsWithAHit = rectangleCollidesWithRectangle(shipEndX-(shipWidth-1)/2, shipEndY+(shipHeight-1)/2, shipEndX+(shipWidth-1)/2, shipEndY-(shipHeight-1)/2, cannonBallEndX-(cannonBallWidth-1)/2, cannonBallEndY+(cannonBallHeight-1)/2, cannonBallEndX+(cannonBallWidth-1)/2, cannonBallEndY-(cannonBallHeight-1)/2);
        if (endsWithAHit){
            return {"collision": true, "x_pos": collisionX, "y_pos": collisionY};
        }*/

        let cannonBallObj = {
            "start_x": cannonBallStartX,
            "start_y": cannonBallStartY,
            "end_x": cannonBallEndX,
            "end_y": cannonBallEndY,
            "v_x": (cannonBallEndX - cannonBallStartX) / timeAsProportionOfASecond, // px/second
            "v_y": (cannonBallEndY - cannonBallStartY) / timeAsProportionOfASecond, // px/second
            "width": cannonBallWidth,
            "height": cannonBallHeight
        }

        let shipObj = {
            "start_x": shipStartX,
            "start_y": shipStartY,
            "end_x": shipEndX,
            "end_y": shipEndY,
            "v_x": (shipEndX - shipStartX) / timeAsProportionOfASecond, // px/second
            "v_y": (shipEndY - shipStartY) / timeAsProportionOfASecond, // px/second
            "width": shipWidth,
            "height": shipHeight
        }

        // Now do start and go forward in time
        
        // Left-right
        {
            // Try the l/r collision
            let leftObject = cannonBallObj;
            let rightObject = shipObj;
            if (shipObj["start_x"] - (shipObj["width"]-1)/2 < cannonBallObj["start_x"] - (cannonBallObj["width"]-1)/2){
                leftObject = shipObj;
                rightObject = cannonBallObj;
            }

            let leftObjectRightEnd = leftObject["start_x"] + (leftObject["width"]-1)/2;
            let rightObjectLeftEnd = rightObject["start_x"] - (rightObject["width"]-1)/2;
            let time = safeDivide(leftObjectRightEnd - rightObjectLeftEnd, rightObject["v_x"] - leftObject["v_x"], 0.0000001, null);
            /* Expected values for time:
                null - Denominator close to zero
                < 0 - Never collide in x
                > 0 <= timeAsProportionOfASecond - Collide in x at a reasonable time
                > 0 > timeAsProportionOfASecond - Collide later on (assuming 0 acceleration)
            */
            // If time is reasonable then compute their locations and see if they collide
            if (time != null && time >= 0 && time <= timeAsProportionOfASecond){
                let leftObjectY = leftObject["start_y"] + leftObject["v_y"] * time;
                let rightObjectY = rightObject["start_y"] + rightObject["v_y"] * time;
                // Check if the y regions overlap
                let overlapDetails = getIntervalOverlapDetails(leftObjectY + (leftObject["height"]-1)/2, leftObjectY - (leftObject["height"]-1)/2, rightObjectY + (rightObject["height"]-1)/2, rightObjectY - (rightObject["height"]-1)/2);
                let overlapInHeight = overlapDetails["overlap"];
                if (overlapInHeight){
                    let collisionX = leftObject["start_x"] + leftObject["v_x"] * time + (leftObject["width"]-1)/2;
                    let collisionY = overlapDetails["overlap_center"];
                    return {"collision": true, "x_pos": collisionX, "y_pos": collisionY};
                }
            }
        }
        // Top bottom
        {
            // Try the t/b collision
            let bottomObject = cannonBallObj;
            let topObject = shipObj;
            if (shipObj["start_y"] - (shipObj["height"]-1)/2 < cannonBallObj["start_y"] - (cannonBallObj["height"]-1)/2){
                bottomObject = shipObj;
                topObject = cannonBallObj;
            }

            let bottomObjectTopEnd = bottomObject["start_y"] + (bottomObject["height"]-1)/2;
            let topObjectBottomEnd = topObject["start_y"] - (topObject["height"]-1)/2;
            let time = safeDivide(bottomObjectTopEnd - topObjectBottomEnd, topObject["v_y"] - bottomObject["v_y"], 0.0000001, null);
            /* Expected values for time:
                null - Denominator close to zero
                < 0 - Never collide in x
                > 0 <= timeAsProportionOfASecond - Collide in x at a reasonable time
                > 0 > timeAsProportionOfASecond - Collide later on (assuming 0 acceleration)
            */
            // If time is reasonable then compute their locations and see if they collide
            if (time != null && time >= 0 && time <= timeAsProportionOfASecond){
                let bottomObjectX = bottomObject["start_x"] + bottomObject["v_x"] * time;
                let topObjectX = topObject["start_x"] + topObject["v_x"] * time;
                // Check if the x regions overlap
                let overlapDetails = getIntervalOverlapDetails(bottomObjectX + (bottomObject["width"]-1)/2, bottomObjectX - (bottomObject["width"]-1)/2, topObjectX + (topObject["width"]-1)/2, topObjectX - (topObject["width"]-1)/2);
                let overlapInWidth = overlapDetails["overlap"]; 
                if (overlapInWidth){
                    let collisionY = bottomObject["start_y"] + topObject["v_y"] * time + (topObject["height"]-1)/2;
                    let collisionX = overlapDetails["overlap_center"];
                    return {"collision": true, "x_pos": collisionX, "y_pos": collisionY};
                }
            }
        }

        // No collision
        return {"collision": false};
    }

    /*
        Method Name: getShipByID
        Method Parameters: 
            shipID:
                ID of a ship
        Method Description: Finds a ship with the given ID
        Method Return: Ship or null
    */
    getShipByID(shipID){
        let ships = this.getShips();
        for (let [ship, shipIndex] of ships){
            if (ship.getID() === shipID){
                return ship;
            }
        }
        return null;
    }

    /*
        Method Name: incrementTickCount
        Method Parameters: None
        Method Description: Increments the tick count
        Method Return: void
    */
    incrementTickCount(){
        this.tickCount++;
    }

    /*
        Method Name: getTickCount
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getTickCount(){
        return this.tickCount;
    }

    /*
        Method Name: getTickTimeline
        Method Parameters: None
        Method Description: Getter
        Method Return: TickTimeline
    */
    getTickTimeline(){
        return this.tickTimeline;
    }

    /*
        Method Name: getIDManager
        Method Parameters: None
        Method Description: Getter
        Method Return: IDManager
    */
    getIDManager(){
        return this.idManager;
    }

    /*
        Method Name: getShips
        Method Parameters: None
        Method Description: Getter
        Method Return: LinkedList<Ship>
    */
    getShips(){
        return this.ships;
    }

    /*
        Method Name: addShip
        Method Parameters: 
            newShip:
                Ship to add
        Method Description: Adds a ship to the game
        Method Return: void
    */
    addShip(newShip){
        this.ships.add(newShip);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Placeholder
        Method Return: void
    */
    tick(){
        throw new Error("Expect to be overwritten.");
    }

    /*
        Method Name: getGameProperties
        Method Parameters: None
        Method Description: Getter
        Method Return: JSON
    */
    getGameProperties(){
        return this.gameProperties;
    }

    /*
        Method Name: setGameProperties
        Method Parameters: 
            gamePropertiesJSON:
                Properties for the game
        Method Description: Setter
        Method Return: void
    */
    setGameProperties(gamePropertiesJSON){
        this.gameProperties = gamePropertiesJSON;
    }

    /*
        Method Name: getWind
        Method Parameters: None
        Method Description: Getter
        Method Return: Wind
    */
    getWind(){
        return this.wind;
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Retting the game
        Method Return: void
    */
    reset(){
        // Resets world data
        this.wind.resetWithNewSeed(this.getGameProperties()["random_seed"]);
        this.idManager.reset();
        this.ships.clear();
        this.cannonBalls.clear();
        this.tickCount = 0;
        this.resetColours();
    }

    /*
        Method Name: handleCannonShotMovement
        Method Parameters: None
        Method Description: Moves the cannon balls
        Method Return: void
    */
    handleCannonShotMovement(){
        for (let [cannonBall, index] of this.cannonBalls){
            cannonBall.move();
        }
    }

    /*
        Method Name: tickShips
        Method Parameters: None
        Method Description: Ticks the ships
        Method Return: void
    */
    tickShips(){
        for (let [ship, shipIndex] of this.getShips()){
            if (ship.isDead()){ continue; }
            ship.tick();
        }
    }

    /*
        Method Name: moveShips
        Method Parameters: None
        Method Description: Mones the ships for a tick
        Method Return: void
    */
    moveShips(){
        for (let [ship, shipIndex] of this.getShips()){
            if (ship.isDead()){ continue; }
            ship.moveOneTick();
        }
    }

    /*
        Method Name: allowShipsToShoot
        Method Parameters: None
        Method Description: Allows ships to shoot
        Method Return: void
    */
    allowShipsToShoot(){
        for (let [ship, shipIndex] of this.getShips()){
            if (ship.isDead()){ continue; }
            ship.checkShoot();
        }
    }

    /*
        Method Name: updateEstablishedDecisions
        Method Parameters: None
        Method Description: Tells ships to update their orientation and sail power
        Method Return: void
    */
    updateEstablishedDecisions(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.updateEstablishedDecisions();
        }
    }
}

// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { LasGame }
}