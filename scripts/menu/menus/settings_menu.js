/*
    Class Name: SettingsMenu
    Description: Displays settings
*/
class SettingsMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("settings_menu");
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

        let menuData = MSD["settings_menu"];

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
        this.components.push(scrollableDisplay);

        // Add options
        for (let menuObj of menuData["settings_menus"]){
            let menuName = menuObj["menu_name"];
            let handlerFunc = () => {
                GC.getMenuManager().switchTo(menuName);
            }
            let menuAccessObj = {
                "display_name": menuName,
                "handler": handlerFunc
            }
            scrollableDisplay.addDisplayItem(menuAccessObj);
        }
    }
}
