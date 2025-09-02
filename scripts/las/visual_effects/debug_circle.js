class DebugCircle extends VisualEffect {
    constructor(colorCode, x, y, diameter){
        super(0, 9999999);
        this.colorCode = colorCode;
        this.x = x;
        this.y = y; 
        this.diameter = diameter;
    }

    update(x, y){
        this.x = x;
        this.y = y;
    }

    display(centerXOfScreen, centerYOfScreen, currentTick, msBetweenTicks, msSinceLastTick){
        VisualEffect.displayColoredCircle(centerXOfScreen, centerYOfScreen, this.colorCode, this.x, this.y, this.diameter, 1);
    }
}