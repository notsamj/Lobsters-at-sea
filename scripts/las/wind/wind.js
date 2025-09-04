// If NodeJS -> Import
if (typeof window === "undefined"){
    toRadians = require("../../general/math_helper.js").toRadians;
    fixRadians = require("../../general/math_helper.js").fixRadians;
    calculateAngleDiffCCWRAD = require("../../general/math_helper.js").calculateAngleDiffCCWRAD;
    calculateAngleDiffCWRAD = require("../../general/math_helper.js").calculateAngleDiffCWRAD;
    TickLock = require("../../general/tick_lock.js").TickLock;
}

class Wind {
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

    print(){
        console.log(`Mag ${this.windMagntiude}, Dir ${this.windDirectionRAD}`);
    }

    reset(){
        this.resetWithNewSeed(this.game.getGameProperties()["random_seed"]);
    }

    resetWithNewSeed(newSeed){
        this.randomizer.setSeed(newSeed);
        //console.log("Reset wind")
        this.initialize(); 
    }

    getRandom(){
        return this.randomizer;
    }

    getGame(){
        return this.game;
    }

    initialize(){
        //console.log("init wind")
        let windSettings = this.game.getGameProperties()["wind_settings"];
        let initialWindMagnitude = this.getRandom().getFloatInRange(windSettings["wind_min_magnitude"], windSettings["wind_max_magnitude"]);
        let initialWindDirection = this.getRandom().getFloatInRange(0, 2*Math.PI);

        this.windMagntiude = initialWindMagnitude;
        this.windDirectionRAD = initialWindDirection;

        this.updateMagnitudeTarget();
        this.updateDirectionTarget();
    }

    updateMagnitudeTarget(){
        let windSettings = this.game.getGameProperties()["wind_settings"];
        let magnitudeTarget = this.getRandom().getFloatInRange(windSettings["wind_min_magnitude"], windSettings["wind_max_magnitude"]);
        let ticksToHit = this.getRandom().getIntInRangeInclusive(windSettings["wind_min_magnitude_movement_ticks"], windSettings["wind_max_magnitude_movement_ticks"]);
        let difference = magnitudeTarget - this.windMagntiude;

        this.windMagnitudeChangePerTick = difference / ticksToHit;

        // Replace num ticks and lock the lock
        this.windMagnitudeChangeLock.replace(ticksToHit, false);
    }

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
        //console.log("New, oold, chang", this.windDirectionRAD, b4, this.windDirectionChangePerTickRAD);
        // Tick locks
        this.windMagnitudeChangeLock.tick();
        this.windDirectionChangeLock.tick();
    }

    getXA(){
        return Math.cos(this.windDirectionRAD) * this.windMagntiude;
    }

    getYA(){
        return Math.sin(this.windDirectionRAD) * this.windMagntiude;
    }

    getWindDirectionRAD(){
        return this.windDirectionRAD;
    }

    getWindMagnitude(){
        return this.windMagntiude;
    }

    // Local only
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
