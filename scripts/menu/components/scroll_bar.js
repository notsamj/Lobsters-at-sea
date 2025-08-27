/*
    Class Name: ScrollBar
    Description: The scrolling bar
*/
class ScrollBar extends Component {
    /*
        Method Name: constructor
        Method Parameters: 
            xFunction:
                x position function
            yFunction:
                y position function
            width:
                Width of the scroll bar
            minHeight:
                Minimum height of the scroll bar
            sliderHeight:
                The height of the slider
            maxHeightFunction:
                The maximum height function
            entryYSize:
                The y size of an entry
            entryYSpaceFunction:
                The function that determines the amount of y space that entries take up
            backgroundColourCode:
                The color code of the background of the scroll bar
            sliderColourCode:
                The color code of the slider
            scrollWheelMultiplier
                Multiplier for the scroll bar 
        Method Description: constructor
        Method Return: constructor
    */
    constructor(xFunction, yFunction, width, minHeight, sliderHeight, maxHeightFunction, entryYSize, entryYSpaceFunction, backgroundColourCode, sliderColourCode, scrollWheelMultiplier){
        super();
        this.xFunction = xFunction;
        this.yFunction = yFunction;
        this.width = width;
        this.minHeight = minHeight;
        this.sliderHeight = sliderHeight;
        this.maxHeightFunction = maxHeightFunction;
        this.backgroundColour = Colour.fromCode(backgroundColourCode);
        this.sliderColour = Colour.fromCode(sliderColourCode);
        this.sliderProgress = 0; // [0,1]
        this.entryYSize = entryYSize;
        this.numEntries = 0;
        this.entryYSpaceFunction = entryYSpaceFunction;
        this.scrollWheelMultiplier = scrollWheelMultiplier;
    }

    /*
        Method Name: getMinHeight
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getMinHeight(){
        return this.minHeight;
    }

    /*
        Method Name: getMaxEntries
        Method Parameters: None
        Method Description: Calculates the max number of entries that can be displayed at present
        Method Return: int
    */
    getMaxEntries(){
        let maxPositions = 1 + this.getMinHeight() - this.getSliderHeight();
        return maxPositions;
    }

    /*
        Method Name: increaseNumEntries
        Method Parameters: 
            amount:
                Amount of entries to add
        Method Description: Increases the number of entries
        Method Return: void
    */
    increaseNumEntries(amount=1){
        let newAmount = this.numEntries + amount;
        
        if (newAmount > this.getMaxEntries()){
            throw new Error("Too many entries!");  
        }
        this.numEntries = newAmount;
    }

    /*
        Method Name: getYOffsetOf
        Method Parameters: 
            index:
                An index (int)
        Method Description: Gets the y offset of an index
        Method Return: int
    */
    getYOffsetOf(index){
        let sliderProgress = this.getSliderProgress();
        let fullYRange = this.getYRange();
        let offsetOfScreen = sliderProgress * fullYRange;
        let offsetOfIndex = index * this.entryYSize;

        return offsetOfIndex - offsetOfScreen;
    }

    /*
        Method Name: covers
        Method Parameters: 
            mouseX:
                A mouse x location
            mouseY:
                A mouse y location
        Method Description: Checks if an x,y pair is covered
        Method Return: boolean
    */
    covers(mouseX, mouseY){
        let displayHeight = this.getHeight();
        let displayWidth = this.getWidth();

        let x = this.getX();
        let y = this.getY();
        let inX = mouseX >= x && GC.getGMouseX() < x + displayWidth;
        let inY = mouseX >= y && GC.getGMouseY() < y + displayHeight;
        return inX && inY;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Checks for user actions on a tick
        Method Return: void
    */
    tick(){
        let hasMouseOn = this.covers(GC.getGMouseX(), GC.getGMouseY());
        let activated = GC.getMenuUserInputManager().isActivated("scroll_bar_grab");
        // If they clicked on the bar
        if (activated && hasMouseOn){ 
            // Sliding
            this.moveToY(GC.getGMouseY());
        }else{
            let scrollValue = GC.getMenuUserInputManager().get("scroll_in_dir").getValue();
            if (scrollValue != 0){
                this.moveByScrollValue(scrollValue);
            }
        }
    }

    /*
        Method Name: moveByScrollValue
        Method Parameters: 
            scrollValue:
                An amount to scroll (up or down)
        Method Description: Moves the slider
        Method Return: void
    */
    moveByScrollValue(scrollValue){
        let currentOffset = this.getSliderOffset();
        let newOffset = currentOffset + this.scrollWheelMultiplier * scrollValue;
        let scrollBarHeight = this.getHeight();
        let scrollBarHeightDiff = scrollBarHeight - this.getSliderHeight();
        let newSliderPogress = newOffset / scrollBarHeightDiff;
        this.sliderProgress = Math.max(0, Math.min(1, newSliderPogress));
    }

    /*
        Method Name: moveToY
        Method Parameters: 
            mouseY:
                The mouse y to move to
        Method Description: Moves to a given mouse y
        Method Return: void
    */
    moveToY(mouseY){
        let desiredCenterY = GC.getGMouseY() - this.getY();
        let desiredOffset = desiredCenterY - this.getSliderHeight()/2;
        let scrollBarHeightDiff = this.getHeight() - this.getSliderHeight();
        let newProgress = desiredOffset / scrollBarHeightDiff;
        this.sliderProgress = Math.max(0, Math.min(1, newProgress));
    }

    /*
        Method Name: getSliderProgress
        Method Parameters: None
        Method Description: Getter
        Method Return: float
    */
    getSliderProgress(){
        return this.sliderProgress;
    }

    /*
        Method Name: getNumEntries
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getNumEntries(){
        return this.numEntries;
    }

    /*
        Method Name: getYRange
        Method Parameters: None
        Method Description: Calculates the y range of the scrollable area
        Method Return: int
    */
    getYRange(){
        return (this.getNumEntries() - 1) * this.getEntryYSize();
    }

    /*
        Method Name: getVisibleEntriesIndicesRange
        Method Parameters: None
        Method Description: Gets the range of visible indices
        Method Return: JSON object
    */
    getVisibleEntriesIndicesRange(){
        let screenYRegionSize = getScreenHeight() - 2 * this.getEntryYSize();
        let sliderProgress = this.getSliderProgress();
        let fullYRange = this.getYRange();

        let offset = sliderProgress * fullYRange;
        let startIndex = Math.ceil(offset / this.entryYSize);
        let endIndex = Math.min(this.getNumEntries()-1, Math.floor((offset + screenYRegionSize) / this.entryYSize));
        return {
            "start_index": startIndex,
            "end_index": endIndex
        }
    }

    /*
        Method Name: getEntryYSize
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getEntryYSize(){
        return this.entryYSize;
    }

    /*
        Method Name: getSliderHeight
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getSliderHeight(){
        return this.sliderHeight;
    }

    /*
        Method Name: getSliderOffset
        Method Parameters: None
        Method Description: Gets the slider visual offset
        Method Return: int
    */
    getSliderOffset(){
        let scrollBarHeight = this.getHeight();
        let scrollBarHeightDiff = scrollBarHeight - this.getSliderHeight();
        return Math.floor(this.getSliderProgress() * scrollBarHeightDiff);
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getWidth(){
        return this.width;
    }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Calculates the current x
        Method Return: int
    */
    getX(){
        return this.xFunction(getScreenWidth());
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Calculates the current y
        Method Return: int
    */
    getY(){
        return this.yFunction(getScreenHeight());
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Calculates the current y
        Method Return: int
    */
    getHeight(){
        return Math.max(this.minHeight, this.maxHeightFunction(getScreenHeight()));
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the scrollbar
        Method Return: void
    */
    display(){
        // Display the background
        let displayHeight = this.getHeight();
        let displayWidth = this.getWidth();

        let x = this.getX();
        let y = this.getY();
        noStrokeRectangle(this.backgroundColour, x, y, displayWidth, displayHeight);

        // Display the slider
        let slideHeight = this.getSliderHeight();
        let sliderOffset = this.getSliderOffset();
        noStrokeRectangle(this.sliderColour, x, y+sliderOffset, displayWidth, slideHeight);
    }
}