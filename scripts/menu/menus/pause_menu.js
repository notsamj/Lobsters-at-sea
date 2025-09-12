/*
    Class Name: PauseMenu
    Description: A subclass of Menu that provides the options to resume or go to main menu.
*/
class PauseMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        super("pause_menu");
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the menu interface
        Method Return: void
    */
    setup(){
        let pauseMenuData = MSD["pause_menu"];

        let resumeButtonData = pauseMenuData["resume_button"];
        let mainMenuButtonData = pauseMenuData["main_menu_button"];

        let buttonSizeX = pauseMenuData["button_x_size"];
        let buttonSizeY = pauseMenuData["button_y_size"];
        let buttonGapY = pauseMenuData["button_y_gap"];

        let buttonX = (innerWidth) => {return (innerWidth - buttonSizeX)/2; }

        let totalInteractionYSize = buttonSizeY * 2 + buttonGapY;

        // Resume
        let resumeButtonY = (innerHeight) => { return Math.floor(innerHeight - totalInteractionYSize)/2 + totalInteractionYSize; }
        this.components.push(new RectangleButton(resumeButtonData["text"], resumeButtonData["button_colour_code"], resumeButtonData["text_colour_code"], buttonX, resumeButtonY, buttonSizeX, buttonSizeY, (instance) => {
            GC.getMenuManager().switchTo("game");
        }));

        // Main Menu
        let mainMenuButtonY = (innerHeight) => { return resumeButtonY(innerHeight) - buttonSizeY - buttonGapY; }
        this.components.push(new RectangleButton(mainMenuButtonData["text"], mainMenuButtonData["button_colour_code"], mainMenuButtonData["text_colour_code"], buttonX, mainMenuButtonY, buttonSizeX, buttonSizeY, (instance) => {
            instance.handleGameExit();
        }));
    }

    /*
        Method Name: handleGameExit
        Method Parameters: None
        Method Description: Handles actions on game exit
        Method Return: void
    */
    handleGameExit(){
        GC.getMenuManager().switchTo("main_menu");
        GC.getGamemodeManager().getActiveGamemode().end();
        GC.getGamemodeManager().deleteActiveGamemode();
    }
}