// If using NodeJS then do imports
if (typeof window === "undefined"){
    GameRecorder = require("./game_recorder.js").GameRecorder;
    IDManager = require("../general/id_manager.js").IDManager;
    SeededRandomizer = require("../general/seeded_randomizer.js").SeededRandomizer;
    Wind = require("./wind/wind.js").Wind;
    NotSamLinkedList = require("../general/notsam_linked_list.js").NotSamLinkedList;
}

class LasGame {
    constructor(gameProperties){
        this.gameProperties = gameProperties;
        this.gameRecorder = new GameRecorder(gameProperties);
        this.idManager = new IDManager();
        this.wind = new Wind(this);
        this.ships = new NotSamLinkedList();
        this.cannonBalls = new NotSamLinkedList();
        this.tickCount = 0;

        this.cannonBallPositions = new NotSamLinkedList(); // Temporary data
        this.shipPositions = new NotSamLinkedList(); // Temporary data
    }

    recordCannonBallPositions(){
        // Reset
        this.cannonBallPositions.clear();

        // Save positions
        for (let [cannonBall, cannonBallIndex] of this.cannonBalls){
            this.cannonBallPositions.push({"x_pos": cannonBall.getTickX(), "y_pos": cannonBall.getTickY()});
        }
    }

    recordShipPositions(){
        // Reset
        this.shipPositions.clear();
        for (let [ship, shipIndex] of this.ships){
            this.shipPositions.push({"x_pos": ship.getTickX(), "y_pos": ship.getTickY()});
        }
    }

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
                let collisionDetails = this.checkCannonBallCollision(cannonBallPosData["x_pos"], cannonBallPosData["y_pos"], cannonBall.getTickX(), cannonBall.getTickY(), shipPosData["x_pos"], shipPosData["y_pos"], ship.getTickX(), ship.getTickY(), ship.getWidth(), ship.getHeight());
                // Hit
                if (collisionDetails["collision"]){
                    cannonBallDead = true;
                    ship.hitWithCannonBall(collisionDetails["x_pos"], collisionDetails["y_pos"]);
                    break;
                }
            }
            // Check for hitting water
            if (!cannonBallDead && cannonBall.hasHitWater(this.getTickCount())){
                cannonBallDead = true;

                // Record the watery death of the cannon ball
                game.getGameRecorder().addToTimeline(game.getTickCount(), {
                    "event_type": "cannon_ball_sunk",
                    "x_pos": cannonBall.getTickX(),
                    "y_pos": cannonBall.getTickY()
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

    handleNewCannonShots(){
        let newCannonShots = this.getGameRecorder().getEventsOfTickAndType(this.getTickCount(), "cannon_shot");
        let idManager = this.getIDManager();
        let cannonBallSettings = this.getGameProperties()["cannon_ball_settings"];
        for (let [cannonShotObj, index] of newCannonShots){
            // Add an id
            cannonShotObj["id"] = idManager.generateNewID();
            cannonShotObj["game_instance"] = this;
            cannonShotObj["death_tick"] = this.getTickCount() + cannonBallSettings["ticks_until_hit_water"];
            this.cannonBalls.push(new CannonBall(cannonShotObj));
        }
    }

    checkCannonBallCollision(cannonBallStartX, cannonBallStartY, cannonBallEndX, cannonBallEndY, shipStartX, shipStartY, shipEndX, shipEndY, shipWidth, shipHeight){
        let timeAsProportionOfASecond = this.getGameProperties()["tick_proportion_of_a_second"];
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
                let overlapDetails = getIntervalOverlapDetails(leftObjectY + (leftObject["height"]-1)/2, leftObjectY + (leftObject["height"]-1)/2, rightObjectY + (rightObject["height"]-1)/2, rightObjectY + (rightObject["height"]-1)/2);
                let overlapInHeight = overlapDetails["overlap"];
                if (overlapInHeight){
                    let collisionX = leftObject["start_x"] + leftObject["x_v"] * time + (leftObject["width"]-1)/2;
                    let collisionY = getOverlapDetails["overlap_center"];
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
                let overlapDetails = getIntervalOverlapDetails(bottomObjectX + (bottomObject["width"]-1)/2, bottomObjectX + (bottomObject["width"]-1)/2, topObjectX + (topObject["width"]-1)/2, topObjectX + (topObject["width"]-1)/2);
                let overlapInWidth = overlapDetails["overlap"]; 
                if (overlapInWidth){
                    let collisionY = bottomObjectX["start_y"] + topObjectX["y_v"] * time + (topObjectX["height"]-1)/2;
                    let collisionX = getOverlapDetails["overlap_center"];
                    return {"collision": true, "x_pos": collisionX, "y_pos": collisionY};
                }
            }
        }

        // No collision
        return {"collision": false};
    }

    getShipByID(shipID){
        let ships = this.getShips();
        for (let [ship, shipIndex] of ships){
            if (ship.getID() === shipID){
                return ship;
            }
        }
        return null;
    }

    incrementTickCount(){
        this.tickCount++;
    }

    getTickCount(){
        return this.tickCount;
    }

    getGameRecorder(){
        return this.gameRecorder;
    }

    getIDManager(){
        return this.idManager;
    }

    getShips(){
        return this.ships;
    }

    addShip(newShip){
        this.ships.add(newShip);
    }

    tick(){
        throw new Exception("Expect to be overwritten.");
    }

    getGameProperties(){
        return this.gameProperties;
    }

    setGameProperties(gamePropertiesJSON){
        this.gameProperties = gamePropertiesJSON;
    }

    getWind(){
        return this.wind;
    }

    reset(){
        console.debug("Reset in las_game.js")
        // Resets world data
        this.wind.reset();
        this.ships.clear();
        this.tickCount = 0;
    }
}

// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { LasGame }
}