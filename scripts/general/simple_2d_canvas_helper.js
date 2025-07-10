const DEFAULT_FONT_FAMILY = "Arial"; // Arial

// Note: I originally used p5 for this project. I realized after a few months it was unnecessary so I created this to replace it.
/*
    Class Name: Colour
    Description: A representation of a colour
*/
class Colour {
    /*
        Method Name: constructor
        Method Parameters:
            r:
                The red value, integer in range [0,255]
            g:
                The green value, integer in range [0,255]
            b:
                The blue value, integer in range [0,255]
            a:
                The alpha value, float in range [0,1]
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(r,g,b,a=1){
        this.red = r;
        this.green = g;
        this.blue = b;
        this.alpha = a;
    }

    /*
        Method Name: generateCodeFromValues
        Method Parameters: 
            redValue:
                Red integer [0,255]
            greenValue:
                Green integer [0,255]
            blueValue:
                Blue integer [0,255]
        Method Description: Generates a color code given values
        Method Return: String
    */
    static generateCodeFromValues(redValue, greenValue, blueValue){
        let redInt2 = redValue % 16;
        let greenInt2 = greenValue % 16;
        let blueInt2 = blueValue % 16;

        let redInt1 = (redValue - redInt2) / 16;
        let blueInt1 = (blueValue - blueInt2) / 16;
        let greenInt1 = (greenValue - greenInt2) / 16;

        let aCode = "a".charCodeAt(0);
        let hexidecimalIntegerToChar = (value) => {
            return value < 10 ? value.toString() : String.fromCharCode(value - 10 + aCode);
        }

        let redCode = hexidecimalIntegerToChar(redInt1) + hexidecimalIntegerToChar(redInt2);
        let blueCode = hexidecimalIntegerToChar(blueInt1) + hexidecimalIntegerToChar(blueInt2);
        let greenCode = hexidecimalIntegerToChar(greenInt1) + hexidecimalIntegerToChar(greenInt2);
        return "#" + redCode + greenCode + blueCode;
    }

    /*
        Method Name: getRed
        Method Parameters: None
        Method Description: Getter
        Method Return: Integer in range [0,255]
    */
    getRed(){
        return this.red;
    }

    /*
        Method Name: getBlue
        Method Parameters: None
        Method Description: Getter
        Method Return: Integer in range [0,255]
    */
    getBlue(){
        return this.blue;
    }

    /*
        Method Name: getGreen
        Method Parameters: None
        Method Description: Getter
        Method Return: Integer in range [0,255]
    */
    getGreen(){
        return this.green;
    }

    /*
        Method Name: modifyBrightness
        Method Parameters:
            multiplier:
                The multiplier to multiply the brightness by
        Method Description: Modifies the brightness of the colour
        Method Return: void
    */
    modifyBrightness(multiplier){
        this.red = Math.floor(Math.min(255, this.red * multiplier));
        this.green = Math.floor(Math.min(255, this.green * multiplier));
        this.blue = Math.floor(Math.min(255, this.blue * multiplier));
    }

    /*
        Method Name: setAlpha
        Method Parameters:
            newAlphaValue:
                The new opacity
        Method Description: Setter
        Method Return: void
    */
    setAlpha(newAlphaValue){
        this.alpha = newAlphaValue;
    }

    /*
        Method Name: toString
        Method Parameters: None
        Method Description: Creates a string representation of the colour
        Method Return: String
    */
    toString(){
        return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`
    }

    /*
        Method Name: toCode
        Method Parameters: None
        Method Description: Creates a Colour code from a colour instance
        Method Return: String
    */
    toCode(){
        return Colour.generateCodeFromValues(this.red, this.green, this.blue);
    }

    /*
        Method Name: fromCode
        Method Parameters:
            code:
                A hexidecimal colour code string. e.g. "#ff00ff" = 255 red 0 blue 255 green 1 alpha
        Method Description: Creates a Colour instance from a colour code
        Method Return: Colour
    */
    static fromCode(code){
        let red = Number("0x" + code.charAt(1) + code.charAt(2));
        let green = Number("0x" + code.charAt(3) + code.charAt(4));
        let blue = Number("0x" + code.charAt(5) + code.charAt(6));
        return new Colour(red, green, blue);
    }

    /*
        Method Name: addColour
        Method Parameters:
            colour:
                A Colour instance
        Method Description: Modifies a colour by adding another to it. Does not affect the opacity.
        Method Return: void
    */
    addColour(colour){
        this.red = Math.min(255, this.red + colour.getRed());
        this.green = Math.min(255, this.green + colour.getGreen());
        this.blue = Math.min(255, this.blue + colour.getBlue());
    }
}

/*
    Method Name: translate
    Method Parameters:
        x:
            The x value of the translation
        y:
            The y value of the translation
    Method Description: Translates the origin in 2d
    Method Return: void
*/
function translate(x, y){
    drawingContext.translate(x,y);
}

/*
    Method Name: rotate
    Method Parameters:
        rads:
            The number of radians to rotate
    Method Description: rotates the origin in 2d
    Method Return: void
*/
function rotate(rads){
    drawingContext.rotate(rads);
}

/*
    Method Name: scale
    Method Parameters:
        x:
            The x factor to scale
        y:
            The y factor to scale
    Method Description: Changes the scale of the canvas drawing context
    Method Return: void
*/
function scale(x, y){
    drawingContext.scale(x,y);
}

/*
    Method Name: strokeRectangle
    Method Parameters:
        colourObject:
            A colour instance that will fill in the rectangle
        x:
            The x location (in screen coordinates) of the left of the rectangle
        y:
            The y location (in screen coordinates) of the top of the rectangle
        width:
            The width of the rectangle (pixels)
        height:
            The height of the rectangle (pixels)
    Method Description: Creates a rectangle with a stroke border around it
    Method Return: void
*/
function strokeRectangle(colourObject, x, y, width, height){
    updateFillColour(colourObject);
    drawingContext.beginPath();
    drawingContext.rect(x, y, width, height);
    drawingContext.strokeRect(x, y, width, height);
    drawingContext.fill();
}

/*
    Method Name: noStrokeRectangle
    Method Parameters:
        colourObject:
            A colour instance that will fill in the rectangle
        x:
            The x location (in screen coordinates) of the left of the rectangle
        y:
            The y location (in screen coordinates) of the top of the rectangle
        width:
            The width of the rectangle (pixels)
        height:
            The height of the rectangle (pixels)
    Method Description: Creates a rectangle
    Method Return: void
*/
function noStrokeRectangle(colourObject, x, y, width, height){
    updateFillColour(colourObject);
    drawingContext.beginPath();
    drawingContext.rect(x, y, width, height);
    drawingContext.fill();
}

/*
    Method Name: strokeCircle
    Method Parameters:
        colourObject:
            A colour instance that will fill in the rectangle
        x:
            The x location (in screen coordinates) of the center of the circle
        y:
            The y location (in screen coordinates) of the center of the circle
        diameter:
            The diameter (in pixels) of the circle
    Method Description: Creates a circle with a stroke around it on the canvas
    Method Return: void
*/
function strokeCircle(colourObject, x, y, diameter){
    updateFillColour(colourObject);
    drawingContext.beginPath();
    drawingContext.arc(x, y, diameter/2, 0, 2 * Math.PI);
    drawingContext.strokeArc(x, y, width, height);
    drawingContext.fill();
}

/*
    Method Name: strokeCircle
    Method Parameters:
        colourObject:
            A colour instance that will fill in the rectangle
        x:
            The x location (in screen coordinates) of the center of the circle
        y:
            The y location (in screen coordinates) of the center of the circle
        diameter:
            The diameter (in pixels) of the circle
    Method Description: Creates a circle on the canvas
    Method Return: void
*/
function noStrokeCircle(colourObject, x, y, diameter){
    updateFillColour(colourObject);
    drawingContext.beginPath();
    drawingContext.arc(x, y, diameter/2, 0, 2 * Math.PI);
    drawingContext.fill();
}

/*
    Method Name: updateFontSize
    Method Parameters:
        newTextSize:
            The new text size, an integer
    Method Description: Updates the current font size / text size of the drawing context
    Method Return: void
*/
function updateFontSize(newTextSize){
    drawingContext.font = newTextSize.toString() + "px " + DEFAULT_FONT_FAMILY;
}

/*
    Method Name: measureTextWidth
    Method Parameters:
        line:
            A string of text
    Method Description: Calculates the pixel width of a piece of text with the given font & font size
    Method Return: Integer
*/
function measureTextWidth(line){
    return drawingContext.measureText(line).width;
}

/*
    Method Name: updateFillColour
    Method Parameters:
        colourObject:
            A Colour instance
    Method Description: Updates the current fill colour of the drawing context
    Method Return: void
*/
function updateFillColour(colourObject){
    drawingContext.fillStyle = colourObject.toString();
}

/*
    Method Name: makeText
    Method Parameters:
        textStr:
            The text string
        screenX:
            The screen x coordinate of the left side of the text box
        screenY:
            The screen y coordinate of the top of the text box
        boxWidth:
            The width of the text box in pixels
        boxHeight:
            The height of the text box in pixels
        textColour:
            The colour of the text (Colour instance)
        textSize:
            The size of the text (integer)
        alignLR:
            A string specifying the horizontal alignment of the text
        alignTB:
            A string specifing the vertical alignment of the text
    Method Description: Creates text on the screen
    Method Return: void
*/
function makeText(textStr, screenX, screenY, boxWidth, boxHeight, textColour, textSize, alignLR, alignTB){
    updateFontSize(textSize);
    updateFillColour(textColour);
    let currentSpaceOccupied = textSize;
    drawingContext.textAlign = alignLR;
    drawingContext.textBaseline = alignTB;
    let lines = textStr.split("\n");
    // Display line by line
    let i = 0;
    for (let line of lines){
        drawingContext.fillText(line, screenX, screenY+textSize * i, boxWidth);
        currentSpaceOccupied += textSize;
        i++;
        // Stop once reached limit much
        if (currentSpaceOccupied > boxHeight){
            break;
        }
    }
}

/*
    Function Name: makeTextExplicit
    Function Parameters: 
        textStr:
            A text string
        textSize:
            The text size. int
        textColour:
            The text Colour instance
        screenX:
            The screen x of the text
        screenY:
            The screen y of the text
        alignLR:
            Text alignment (left-right) string
        alignTB:
            Text alignment (top-bottom) string
    Function Description: Makes text on screen
    Function Return: void
*/
function makeTextExplicit(textStr, textSize, textColour, screenX, screenY, alignLR, alignTB){
    updateFontSize(textSize);
    updateFillColour(textColour);
    drawingContext.textAlign = alignLR;
    drawingContext.textBaseline = alignTB;
    drawingContext.fillText(textStr, screenX, screenY, measureTextWidth(textStr));
}

/*
    Method Name: displayImage
    Method Parameters:
        image:
            An Image instance
        x:
            The screen coordinate x of the left of the image in its intended place
        y:
            The screen coordinate y of the top of the image in its intended place
    Method Description: Displays an image on the screen
    Method Return: void
*/
function displayImage(image, x, y){
    drawingContext.drawImage(image, x, y);
}

/*
    Method Name: getZoomedScreenWidth
    Method Parameters: None
    Method Description: Gets the screen width modified by the zoom setting
    Method Return: Integer
*/
function getZoomedScreenWidth(){
    return Math.ceil(getScreenWidth() / gameZoom);
}

/*
    Method Name: getZoomedScreenHeight
    Method Parameters: None
    Method Description: Gets the screen height modified by the zoom setting
    Method Return: Integer
*/
function getZoomedScreenHeight(){
    return Math.ceil(getScreenHeight() / gameZoom);
}

/*
    Method Name: getScreenWidth
    Method Parameters: None
    Method Description: Determines the screen width in real pixels
    Method Return: void
*/
function getScreenWidth(){
    return window.innerWidth; // * pixelSomething density in the future?
}
/*
    Method Name: getScreenHeight
    Method Parameters: None
    Method Description: Determines the screen height in real pixels
    Method Return: void
*/
function getScreenHeight(){
    return window.innerHeight;
}

/*
    Function Name: getCanvasWidth
    Function Parameters: None
    Function Description: Gets the canvas width (should be the full screen)
    Function Return: int
*/
function getCanvasWidth(){
    return getScreenWidth();
}

/*
    Function Name: getCanvasHeight
    Function Parameters: None
    Function Description: Gets the canvas height (should be the full screen)
    Function Return: int
*/
function getCanvasHeight(){
    return getScreenHeight();
}

// Global variables
var drawingContext = null;
var gameZoom = 1;