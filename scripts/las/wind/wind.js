// If NodeJS -> Import
if (typeof window === "undefined"){
    toRadians = require("../../general/math_helper.js").toRadians;
    fixRadians = require("../../general/math_helper.js").fixRadians;
    calculateAngleDiffCCWRAD = require("../../general/math_helper.js").calculateAngleDiffCCWRAD;
    calculateAngleDiffCWRAD = require("../../general/math_helper.js").calculateAngleDiffCWRAD;
    TickLock = require("../../general/tick_lock.js").TickLock;
}

/*
    Class Name: Wind
    Class Description: Represents the wind in the world
*/
class Wind {
    /*
        Method Name: constructor
        Method Parameters: 
            game:
                An LASGame instance
        Method Description: constructor
        Method Return: constructor
    */
    constructor(game){
        this.game = game;
        this.randomizer = new SeededRandomizer(this.game.getGameProperties()["random_seed"]);
        this.windMagntiude = undefined;
        this.windDirectionRAD = undefined;

        this.windMagnitudeChangePerTick = undefined;
        this.windDirectionChangePerTickRAD = undefined;

        this.windMagnitudeChangeLock = new TickLock(1);
        this.windDirectionChangeLock = new TickLock(1);
        this.initialize(); 
    }

    /*
        Method Name: print
        Method Parameters: None
        Method Description: Prints wind details to console
        Method Return: void
    */
    print(){
        console.log(`Mag ${this.windMagntiude}, Dir ${this.windDirectionRAD}`);
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the wind instance
        Method Return: void
    */
    reset(){
        this.resetWithNewSeed(this.game.getGameProperties()["random_seed"]);
    }

    /*
        Method Name: resetWithNewSeed
        Method Parameters: 
            newSeed:
                The new seed for the wind
        Method Description: Resets the wind with a new seed
        Method Return: void
    */
    resetWithNewSeed(newSeed){
        this.randomizer.setSeed(newSeed);
        this.initialize(); 
    }

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
        Method Return: LASGame instance
    */
    getGame(){
        return this.game;
    }

    /*
        Method Name: initialize
        Method Parameters: None
        Method Description: Initializes the wind
        Method Return: void
    */
    initialize(){
        let windSettings = this.game.getGameProperties()["wind_settings"];
        let initialWindMagnitude = this.getRandom().getFloatInRange(windSettings["wind_min_magnitude"], windSettings["wind_max_magnitude"]);
        let initialWindDirection = this.getRandom().getFloatInRange(0, 2*Math.PI);

        this.windMagntiude = initialWindMagnitude;
        this.windDirectionRAD = initialWindDirection;

        this.updateMagnitudeTarget();
        this.updateDirectionTarget();
    }

    /*
        Method Name: updateMagnitudeTarget
        Method Parameters: None
        Method Description: Updates the magnitude target
        Method Return: void
    */
    updateMagnitudeTarget(){
        let windSettings = this.game.getGameProperties()["wind_settings"];
        let magnitudeTarget = this.getRandom().getFloatInRange(windSettings["wind_min_magnitude"], windSettings["wind_max_magnitude"]);
        let ticksToHit = this.getRandom().getIntInRangeInclusive(windSettings["wind_min_magnitude_movement_ticks"], windSettings["wind_max_magnitude_movement_ticks"]);
        let difference = magnitudeTarget - this.windMagntiude;

        this.windMagnitudeChangePerTick = difference / ticksToHit;

        // Replace num ticks and lock the lock
        this.windMagnitudeChangeLock.replace(ticksToHit, false);
    }

    /*
        Method Name: updateDirectionTarget
        Method Parameters: None
        Method Description: Updates the direction target
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
        Method Description: Updates the targets and processes towards them
        Method Return: void
    */
    tickUpdate(){
        let windSettings = this.game.getGameProperties()["wind_settings"];
        
        // Update targets if needed
        if (this.windMagnitudeChangeLock.isUnlocked()){
            this.updateMagnitudeTarget();
        }

        if (this.windDirectionChangeLock.isUnlocked()){
            this.updateDirectionTarget();
        }

        // Update
        let newWindMagntiude = this.windMagntiude + this.windMagnitudeChangePerTick;

        this.windMagntiude = Math.min(windSettings["wind_max_magnitude"], Math.max(newWindMagntiude, windSettings["wind_min_magnitude"]));
       
        let b4 = this.windDirectionRAD;
        this.windDirectionRAD = fixRadians(this.windDirectionRAD + this.windDirectionChangePerTickRAD);
        
        // Tick locks
        this.windMagnitudeChangeLock.tick();
        this.windDirectionChangeLock.tick();
    }

    /*
        Method Name: getXA
        Method Parameters: None
        Method Description: Calculates the wind X acceleration
        Method Return: float
    */
    getXA(){
        return Math.cos(this.windDirectionRAD) * this.windMagntiude;
    }

    /*
        Method Name: getYA
        Method Parameters: None
        Method Description: Calculates the wind Y acceleration
        Method Return: float
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
        Method Description: Getter
        Method Return: number
    */
    getWindMagnitude(){
        return this.windMagntiude;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displayst he wind sock
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
    module.exports = { Wind } ;
}
