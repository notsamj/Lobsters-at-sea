/*
    Class Name: SelectionSlider
    Description: A type of option slider. A sliding bar for picking an option for an array.
*/
class SelectionSlider extends OptionSlider {
    /*
        Method Name: constructor
        Method Parameters:
            x:
                x location of the selection slider
            y:
                y location of the selection slider
            width:
                Width of the selection slider
            height:
                Height of the selection slider
            textHeight:
                Height of the text (px) (int)
            cursorWidthPX:
                Width of the slider
            getValueFunction:
                Function to call to get the value
            setValueFunction:
                Function to call to set the value
            options:
                A list of possible values for the selection slider
            backgroundBarColourCode:
                Colour of the bar background (code)
            sliderColourCode:
                Colour of the slider (code)
            textColourCode:
                Colour of the text (code)
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(x, y, width, height, textHeight, cursorWidthPX, getValueFunction, setValueFunction, options, backgroundBarColourCode="#000000", sliderColourCode="#ffffff", textColourCode="#000000"){
        super(x, y, width, height, textHeight, cursorWidthPX, getValueFunction, setValueFunction, backgroundBarColourCode, sliderColourCode, textColourCode);
        this.options = options;
        this.updateSliderX();
    }

    /*
        Method Name: updateSliderX
        Method Parameters: None
        Method Description: Updates the x positition of the slider
        Method Return: void
    */
    updateSliderX(){
        let currentValue = this.accessValue();
        let currentIndex = getIndexOfElementInList(this.options, currentValue);
        let currentPercentage = (currentIndex) / (this.options.length-1); // Assuming not zero
        let pxToMove = this.width - this.cursorWidth;
        this.sliderX = this.getX() + Math.round(currentPercentage * pxToMove);
    }

    /*
        Method Name: moveToX
        Method Parameters:
            mouseX:
                Current mosue x position
        Method Description: Move the slider to match the user input
        Method Return: void
    */
    moveToX(mouseX){
        // Update the slider position
        let cursorOffset = GC.getGMouseX() - this.getX() - this.cursorWidth/2;
        // Either set value to extremes or in between
        let calculatedIndex = Math.max(0, Math.min(this.options.length-1, Math.floor(cursorOffset / (this.width - this.cursorWidth) * this.options.length)));
        let newValue = this.options[calculatedIndex];
        this.modifyValue(newValue);
        this.updateSliderX();
    }
}