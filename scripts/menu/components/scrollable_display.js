/*
    Class Name: ScrollableDisplay
    Description: An area to display things that is aided by a scrollbar
*/
class ScrollableDisplay extends Component {
    /*
        Method Name: constructor
        Method Parameters: 
            scrollableDisplayJSON:
                JSON info about the things being displayed
        Method Description: constructor
        Method Return: constructor
    */
    constructor(scrollableDisplayJSON){
        super();
        this.scrollBar = undefined; // Declare
        this.entryXOffset = undefined; // Declare
        this.entryXSize = undefined; // Declare
        this.entryYSize = undefined; // Declare
        this.entryYOffset = undefined; // Declare
        this.displayItems = undefined; // Declare

        this.setup(scrollableDisplayJSON);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks the scrollbar
        Method Return: void
    */
    tick(){
        this.scrollBar.tick();
    }

    /*
        Method Name: getEntryYSize
        Method Parameters: None
        Method Description: Gets the y size of entries
        Method Return: int
    */
    getEntryYSize(){
        return this.entryYSize;
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
    covers(x, y){
        return x >= this.entryXOffset && x <= getScreenWidth() - this.entryXOffset && y >= this.entryYOffset && y <= getScreenHeight() - this.entryYOffset;
    }

    /*
        Method Name: clicked
        Method Parameters: 
            menuInstance:
                A menu instance
            x:
                An x coordinate
            yFromBottom:
                The y coordinate (w.r.t. the bottom of the screen)
        Method Description: Handles a click on the component
        Method Return: void
    */
    clicked(menuInstance, x, yFromBottom){
        let yFromTop = GC.getMenuManager().changeToScreenY(yFromBottom);
        // Handle the entry y offset
        yFromTop -= this.entryYOffset;

        let itemIndicesOnScreen = this.scrollBar.getVisibleEntriesIndicesRange();
        let foundIndex = null;
        let startI = itemIndicesOnScreen["start_index"];
        let yOffsetOfStartI = this.scrollBar.getYOffsetOf(startI) + this.entryYOffset;
        let endI = itemIndicesOnScreen["end_index"];


        let expectedI = Math.floor((yFromTop - yOffsetOfStartI) / this.entryYSize) + startI;
        // Ignore if out of range
        if (expectedI > endI || expectedI < startI){ return; }
        let yOffsetOfExpectedI = (expectedI - startI) * this.entryYSize + yOffsetOfStartI;
        
        // If not clicking inside button then ignore
        if (!(x >= this.entryXOffset && x < this.entryXOffset + this.goToMenuButtonXSize && yFromTop >= yOffsetOfExpectedI && yFromTop < yOffsetOfExpectedI + this.goToMenuButtonYSize)){
            return;
        }
        // Click in button -> go to menu
       this.displayItems.get(expectedI)["handler"]();
    }

    /*
        Method Name: setup
        Method Parameters: 
            scrollableDisplayJSON:
                JSON info about the things being displayed
        Method Description: Sets up the scrollable display
        Method Return: void
    */
    setup(scrollableDisplayJSON){
        let entryXSize = scrollableDisplayJSON["entry"]["x_size"];
        this.entryXSize = entryXSize;
        let entryXOffset = scrollableDisplayJSON["entry"]["x_offset"];
        this.entryXOffset = entryXOffset;
        let entryYSize = scrollableDisplayJSON["entry"]["y_size"];
        this.entryYSize = entryYSize;
        let entryYOffset = scrollableDisplayJSON["entry"]["y_offset"];
        this.entryYOffset = entryYOffset;

        this.displayNameXSize = scrollableDisplayJSON["entry"]["display_name_x_size"];
        this.displayNameYSize = scrollableDisplayJSON["entry"]["display_name_y_size"];
        this.displayNameTextColour = Colour.fromCode(scrollableDisplayJSON["entry"]["display_name_text_colour_code"]);
        this.goToMenuButtonText = scrollableDisplayJSON["entry"]["go_to_menu_button_text"];
        this.goToMenuButtonXSize = scrollableDisplayJSON["entry"]["go_to_menu_button_x_size"];
        this.goToMenuButtonYSize = scrollableDisplayJSON["entry"]["go_to_menu_button_y_size"];
        this.goToMenuButtonBackgroundColour = Colour.fromCode(scrollableDisplayJSON["entry"]["go_to_menu_button_background_colour_code"]);
        this.goToMenuButtonTextColour = Colour.fromCode(scrollableDisplayJSON["entry"]["go_to_menu_button_text_colour_code"]);

        // Scroll bar
        let scrollbarData = scrollableDisplayJSON["scroll_bar"];
        let scrollBarXOffset = scrollbarData["x_offset"];
        let scrollBarYOffset = scrollbarData["y_offset"];
        let scrollBarXFunction = (screenWidth) => { return screenWidth - scrollBarXOffset; }
        let scrollBarYFunction = (screenHeight) => { return scrollBarYOffset; }
        let scrollBarMaxHeightFunction = (screenHeight) => { return screenHeight - 2 * scrollBarYOffset; }
        let entryYSpaceFunction = (screenHeight) => { return screenHeight - entryYOffset * 2; }
        this.scrollBar = new ScrollBar(scrollBarXFunction, scrollBarYFunction, scrollbarData["width"], scrollbarData["min_height"], scrollbarData["slider_height"], scrollBarMaxHeightFunction, entryYSize, entryYSpaceFunction, scrollbarData["background_colour_code"], scrollbarData["slider_colour_code"], scrollbarData["wheel_multiplier"]);
    
        // Setup display items
        this.displayItems = new NotSamLinkedList();

        // TEMP
        // Add default ones
        let handler = () => {
            GC.newGame(LasLocalGame, ReplayViewer);
            GC.getMenuManager().switchTo("game");
        }

        for (let localReplay of LOCAL_REPLAYS){
            this.displayItems.push({"display_name": localReplay["name"], "handler": handler});
        }

        this.scrollBar.increaseNumEntries(this.displayItems.getLength());

    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the scrollable display
        Method Return: void
    */
    display(){
        this.displayEntries();
        this.scrollBar.display();
    }

    /*
        Method Name: displayEntries
        Method Parameters: None
        Method Description: Displays all entries that are visible
        Method Return: void
    */
    displayEntries(){
        let itemIndicesToDisplay = this.scrollBar.getVisibleEntriesIndicesRange();

        let startI = itemIndicesToDisplay["start_index"];

        let yOffsetOfStartI = this.scrollBar.getYOffsetOf(startI) + this.entryYOffset;
        let yOffset = yOffsetOfStartI;
        let endI = itemIndicesToDisplay["end_index"];

        // If invalid indices
        if (startI < 0 || startI >= this.displayItems.getLength() || endI < 0 || endI >= this.displayItems.getLength()){
            return;
        }

        // Display entries
        for (let i = startI; i <= endI; i++){
            // Add background
            //noStrokeRectangle(colour, this.entryXOffset, yOffset, this.entryXSize, this.entryYSize);
            
            // Add name text
            Menu.makeText(this.displayItems.get(i)["display_name"], this.displayNameTextColour, this.entryXOffset, GC.getMenuManager().changeToScreenY(yOffset), this.displayNameXSize, this.displayNameYSize);

            // Add go to menu button
            Menu.makeRectangleWithText(this.goToMenuButtonText, this.goToMenuButtonBackgroundColour.toCode(), this.goToMenuButtonTextColour.toCode(), this.entryXOffset, GC.getMenuManager().changeToScreenY(yOffset + this.displayNameYSize), this.goToMenuButtonXSize, this.goToMenuButtonYSize);

            // Increment yOffset
            yOffset += this.entryYSize;
        }
    }
}