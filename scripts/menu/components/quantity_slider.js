/*
    Class Name: QuantitySlider
    Description: A type of option slider. A sliding bar for setting a integer or float value in a range.
*/
class QuantitySlider extends OptionSlider {
    /*
        Method Name: constructor
        Method Parameters:
            x:
                x location of the quantity slider
            y:
                y location of the quantity slider
            width:
                Width of the quantity slider
            height:
                Height of the quantity slider
            textHeight:
                Height of the text (px) (int)
            sliderWidthPX:
                Width of the slider
            getValueFunction:
                Function to call to get the value
            setValueFunction:
                Function to call to set the value
            minValue:
                Minimum value
            maxValue:
                Maximum value
            usingFloat:
                Whether using floats rather than integers
            backgroundBarColourCode:
                Colour of the bar background (code)
            sliderColourCode:
                Colour of the slider (code)
            textColourCode:
                Colour of the text (code)
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(x, y, width, height, textHeight, sliderWidthPX, getValueFunction, setValueFunction, minValue, maxValue, usingFloat=false, backgroundBarColourCode="#000000", sliderColourCode="#ffffff", textColourCode="#000000"){
        super(x, y, width, height, textHeight, sliderWidthPX, getValueFunction, setValueFunction, backgroundBarColourCode, sliderColourCode, textColourCode);
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.usingFloat = usingFloat;
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
        let currentPercentage = (currentValue - this.minValue) / (this.maxValue - this.minValue);
        let pxToMove = this.width - this.sliderWidth;
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
        let sliderOffset = GC.getGMouseX() - this.getX() - this.sliderWidth/2;
        // Either set value to extremes or in between
        let calculatedValue = sliderOffset / (this.width - this.sliderWidth) * (this.maxValue - this.minValue) + this.minValue;
        if (!this.usingFloat){
            calculatedValue = Math.floor(calculatedValue);
        }
        let newValue = Math.min(Math.max(calculatedValue, this.minValue), this.maxValue);
        this.modifyValue(newValue);
        this.updateSliderX();
    }
}