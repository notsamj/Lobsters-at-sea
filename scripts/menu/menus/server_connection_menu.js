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
            selfReference.informChangedToMainMenu();
            GC.getMenuManager().switchTo("main_menu");
        }));

        // Scrolling message display
        this.scrollingMessageDisplay = new ScrollingMessageDisplay(MSD["server_connection_menu"]);
        this.components.push(this.scrollingMessageDisplay);

        // Set up message sharing
        let statusUpdateHandlerFunction = (eventJSON) => {
            selfReference.statusUpdate(eventJSON);
        }

        let serverMessageHandlerFunction = (eventJSON) => {
            selfReference.serverMessage(eventJSON);
        }

        let lobbyJoinFunc = (eventJSON) => {
            selfReference.lobbyJoinFunc(eventJSON);
        }

        SC.getEventHandler().addHandler("connection_initiated", lobbyJoinFunc);

        SC.getEventHandler().addHandler("status_update", statusUpdateHandlerFunction);

        SC.getEventHandler().addHandler("server_message", serverMessageHandlerFunction);
    }

    lobbyJoinFunc(){
        if (!this.isActiveMenu()){ return; }

        // This is the active menu
        let lobbbyJoinRequest = {
            "subject": "lobby_join"
        }

        SC.sendJSON(lobbbyJoinRequest);
    }

    serverMessage(eventJSON){
        //console.log(GC.isInGame(), eventJSON["message_json"]["subject"], eventJSON)
        // Ignore if in game
        if (GC.isInGame()){
            return;
        }

        // Expect a game_start message
        let messageJSON = eventJSON["message_json"];
        if (messageJSON["subject"] === "game_start"){
            GC.newGame(LasRemoteGame, Battle);
            GC.getGamemodeManager().getActiveGamemode().setup(messageJSON["game_details"]);
            GC.getMenuManager().switchTo("game");
        }else{
            throw new Error("Unexpected message from server: " + JSON.stringify(eventJSON));
        }
    }

    statusUpdate(eventJSON){
        let messageText = eventJSON["text"];
        let messageCategory = eventJSON["category"];
        this.scrollingMessageDisplay.addMessage(messageText, MSD["server_connection_menu"]["category_to_color_code"][messageCategory]);
    }

    informSwitchedTo(){
        SC.setUserInterest(true);
        SC.initiateConnection();
    }

    informChangedToMainMenu(){
        // Switched to main main
        SC.setUserInterest(false);
        SC.terminateConnection();
    }
}
