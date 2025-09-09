/*
    Class Name: GamemodeViewerMenu
    Description: A menu for viewing the various gamemodes available
*/
class GamemodeViewerMenu extends Menu {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("gamemode_viewer_menu");
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

        let menuData = MSD["gamemode_viewer_menu"];

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
        this.components.push(scrollableDisplay);
        
        // Add menus
        let maxEntries = scrollableDisplay.getMaxEntries();
        let addedCount = 0;
        for (let gamemodeDetails of menuData["gamemodes"]){
            // Stop adding as you approach max entries
            if (addedCount + 1 >= maxEntries){
                break;
            }
            let menuDisplayName = gamemodeDetails["display_name"];
            let menuName = gamemodeDetails["menu_name"];
            let handler = () => {
                GC.getMenuManager().switchTo(menuName);
            }
            scrollableDisplay.addDisplayItem({"display_name": menuDisplayName, "handler": handler});
            addedCount++;
        }
    }
}