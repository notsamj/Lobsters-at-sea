/*
    Class Name: CannonSmoke
    Description: A cannon smoke effect
*/
class CannonSmoke extends VisualEffect {
    /*
        Method Name: constructor
        Method Parameters: 
            currentTick:
                Current tick number
            randomGenerator:
                Random number generator
            event:
                Event information JSON
            visualEffectSettings:
                Settings JSON for this type of visual effect
        Method Description: constructor
        Method Return: constructor
    */
    constructor(currentTick, randomGenerator, event, visualEffectSettings){
        super(currentTick, currentTick + visualEffectSettings["life_length_ticks"]);
        this.colorCode = visualEffectSettings["color_code"];
        this.circles = new NotSamLinkedList();
        this.generateCircles(randomGenerator, event, visualEffectSettings);
    }

    /*
        Method Name: generateCircles
        Method Parameters: 
            randomGenerator:
                Random number generator
            event:
                Event JSON 
            visualEffectSettings:
                settings JSON for this type of visual effect
        Method Description: Generates the circles of the effect
        Method Return: void
    */
    generateCircles(randomGenerator, event, visualEffectSettings){
        let numCircles = randomGenerator.getIntInRangeInclusive(visualEffectSettings["min_smoke_bubbles"], visualEffectSettings["max_smoke_bubbles"]);
        let xVWind = event["launch_wind_magnitude"] * visualEffectSettings["wind_coefficient"] * Math.cos(event["launch_wind_direction_rad"]);
        let yVWind = event["launch_wind_magnitude"] * visualEffectSettings["wind_coefficient"] * Math.sin(event["launch_wind_direction_rad"]);
        
        for (let i = 0; i < numCircles; i++){
            let xVOffset = randomGenerator.getFloatInRange(visualEffectSettings["offset_min_velocity"], visualEffectSettings["offset_max_velocity"]) * randomGenerator.pick([-1,1]);
            let yVOffset = randomGenerator.getFloatInRange(visualEffectSettings["offset_min_velocity"], visualEffectSettings["offset_max_velocity"]) * randomGenerator.pick([-1,1]);
            let circleObject = {
                "x_start": event["x_origin"] + randomGenerator.getFloatInRange(-1 * visualEffectSettings["start_offset"], visualEffectSettings["start_offset"]),
                "y_start": event["y_origin"] + randomGenerator.getFloatInRange(-1 * visualEffectSettings["start_offset"], visualEffectSettings["start_offset"]),
                "x_v": xVWind + xVOffset,
                "y_v": yVWind + yVOffset,
                "diameter": randomGenerator.getIntInRangeInclusive(visualEffectSettings["min_size"], visualEffectSettings["max_size"])
            }
            this.circles.push(circleObject);
        }
    }

    /*
        Method Name: display
        Method Parameters: 
            centerXOfScreen:
                Game X of the center of the screen
            centerYOfScreen:
                Game y of the center of the screen
            currentTick:
                Current tick number
            msBetweenTicks:
                Miliseconds between ticks
            msSinceLastTick:
                Miliseconds between 
        Method Description: Displays the effect
        Method Return: void
    */
    display(centerXOfScreen, centerYOfScreen, currentTick, msBetweenTicks, msSinceLastTick){
        let msSinceCreation = (currentTick - this.getOriginTick()) * msBetweenTicks + msSinceLastTick;
        let opacity = Math.max(0, Math.min(1, 1 - (msSinceCreation / ((this.getExpirationTick() - this.getOriginTick()) * msBetweenTicks))));
        for (let [circle, circleIndex] of this.circles){
            let circleX = circle["x_start"] + circle["x_v"] * msSinceCreation / 1000;
            let circleY = circle["y_start"] + circle["y_v"] * msSinceCreation / 1000;
            let circleDiameter = circle["diameter"];
            VisualEffect.displayColoredCircle(centerXOfScreen, centerYOfScreen, this.colorCode, circleX, circleY, circleDiameter, opacity);
        }
    }
}