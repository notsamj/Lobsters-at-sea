class CannonBallHit extends VisualEffect {
    constructor(currentTick, randomGenerator, event, visualEffectSettings){
        super(currentTick, currentTick + visualEffectSettings["life_length_ticks"]);
        this.colorCode = visualEffectSettings["color_code"];
        this.rectangles = new NotSamLinkedList();
        this.generateRectangles(randomGenerator, event, visualEffectSettings);
    }

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
            /*if (isNaN(rectObj["x_start"]) || isNaN(rectObj["x_v"])){
                debugger;
            }*/
            this.rectangles.push(rectObj);
        }
    }

    display(centerXOfScreen, centerYOfScreen, currentTick, msBetweenTicks, msSinceLastTick){
        //console.log(centerXOfScreen, centerYOfScreen, currentTick, msBetweenTicks, msSinceLastTick)
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