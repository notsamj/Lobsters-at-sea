class VisualEffect {

    constructor(originTick, expirationTick){
        this.originTick = originTick;
        this.expirationTick = expirationTick;
    }

    display(){ throw new Error("Must be implemented"); }

    getOriginTick(){
        return this.originTick;
    }

    getExpirationTick(){
        return this.expirationTick;
    }

    isExpired(currentTick){
        return currentTick >= this.getExpirationTick(); 
    }

    static displayColoredRectangle(centerXOfScreen, centerYOfScreen, rectangleColorCode, rectangleCenterX, rectangleCenterY, rectangleWidth, rectangleHeight, opacity=1){
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

        /*console.log(myRightX, myLeftX, myBottomY, myTopY)
        if (isNaN(myRightX)){
            debugger;
        }*/
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

        // Game zoom
        scale(gameZoom * 1, gameZoom * 1);

        // Display Rectangle
        let color = Colour.fromCode(rectangleColorCode);
        color.setAlpha(opacity);
        noStrokeRectangle(color, 0 - (rectangleWidth-1) / 2, 0 - (rectangleHeight-1) / 2, rectangleWidth, rectangleHeight);

        // Undo game zoom
        scale(1/gameZoom , 1/gameZoom);
        translate(-1 * translateX, -1 * translateY);
    }

    static displayColoredCircle(centerXOfScreen, centerYOfScreen, circleColorCode, circleCenterX, circleCenterY, circleDiameter, opacity=1){
        let myCenterXOffsetFromScreenCenter = circleCenterX - centerXOfScreen;
        let myCenterYOffsetFromScreenCenter = circleCenterY - centerYOfScreen;

        // Save current screen width and height
        let screenWidth = getScreenWidth();
        let screenHeight = getScreenHeight();

        // 0,0 to screen coordinates (floats)
        let zeroXScreenCoordFL = screenWidth / 2;
        let zeroYScreenCoordFL = screenHeight / 2;

        // Adjust based on offsets and zoom
        let zoomedXOffset = myCenterXOffsetFromScreenCenter * gameZoom;
        let zoomedYOffset = myCenterYOffsetFromScreenCenter * gameZoom;

        // Determine my center coordinates (float)
        let myXScreenCoordFL = zeroXScreenCoordFL + zoomedXOffset;
        let myYScreenCoordFL = zeroYScreenCoordFL - zoomedYOffset; // when doing screen coordinates, y is inversed

        // Convert to integers
        let myXScreenCoordINT = Math.floor(myXScreenCoordFL); // Left according to screen
        let myYScreenCoordINT = Math.ceil(myYScreenCoordFL); // Down according to screen

        let myLeftX = myXScreenCoordINT - circleDiameter/2;
        let myTopY = myYScreenCoordINT - circleDiameter/2;
        let myRightX = myXScreenCoordINT + circleDiameter/2;
        let myBottomY = myYScreenCoordINT + circleDiameter/2;

        //console.log(myLeftX, myTopY, myRightX, myBottomY)
        //debugger;
        // If not on screen then return
        if (myRightX < 0){ return; }
        if (myLeftX >= screenWidth){ return; }
        if (myBottomY < 0){ return; }
        if (myTopY >= screenHeight){ return; }

        // So we know at least part of this ship is on the screen

        // Find x and y of image given its rotation
        let translateX = myXScreenCoordINT;
        let translateY = myYScreenCoordINT;

        // Prepare the display
        translate(translateX, translateY);

        // Game zoom
        scale(gameZoom * 1, gameZoom * 1);

        // Display Circle
        let color = Colour.fromCode(circleColorCode);
        color.setAlpha(opacity);
        noStrokeCircle(color, 0, 0, circleDiameter);

        // Undo game zoom
        scale(1/gameZoom , 1/gameZoom);
        translate(-1 * translateX, -1 * translateY);
    }

}