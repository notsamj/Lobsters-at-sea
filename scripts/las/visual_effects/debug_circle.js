/*
    Class Name: DebugCircle
    Description: A circle for debugging
*/
class DebugCircle extends VisualEffect {
    /*
        Method Name: constructor
        Method Parameters: 
            colorCode:
                Colour code
            x:
                X location
            y:
                Y location
            diameter:
                Diameter of the circle
        Method Description: constructor
        Method Return: constructor
    */
    constructor(colorCode, x, y, diameter){
        super(0, 9999999);
        this.colorCode = colorCode;
        this.x = x;
        this.y = y; 
        this.diameter = diameter;
    }

    /*
        Method Name: update
        Method Parameters: 
            x:
                New x location
            y:
                New y location
        Method Description: Updates the location
        Method Return: void
    */
    update(x, y){
        this.x = x;
        this.y = y;
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
        Method Description: Displays the circle
        Method Return: void
    */
    display(centerXOfScreen, centerYOfScreen, currentTick, msBetweenTicks, msSinceLastTick){
        VisualEffect.displayColoredCircle(centerXOfScreen, centerYOfScreen, this.colorCode, this.x, this.y, this.diameter, 1);
    }
}