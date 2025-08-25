// When this is opened in NodeJS, import the required files
if (typeof window === "undefined"){
    PROGRAM_DATA = require("../../data/data_json.js");
    helperFunctions = require("../general/helper_functions.js");
    getImage = helperFunctions.getImage;
}
/*
    Class Name: Radar
    Description: A radar showing positions of other ships
*/
class Radar {
     /*
        Method Name: constructor
        Method Parameters:
            ship:
                The ship to whom the radar belongs
            radarSettingsJSON:
                radar settings
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(ship, radarSettingsJSON){
        this.ship = ship;
        this.radarSettingsJSON = radarSettingsJSON;
        this.blipColour = this.radarSettingsJSON["text_colour"];
        this.size = this.radarSettingsJSON["size"]; // MUST BE EVEN
        this.blipSize = this.radarSettingsJSON["blip_size"];
        this.distanceMultiplierA = this.radarSettingsJSON["distance_multiplier_a"];
        this.b = this.radarSettingsJSON["b"];
        this.borderWidth = this.radarSettingsJSON["border_width"];
        this.radarData = new NotSamLinkedList();

        this.tickLock = new TickLock(radarSettingsJSON["tick_lock_length"]);
    }

    getShip(){
        return this.ship;
    }

    /*
        Method Name: getScreenX
        Method Parameters: None
        Method Description: Determine the x location of the radar with respect to the screen
        Method Return: Integer
    */
    getScreenX(){
        return getScreenWidth() - this.radarSettingsJSON["radar_outline_width"] - 1 - this.radarSettingsJSON["right_x_offset"];
    }

    /*
        Method Name: getScreenY
        Method Parameters: None
        Method Description: Determine the y location of the radar with respect to the screen
        Method Return: Integer
    */
    getScreenY(){
        return 1;
    }

    /*
        Method Name: drawBlip
        Method Parameters:
            screenX:
                x location to draw the blip
            screenY:
                y location to draw the blip
        Method Description: Draw a blip on the screen
        Method Return: void
    */
    drawBlip(screenX, screenY){
        let blipColour = Colour.fromCode(this.blipColour);
        strokeRectangle(blipColour, screenX, screenY, this.blipSize, this.blipSize);
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the radar on the screen
        Method Return: void
    */
    display(){
        // Don't display if all ships are too close
        if (this.radarData.getLength() === 0){
            return;
        }

        let screenX = this.getScreenX();
        let screenY = this.getScreenY();
        
        // Display outline
        displayImage(GC.getImage("radar_outline"), screenX, screenY);

        // Display the blips
        for (let [positionObject, pI] of this.radarData){
            this.drawBlip(screenX + this.borderWidth + this.blipSize * positionObject["x_i"], screenY + this.borderWidth + this.blipSize * positionObject["y_i"]);
        }

        // Display info text
        let range = this.distanceMultiplierA * Math.pow(this.b, (this.size-1)/2);
        let infoString = `Range of precision: ${Math.floor(range)}`;
        makeText(infoString, screenX+this.radarSettingsJSON["radar_outline_width"]/2, screenY+this.radarSettingsJSON["radar_outline_height"], this.radarSettingsJSON["text_box_width"], this.radarSettingsJSON["text_box_height"], Colour.fromCode(this.radarSettingsJSON["text_colour"]), this.radarSettingsJSON["text_size"], "center", "top");
    }

    /*
        Method Name: resetRadar
        Method Parameters: None
        Method Description: Resets the radar
        Method Return: void
    */
    resetRadar(){
        this.radarData.clear();
    }

    /*
        Method Name: placeOnRadar
        Method Parameters:
            objectX:
                The x location of an object
            objectY:
                The y location of an object
        Method Description: Places an object on the radar
        Method Return: void
    */
    placeOnRadar(objectX, objectY){
        let ship = this.getShip();
        let myX = ship.getTickX();
        let myY = ship.getTickY();
        let xDistance = Math.abs(myX-objectX);
        let yDistance = Math.abs(myY-objectY);
        let adjustedXDistance = xDistance / this.distanceMultiplierA;
        let adjustedYDistance = yDistance / this.distanceMultiplierA;
        let logX = Math.log(adjustedXDistance);
        let logY = Math.log(adjustedYDistance);
        let xOffsetAmount;
        let yOffsetAmount;
        let logB = Math.log(this.b);

        // If distance is low it's a special case
        if (xDistance == 0 || logX < 0){
            xOffsetAmount = 0;
        }else{
            xOffsetAmount = Math.min(Math.floor(logX / logB), (this.size - 1)/2);
        }

        // If distance is low it's a special case
        if (yDistance == 0 || logY < 0){
            yOffsetAmount = 0;
        }else{
            yOffsetAmount = Math.min(Math.floor(logY / logB), (this.size - 1)/2);
        }

        let x;
        let y;

        // Determine x
        if (objectX < myX){
            x = Math.floor(this.size/2)+1 - xOffsetAmount;
        }else{ // if (objectX >= myX
            x = Math.floor(this.size/2)+1 + xOffsetAmount;
        }

        // Determine y
        if (objectY < myY){
            y = Math.floor(this.size/2)+1 + yOffsetAmount;
        }else{ // if (objectY >= myY
            y = Math.floor(this.size/2)+1 - yOffsetAmount;
        }

        // Convert to index
        let xI = x - 1;
        let yI = y - 1;

        let positionFound = false;
        // Check if position data exists at xI, yI
        for (let [positionObject, pI] of this.radarData){
            if (positionObject["x_i"] == xI && positionObject["y_i"] == yI){
                positionFound = true;
                break;
            }
        }
        // If not position present already, add
        if (!positionFound){
            this.radarData.push({"x_i": xI, "y_i": yI});
        }
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles actions within a tick for the radar
        Method Return: void
    */
    tick(){
        this.tickLock.tick();

        // Don't update if ticklock not ready
        if (!this.tickLock.isReady()){ return; }

        // Reset the lock because going to update
        this.tickLock.lock();
        this.update();
    }

    update(){
        let myShip = this.getShip();
        let allShips = myShip.getGame().getShips();

        // Clear old radar data
        this.resetRadar();

        let myX = myShip.getTickX();
        let myY = myShip.getTickY();

        let shipFoundFarEnough = false;

        let radarDataToAdd = [];

        // Loop through ships and put on radar
        for (let [ship, shipIndex] of allShips){
            // Skip my ship
            if (ship.getID() === myShip.getID()){ continue; }
            // Skip dead ships
            if (ship.isDead()){ continue; }
            let sX = ship.getTickX();
            let sY = ship.getTickY();
            let distance = calculateEuclideanDistance(myX, myY, sX, sY);
            // Check if we can find a ship far enough to justify the radar
            if (distance >= this.radarSettingsJSON["min_distance_to_display"]){
                shipFoundFarEnough = true;
            }

            // Add to the list of data to add
            radarDataToAdd.push({"x": sX, "y": sY});
        }
        // If worth displaying
        if (shipFoundFarEnough){
            for (let dataPoint of radarDataToAdd){
                this.placeOnRadar(dataPoint["x"], dataPoint["y"]);
            }
        }
    
    }
}

// If using Node JS -> Export the class
if (typeof window === "undefined"){
    module.exports = Radar;
}