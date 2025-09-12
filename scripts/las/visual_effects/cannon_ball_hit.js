/*
    Class Name: CannonBallHit
    Description: A cannon ball hit effect
*/
class CannonBallHit extends VisualEffect {
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
        this.rectangles = new NotSamLinkedList();
        this.generateRectangles(randomGenerator, event, visualEffectSettings);
    }

    /*
        Method Name: generateRectangles
        Method Parameters: 
            randomGenerator:
                Random number generator
            event:
                Event JSON 
            visualEffectSettings:
                settings JSON for this type of visual effect
        Method Description: Generates the rectangles of the effect
        Method Return: void
    */
    generateRectangles(randomGenerator, event, visualEffectSettings){
        let numRectangles = randomGenerator.getIntInRangeInclusive(visualEffectSettings["min_debris"], visualEffectSettings["max_debris"]);
        for (let i = 0; i < numRectangles; i++){
            let rectObj = {
                "x_start": event["x_pos"] + randomGenerator.getFloatInRange(-1 * visualEffectSettings["start_offset"], visualEffectSettings["start_offset"]),
                "y_start": event["y_pos"] + randomGenerator.getFloatInRange(-1 * visualEffectSettings["start_offset"], visualEffectSettings["start_offset"]),
                "x_v": randomGenerator.getFloatInRange(visualEffectSettings["min_velocity"], visualEffectSettings["max_velocity"]) * randomGenerator.pick([-1, 1]),
                "y_v": randomGenerator.getFloatInRange(visualEffectSettings["min_velocity"], visualEffectSettings["max_velocity"]) * randomGenerator.pick([-1, 1]),
                "width": randomGenerator.getIntInRangeInclusive(visualEffectSettings["min_size"], visualEffectSettings["max_size"]),
                "height": randomGenerator.getIntInRangeInclusive(visualEffectSettings["min_size"], visualEffectSettings["max_size"]),  
            }
            this.rectangles.push(rectObj);
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
        for (let [rect, rectIndex] of this.rectangles){
            let rectX = rect["x_start"] + rect["x_v"] * msSinceCreation / 1000;
            let rectY = rect["y_start"] + rect["y_v"] * msSinceCreation / 1000;
            let rectWidth = rect["width"];
            let rectHeight = rect["height"];
            VisualEffect.displayColoredRectangle(centerXOfScreen, centerYOfScreen, this.colorCode, rectX, rectY, rectWidth, rectHeight, opacity);
        }
    }
}