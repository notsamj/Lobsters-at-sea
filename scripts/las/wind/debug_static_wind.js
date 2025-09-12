// If NodeJS -> Import
if (typeof window === "undefined"){
    toRadians = require("../../general/math_helper.js").toRadians;
    fixRadians = require("../../general/math_helper.js").fixRadians;
    calculateAngleDiffCCWRAD = require("../../general/math_helper.js").calculateAngleDiffCCWRAD;
    calculateAngleDiffCWRAD = require("../../general/math_helper.js").calculateAngleDiffCWRAD;
    TickLock = require("../../general/tick_lock.js").TickLock;
}

/*
    Class Name: DebugStaticWind
    Class Description: A tool to replace wind for testing
*/
class DebugStaticWind {
    /*
        Method Name: constructor
        Method Parameters: 
            game:
                LASGame instance
        Method Description: constructor
        Method Return: constructor
    */
    constructor(game){
        this.game = game;
        this.windMagntiude = 30.0;
        this.windDirectionRAD = toRadians(316);

        this.windMagnitudeChangePerTick = undefined;
        this.windDirectionChangePerTickRAD = undefined;

        this.windMagnitudeChangeLock = new TickLock(1);
        this.windDirectionChangeLock = new TickLock(1);
    }

    /*
        Method Name: print
        Method Parameters: None
        Method Description: Prints info to console
        Method Return: void
    */
    print(){
        console.log(`Mag ${this.windMagntiude}, Dir ${this.windDirectionRAD}`);
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Rests the wind object (disabled)
        Method Return: void
    */
    reset(){}

    /*
        Method Name: getRandom
        Method Parameters: None
        Method Description: Getter
        Method Return: SeededRandomizer
    */
    getRandom(){
        return this.randomizer;
    }

    /*
        Method Name: getGame
        Method Parameters: None
        Method Description: Getter
        Method Return: LasGame
    */
    getGame(){
        return this.game;
    }

    /*
        Method Name: initialize
        Method Parameters: None
        Method Description: Initializes the wind object (disabled)
        Method Return: void
    */
    initialize(){}

    /*
        Method Name: updateMagnitudeTarget
        Method Parameters: None
        Method Description: Updates the wind magnitude target (disabled)
        Method Return: void
    */
    updateMagnitudeTarget(){}

    /*
        Method Name: updateDirectionTarget
        Method Parameters: None
        Method Description: Updates the direction target (disabled)
        Method Return: void
    */
    updateDirectionTarget(){
        let windSettings = this.game.getGameProperties()["wind_settings"];
        let directionTarget = this.getRandom().getFloatInRange(0, 2*Math.PI);
        let ticksToHit = this.getRandom().getIntInRangeInclusive(windSettings["wind_min_direction_movement_ticks"], windSettings["wind_max_direction_movement_ticks"]);
        let directionOfTravel = this.getRandom().pick([-1, 1]);
        

        if (directionOfTravel > 0){
            this.windDirectionChangePerTickRAD = calculateAngleDiffCCWRAD(this.windDirectionRAD, directionTarget) / ticksToHit * directionOfTravel;
        }
        // Else, clockwise
        else{
            this.windDirectionChangePerTickRAD = calculateAngleDiffCWRAD(this.windDirectionRAD, directionTarget) / ticksToHit * directionOfTravel;
        }
        // Replace num ticks and lock the lock
        this.windDirectionChangeLock.replace(ticksToHit, false);
    }

    /*
        Method Name: tickUpdate
        Method Parameters: None
        Method Description: Updates in a tick (disabled)
        Method Return: void
    */
    tickUpdate(){}

    /*
        Method Name: getXA
        Method Parameters: None
        Method Description: Calculates the X acceleration of the wind
        Method Return: number
    */
    getXA(){
        return Math.cos(this.windDirectionRAD) * this.windMagntiude;
    }

    /*
        Method Name: getYA
        Method Parameters: None
        Method Description: Calculates the Y acceleration of the wind
        Method Return: number
    */
    getYA(){
        return Math.sin(this.windDirectionRAD) * this.windMagntiude;
    }

    /*
        Method Name: getWindDirectionRAD
        Method Parameters: None
        Method Description: Getter
        Method Return: radians
    */
    getWindDirectionRAD(){
        return this.windDirectionRAD;
    }

    /*
        Method Name: getWindMagnitude
        Method Parameters: None
        Method Description: Gets the wind magnitude
        Method Return: number
    */
    getWindMagnitude(){
        return this.windMagntiude;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the wind sock
        Method Return: void
        Method Note: Local only
    */
    display(){
        let image = GC.getImage("wind_sock");
        let imageWidth = image.width;
        let imageHeight = image.height;

        let displayImageOrientation = this.getWindDirectionRAD();

        let rotateX = (getScreenWidth() - imageWidth) + (imageWidth-1)/2;
        let rotateY = 0 + (imageHeight-1)/2;

        // Prepare the display
        translate(rotateX, rotateY);
        rotate(-1 * displayImageOrientation);

        // Display Wind sock
        displayImage(image, 0 - (imageWidth-1) / 2, 0 - (imageHeight-1) / 2); 

        // Reset the rotation and translation
        rotate(displayImageOrientation);
        translate(-1 * rotateX, -1 * rotateY);
    }
}


// If using Node JS Export the class
if (typeof window === "undefined"){
    module.exports = { DebugStaticWind } ;
}
