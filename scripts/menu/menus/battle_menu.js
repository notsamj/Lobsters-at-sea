/*
    Class Name: BattleMenu
    Description: Used for connecting to the battle gamemdoe
*/
class BattleMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("battle_menu");

        this.requestToJoin = false;

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

        let menuData = MSD["battle_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonYOffset = menuDataBackButton["y_offset"];
        let backButtonY = (innerHeight) => { return innerHeight-backButtonYOffset; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        let backButtonX = menuDataBackButton["x"];
        let selfReference = this;
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], backButtonX, backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            selfReference.sendNotInterestedInGame();
            GC.getMenuManager().switchTo("main_menu");
        }));

        // Scrolling message display
        this.scrollingMessageDisplay = new ScrollingMessageDisplay(MSD["battle_menu"]);
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
            "subject": "desire_to_play_battle",
            "value": true
        }

        try{
            SC.sendJSON(lobbbyJoinRequest);
        }catch {
            console.log("No connection. Cannot send lobby join request.");
        }
    }

    sendNotInterestedInGame(){
        // This is the active menu
        let lobbbyQuitRequest = {
            "subject": "desire_to_play_battle",
            "value": false
        }

        try{
            SC.sendJSON(lobbbyQuitRequest);
        }catch {
            console.log("No connection. Cannot send lobby quit request.");
        }
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
            //throw new Error("Unexpected message from server: " + JSON.stringify(eventJSON));
        }
    }

    statusUpdate(eventJSON){
        let messageText = eventJSON["text"];
        let messageCategory = eventJSON["category"];
        this.scrollingMessageDisplay.addMessage(messageText, MSD["battle_menu"]["category_to_color_code"][messageCategory]);
    }

    informSwitchedTo(){
        SC.initiateConnection();

        // Send request to join game
        this.lobbyJoinFunc();
    }

    informChangedToMainMenu(){
        let lobbbyQuitRequest = {
            "subject": "desire_to_play_battle",
            "value": false
        }

        SC.sendJSON(lobbbyQuitRequest);
    }
}
