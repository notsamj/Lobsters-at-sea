/*
    Class Name: ReplayMenu
    Description: A menu for viewing the various replays available
*/
class ReplayMenu extends Menu {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("replay_menu");
        this.replayMenuTickLock = new Lock();
        this.scrollableDisplay = undefined; // Declaration
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the menu
        Method Return: void
    */
    setup(){
        // Background
        this.components.push(new LoadingScreenComponent());

        let menuData = MSD["replay_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            GC.getMenuManager().switchTo("main_menu");
        }));

        // Add the scrollable display
        let scrollableDisplay = new ScrollableDisplay(menuData["scrollable_display"]);
        this.scrollableDisplay = scrollableDisplay;
        
        // Add default ones
        let maxEntries = scrollableDisplay.getMaxEntries();
        let addedCount = 0;
        for (let localReplay of LOCAL_REPLAYS){
            // Stop adding as you approach max entries
            if (addedCount + 1 >= maxEntries){
                break;
            }
            let localReplayName = localReplay["name"];
            let handler = () => {
                GC.newGame(LasLocalGame, ReplayViewer);
                GC.getMenuManager().switchTo("game");
                GC.getActiveGamemode().launchLocal(localReplayName);
            }
            scrollableDisplay.addDisplayItem({"display_name": localReplayName, "handler": handler, "type": "offline"});
            addedCount++;
        }

        this.components.push(scrollableDisplay);
    }

    /*
        Method Name: updateWithNewReplays
        Method Parameters: 
            replayListJSON:
                JSON with info on replays available
        Method Description: Updates the display with replays
        Method Return: void
    */
    updateWithNewReplays(replayListJSON){
        let replays = replayListJSON["replays"];

        let displayItems = this.scrollableDisplay.getDisplayItems();

        // Remove online type
        for (let i = displayItems.getLength() - 1; i >= 0; i--){
            let displayItem = displayItems.get(i);
            if (displayItem["type"] === "online"){
                displayItems.pop(i);
            }
        }

        let offlineLength = displayItems.getLength();
        let maxEntires = this.scrollableDisplay.getMaxEntries();
        let entryCount = offlineLength;
        
        let onlineEntryIndex = 0;

        // Add the ones that one can
        while (onlineEntryIndex < replays.length && entryCount < maxEntires){
            let replayName = replays[onlineEntryIndex];
            let handler = () => {
                GC.newGame(LasLocalGame, ReplayViewer);
                GC.getMenuManager().switchTo("game");
                GC.getActiveGamemode().launchOnline(replayName);
            }
            this.scrollableDisplay.addDisplayItem({"display_name": replayName, "handler": handler, "type": "online"});
            onlineEntryIndex++;
            entryCount++;
        }
    }

    /*
        Method Name: checkForReplayList
        Method Parameters: None
        Method Description: Checks for replays from the server
        Method Return: Promise (implicit)
    */
    async checkForReplayList(){
        let mailBox = SC.getClientMailbox();

        // Await access
        await mailBox.requestAccess();


        let folder = mailBox.getFolder("replay_list_data");

        let messages = folder["list"];
        // Note: Assume max length 1
        if (messages.getLength() > 0){
            let message = messages.get(0);
            if (!message["read"]){
                // Mark read
                message["read"] = true;
                this.updateWithNewReplays(message["data_json"]);
            }
        }

        // Release access
        mailBox.relinquishAccess();

    }

    /*
        Method Name: informSwitchedTo
        Method Parameters: None
        Method Description: Handles events on "switch-to"
        Method Return: void
    */
    informSwitchedTo(){
        // Tell SC to connec
        SC.initiateConnection();

        // Send now or when connection is established
        SC.sendNowOrOnConnection({
            "subject": "get_replay_list"
        }, "get_replay_list");
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Tick actions
        Method Return: Promise (implicit)
    */
    async tick(){
        // Skip if busy
        if (this.replayMenuTickLock.isLocked()){
            return;
        }
        await this.replayMenuTickLock.awaitUnlock(true);

        // Check for replay list messages
        await this.checkForReplayList();

        // Release
        this.replayMenuTickLock.unlock();

        // Regular component tick
        super.tick();
    }
}