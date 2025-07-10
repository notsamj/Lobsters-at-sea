/*
    Class Name: Menu
    Description: An abstract class for making menus
*/
class Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(name){
        this.name = name;
        if (name === undefined){
            throw new Error("Tried to register a menu without a name");
        }
        this.components = [];
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: string
    */
    getName(){
        return this.name;
    }

    /*
        Method Name: informSwitchedTo
        Method Parameters: None
        Method Description: Default method when menu is switched to
        Method Return: void
    */
    informSwitchedTo(){}

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Finds the width of the screen and returns it
        Method Return: int
    */
    getWidth(){
        return getScreenWidth();
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Finds the height of the screen and returns it
        Method Return: int
    */
    getHeight(){
        return getScreenHeight();
    }

    /*
        Method Name: makeRectangleWithText
        Method Parameters:
        textStr:
            String of text inside the rectangle
        colour:
            The colour of the rectangle
        textColour:
            The colour of the text insid the rectangle
        x:
            The x location of the top left of the rectangle
        y:
            The y location of the top left of the rectangle
        width:
            The width of the rectangle
        height:
            The height of the rectangle

        Method Description: Create a rectangle with text inside
        Method Return: void
    */
    static makeRectangleWithText(textStr, backgroundColourCode, textColourCode, x, y, width, height){
        let screenX = x;
        let screenY = GC.getMenuManager().changeToScreenY(y);

        // Make the rectangle
        let rectColour = Colour.fromCode(backgroundColourCode);
        strokeRectangle(rectColour, screenX, screenY, width, height);

        // Make the text
        Menu.makeText(textStr, textColourCode, x+width/2, y-height/2, width, height, "center", "middle");
    }

    /*
        Method Name: determineMaxTextSizeByWidth
        Method Parameters:
        textLines:
            Array of strings, lines of text
        boxWidth:
            The width of the text box
        Method Description: Determines the maximum text size based on the width of the text
        Method Return: int
    */
    static determineMaxTextSizeByWidth(textLines, boxWidth){
        let currentTextSize = 10; // Using as a standard
        let maxTextSize = 300;
        updateFontSize(currentTextSize);
        let longestLine = textLines[0];
        let longestLineWidth = measureTextWidth(longestLine);
        
        // Find the longest line
        for (let i = 0; i < textLines.length; i++){
            let currentLineWidth = measureTextWidth(textLines[i]);
            if (currentLineWidth > longestLineWidth){
                longestLine = textLines[i];
                longestLineWidth = currentLineWidth;
            }
        }

        // Loop until the text is too big
        while ((measureTextWidth(longestLine) + MSD["text_box_padding_proportion"] * boxWidth < boxWidth) && currentTextSize < maxTextSize){
            updateFontSize(++currentTextSize);
        }
        return currentTextSize - 1; // -1 because we've established that this is 1 size too big for the width
    }

    /*
        Method Name: makeText
        Method Parameters:
        textStr:
            String of text inside the rectangle
        textColour:
            The colour of the text inside the rectangle
        x:
            The x location of the top left of the text box
        y:
            The y location of the top left of the text box
        boxWidth:
            The width of the text box
        boxHeight:
            The height of the text box

        Method Description: Create text box filled with text
        Method Return: void
    */
    static makeText(textStr, textColour, x, y, boxWidth, boxHeight, alignLR="left", alignTB="top"){
        if (textStr === ""){ return; }
        let splitByLine = textStr.split("\n");
        let numLines = splitByLine.length;
        let screenX = x;
        let screenY = GC.getMenuManager().changeToScreenY(y);
        let maxTextSizeW = Menu.determineMaxTextSizeByWidth(splitByLine, boxWidth);
        let maxTextSizeH = Math.floor((boxHeight - MSD["text_box_padding_proportion"] * boxHeight) / numLines);
        let calculatedTextSize = Math.min(maxTextSizeW, maxTextSizeH);
        calculatedTextSize = Math.max(calculatedTextSize, 1);
        makeText(textStr, screenX, screenY, boxWidth, boxHeight, textColour, calculatedTextSize, alignLR, alignTB);
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Display all components
        Method Return: void
    */
    display(){
        for (let component of this.components){
            if (!component.isDisplayEnabled()){ continue; }
            component.display();
        }
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks all components in the menu
        Method Return: void
    */
    tick(){
        for (let component of this.components){
            if (component.isDisabled()){ continue; }
            component.tick();
        }
    }

    /*
        Method Name: click
        Method Parameters:
        x:
            The x location of the click
        y:
            The y location of the click

        Method Description: Determine if any component was clicked (from most recently added to least)
        Method Return: void
    */
    click(x, y){
        for (let i = this.components.length - 1; i >= 0; i--){
            let component = this.components[i];
            if (component.covers(x, y) && !component.isDisabled()){
                component.clicked(this, x, y);
                break;
            }
        }
    }

    /*
        Method Name: addComponent
        Method Parameters: None
        Method Description: Adds a component to the menu
        Method Return: void
    */
    addComponent(component){
        this.components.push(component);
    }
}