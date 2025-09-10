/*
    Class Name: WinningScreen
    Class Description: The screen shown when the game is over
*/
class WinningScreen {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        this.active = false;
        this.text = undefined;
        this.textColour = undefined;
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the screen
        Method Return: void
    */
    reset(){
        this.active = false;
        this.text = undefined;
        this.textColour = undefined;
    }

    /*
        Method Name: setUp
        Method Parameters: 
            text:
                Text to display
            textColourCode:
                Colour of text
        Method Description: Sets up the screen
        Method Return: void
    */
    setUp(text, textColourCode){
        this.text = text;
        this.textColour = Colour.fromCode(textColourCode);

        // Set active
        this.setActive(true);
    }

    /*
        Method Name: setActive
        Method Parameters: 
            value:
                Specifies if the screen is active
        Method Description: Setter
        Method Return: Setter
    */
    setActive(value){
        this.active = value;
    }
    
    /*
        Method Name: isActive
        Method Parameters: None
        Method Description: Checks if the screen is active
        Method Return: boolean
    */
    isActive(){
        return this.active;
    }
    
    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the screen
        Method Return: void
    */
    display(){
        Menu.makeText(this.text, this.textColour, Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight() * 0.9), Math.floor(getScreenWidth()*0.70), Math.floor(getScreenHeight()/4), "center", "hanging");
    }
}