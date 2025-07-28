/*
    Class Name: ServerConnectionMenu
    Description: Used for connecting to the server
*/
class ServerConnectionMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("server_connection_menu");

        // Declare
        this.scrollingMessageDisplay = undefined;
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the menu
        Method Return: void
    */
    setup(){
        // Background
        this.components.push(new LoadingScreenComponent(true));

        let menuData = MSD["server_connection_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonYOffset = menuDataBackButton["y_offset"];
        let backButtonY = (innerHeight) => { return innerHeight-backButtonYOffset; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        let backButtonX = menuDataBackButton["x"];
        let selfReference = this;
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], backButtonX, backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            selfReference.informSwitchedFrom();
            GC.getMenuManager().switchTo("main_menu");
        }));

        // Scrolling message display
        this.scrollingMessageDisplay = new ScrollingMessageDisplay(MSD["server_connection_menu"]);
        this.components.push(this.scrollingMessageDisplay);

        // Set up message sharing
        let statusUpdateHandlerFunction = (eventJSON) => {
            selfReference.serverMessage(eventJSON);
        }
        SC.getEventHandler().addHandler("status_update", statusUpdateHandlerFunction);
    }

    serverMessage(eventJSON){
        let messageText = eventJSON["text"];
        let messageCategory = eventJSON["category"];
        this.scrollingMessageDisplay.addMessage(messageText, MSD["server_connection_menu"]["category_to_color_code"][messageCategory])
    }

    informSwitchedTo(){
        SC.initiateConnection();
    }

    informSwitchedFrom(){
        SC.terminateConnection();
    }
}
