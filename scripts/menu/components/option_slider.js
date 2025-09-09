/*
    Class Name: OptionSlider
    Description: An abstract type of component. A sliding bar for choosing between options for a value.
*/
class OptionSlider extends Component {
    /*
        Method Name: constructor
        Method Parameters:
            x:
                x location of the option slider
            y:
                y location of the option slider
            width:
                Width of the option slider
            height:
                Height of the option slider
            textHeight:
                Height of the text (px) (int)
            cursorWidthPX:
                Width of a cursor
            getValueFunction:
                Function to call to get the value
            setValueFunction:
                Function to call to set the value
            backgroundBarColourCode:
                Colour of the bar background (code)
            sliderColourCode:
                Colour of the slider (code)
            textColourCode:
                Colour of the text (code)
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(x, y, width, height, textHeight, cursorWidthPX, getValueFunction, setValueFunction, backgroundBarColourCode="#000000", sliderColourCode="#ffffff", textColourCode="#000000"){
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.textHeight = textHeight;
        this.cursorWidth = cursorWidthPX;
        this.getValueFunction = getValueFunction;
        this.setValueFunction = setValueFunction;
        this.sliding = false;
        this.backgroundBarColour = Colour.fromCode(backgroundBarColourCode);
        this.sliderColour = Colour.fromCode(sliderColourCode);
        this.textColourCode = textColourCode;
        this.toStringFunction = null;
    }

    /*
        Method Name: updateSliderX
        Method Parameters: None
        Method Description: Abstract method for updating slide x
        Method Return: abstract
    */
    updateSliderX(){ throw new Error("Expected method implementation.") }
    /*
        Method Name: moveToX
        Method Parameters: 
            mouseX:
                A mouse x location
        Method Description: Abstract method that moves the slider to a given x
        Method Return: abstract
    */
    moveToX(mouseX){ throw new Error("Expected method implementation.") }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Determines the x value of this component. Depends on whether it is set as a function of the screen dimensions or static.
        Method Return: int
    */
    getX(){
        if (typeof this.x === "function"){
            return this.x(getScreenWidth());
        }else{
            return this.x;
        }
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Determines the y value of this component. Depends on whether it is set as a function of the screen dimensions or static.
        Method Return: int
    */
    getY(){
        if (typeof this.y === "function"){
            return this.y(getScreenHeight());
        }else{
            return this.y;
        }
    }

    getWidth(){
        if (typeof this.width === "function"){
            return this.width(getScreenWidth());
        }else{
            return this.width;
        }
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the quantity slider
        Method Return: void
    */
    display(){
        
        // Background Rectangle
        let screenYForRects = GC.getMenuManager().changeToScreenY(this.getY() - this.textHeight);
        noStrokeRectangle(this.backgroundBarColour, this.getX(), screenYForRects, this.getWidth(), this.height);
    
        // Slider
        noStrokeRectangle(this.sliderColour, this.sliderX, screenYForRects, this.cursorWidth, this.height);

        // Text
        let value = this.accessValue();
        let valueString = this.accessValue().toString();
        if (this.toStringFunction === null){
            valueString = value.toString();
        }else{
            valueString = this.toStringFunction(value);
        }
        Menu.makeText(valueString, this.textColourCode, this.getX(), this.getY(), this.getWidth(), this.textHeight);
    }

    /*
        Method Name: isSliding
        Method Parameters: None
        Method Description: Checks if the slider is currently sliding
        Method Return: Boolean
    */
    isSliding(){
        return this.sliding;
    }

    /*
        Method Name: setToStringFunction
        Method Parameters: 
            func:
                A function that converts the value of this slider to a string
        Method Description: Stores a function for conversion to string
        Method Return: void
    */
    setToStringFunction(func){
        this.toStringFunction = func;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Checks if the slider should move
        Method Return: void
    */
    tick(){
        this.checkMove();
        this.updateSliderX();
    }

    checkMove(){
        let menuManager = GC.getMenuManager();
        let gMouseX = GC.getGMouseX();
        let gMouseY = GC.getGMouseY();
        let hasMouseOnY = this.coveredByY(menuManager.changeFromScreenY(gMouseY));
        let hasMouseOn = this.covers(gMouseX, menuManager.changeFromScreenY(gMouseY));
        let activated = GC.getMenuUserInputManager().isActivated("option_slider_grab");

        // If currently sliding and either the user is not clicking OR mouse if off it in y axis
        if (this.isSliding() && (!activated || !hasMouseOnY)){
            this.sliding = false;
            return;
        }
        // If not currently sliding and clicking and the mouse is fully on the bar
        else if (!this.isSliding() && activated && hasMouseOn){
            this.sliding = true;
        }
        
        // If not sliding at this point don't change anything
        if (!this.isSliding()){ return; }

        // Sliding
        this.moveToX(gMouseX);
    }

    /*
        Method Name: accessValue
        Method Parameters: None
        Method Description: Access the value of the slider
        Method Return: Number
    */
    accessValue(){
        return this.getValueFunction();
    }

    /*
        Method Name: modifyValue
        Method Parameters:
            newValue:
                A new value after being modified by a slider
        Method Description: Modifies the value associated with the slider
        Method Return: 
    */
    modifyValue(newValue){
        this.setValueFunction(newValue);
    }

    /*
        Method Name: covers
        Method Parameters:
            x:
                An x coordinate
            y:
                A y coordinate
        Method Description: Checks if a given point is covered by the slider
        Method Return: Boolean
    */
    covers(x, y){
        return this.coveredByX(x) && this.coveredByY(y);
    }

    /*
        Method Name: coveredByY
        Method Parameters:
            y:
                A y coordinate
        Method Description: Checks if a given point is covered by the slider's y position
        Method Return: Boolean
    */
    coveredByY(y){
        return y <= this.getY() - this.textHeight && y >= this.getY() - this.textHeight - this.height;
    }

    /*
        Method Name: coveredByX
        Method Parameters:
            x:
                An x coordinate
        Method Description: Checks if a given point is covered by the slider's x position
        Method Return: Boolean
    */
    coveredByX(x){
        return x >= this.getX() && x <= this.getX() + this.getWidth();
    }
}