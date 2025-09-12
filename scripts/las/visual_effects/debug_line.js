/*
    Class Name: DebugCircle
    Description: A line for debugging
*/
class DebugLine extends VisualEffect {
    /*
        Method Name: constructor
        Method Parameters: 
            colorCode:
                Colour of the line
            startX:
                Starting x of the line
            startY:
                Starting y of the line
            endX:
                Ending x of the line
            endY:
                Ending y of the line
            thickness:
                Thickness of the line
        Method Description: constructor
        Method Return: constructor
    */
    constructor(colorCode, startX, startY, endX, endY, thickness){
        super(0, 9999999);
        this.colorCode = colorCode;
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY; 
        this.thickness = thickness;

        // Declare
        this.centerX = undefined;
        this.centerY = undefined;
        this.length = undefined;
        this.angleRAD = undefined;

        this.calculateRectangleSimulation();
    }

    /*
        Method Name: update
        Method Parameters: 
            startX:
                Starting x of the line
            startY:
                Starting y of the line
            endX:
                Ending x of the line
            endY:
                Ending y of the line
        Method Description: Updates the line position
        Method Return: void
    */
    update(startX, startY, endX, endY){
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;

        this.calculateRectangleSimulation();
    }

    /*
        Method Name: calculateRectangleSimulation
        Method Parameters: None
        Method Description: Reculate the details for display as a rectangle
        Method Return: void
    */
    calculateRectangleSimulation(){
        this.centerX = (this.startX + this.endX)/2;
        this.centerY = (this.startY + this.endY)/2;
        this.length = Math.ceil(Math.sqrt(Math.pow(this.endX-this.startX, 2) + Math.pow(this.endY-this.startY, 2)));
        this.angleRAD = rotateCWRAD(displacementToRadians(this.endX-this.startX, this.endY-this.startY), toRadians(90));
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
        // displayColoredRectangle(centerXOfScreen, centerYOfScreen, rectangleColorCode, rectangleCenterX, rectangleCenterY, rectangleWidth, rectangleHeight, opacity=1
        
        let rectangleColorCode = this.colorCode;
        let rectangleCenterX = this.centerX;
        let rectangleCenterY = this.centerY;
        let rectangleWidth = this.thickness;
        let rectangleHeight = this.length;
        let opacity = 1;

        let myCenterXOffsetFromScreenCenter = rectangleCenterX - centerXOfScreen;
        let myCenterYOffsetFromScreenCenter = rectangleCenterY - centerYOfScreen;

        // Get zoomed rectangle size
        let zoomedRectangleWidth = rectangleWidth * gameZoom;
        let zoomedRectangleHeight = rectangleHeight * gameZoom;

        // Save current screen width and height
        let screenWidth = getScreenWidth();
        let screenHeight = getScreenHeight();


        // 0,0 to screen coordinates (floats)
        let zeroXScreenCoordFL = (screenWidth - zoomedRectangleWidth) / 2;
        let zeroYScreenCoordFL = (screenHeight - zoomedRectangleHeight) / 2;

        // Adjust based on offsets and zoom
        let zoomedXOffset = myCenterXOffsetFromScreenCenter * gameZoom;
        let zoomedYOffset = myCenterYOffsetFromScreenCenter * gameZoom;

        // Determine my top left coordinates (float)
        let myXScreenCoordFL = zeroXScreenCoordFL + zoomedXOffset;
        let myYScreenCoordFL = zeroYScreenCoordFL - zoomedYOffset; // when doing screen coordinates, y is inversed

        // Convert to integers
        let myXScreenCoordINT = Math.floor(myXScreenCoordFL); // Left according to screen
        let myYScreenCoordINT = Math.ceil(myYScreenCoordFL); // Down according to screen

        let myLeftX = myXScreenCoordINT;
        let myTopY = myYScreenCoordINT;
        let myRightX = myXScreenCoordINT + zoomedRectangleWidth-1;
        let myBottomY = myYScreenCoordINT + zoomedRectangleHeight-1;

        // If not on screen then return
        if (myRightX < 0){ return; }
        if (myLeftX >= screenWidth){ return; }
        if (myBottomY < 0){ return; }
        if (myTopY >= screenHeight){ return; }

        // So we know at least part of this ship is on the screen

        // Find x and y of image given its rotation
        let translateX = myXScreenCoordINT + (zoomedRectangleWidth-1)/2;
        let translateY = myYScreenCoordINT + (zoomedRectangleHeight-1)/2;

        // Prepare the display
        translate(translateX, translateY);
        rotate(-1 * this.angleRAD);
        // Game zoom
        scale(gameZoom * 1, gameZoom * 1);

        // Display Rectangle
        let color = Colour.fromCode(rectangleColorCode);
        color.setAlpha(opacity);
        noStrokeRectangle(color, 0 - (rectangleWidth-1) / 2, 0 - (rectangleHeight-1) / 2, rectangleWidth, rectangleHeight);

        // Undo game zoom
        scale(1/gameZoom , 1/gameZoom);

        rotate(this.angleRAD);

        translate(-1 * translateX, -1 * translateY);
    }
}