/*
    Class Name: MainMenu
    Description: The main menu inferface
*/
class MainMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        super("main_menu");
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Setup components in the menu
        Method Return: void
    */
    setup(){
        let buttonSizeX = MSD["main_menu"]["button_x_size"];
        let buttonSizeY = MSD["main_menu"]["button_y_size"];
        let gapSize = MSD["main_menu"]["gap_size"];

        let numButtons = 5; // challenge, gamemodes, replays, myprojects, settings
        let totalInterfaceYSize = gapSize * (numButtons-1) + buttonSizeY * numButtons;

        let buttonX = (innerWidth) => { return (innerWidth - buttonSizeX)/2; }

        let buttonColorCode = MSD["main_menu"]["button_color_code"];
        let buttonTextColorCode = MSD["main_menu"]["button_text_color_code"];

        // Background
        this.components.push(new LoadingScreenComponent());

        // Logo
        let logoSizeX = MSD["main_menu"]["logo_x_size"];
        let logoSizeY = MSD["main_menu"]["logo_y_size"];
        let logoX = (innerWidth) => { return 0; }
        let logoY = (innerHeight) => { return innerHeight; }
        this.components.push(new StaticImage("logo", logoX, logoY, logoSizeX, logoSizeY));

        // challenge
        let challengeButtonY = (innerHeight) => { return Math.floor(innerHeight - totalInterfaceYSize)/2 + totalInterfaceYSize; }
        this.components.push(new RectangleButton("Challenge", buttonColorCode, buttonTextColorCode, buttonX, challengeButtonY, buttonSizeX, buttonSizeY, (menuInstance) => {
            GC.newGame(LasLocalGame, Challenge);
            GC.getActiveGamemode().startUp();
            GC.getMenuManager().switchTo("game");
        }));

        // Gamemode viewer
        let gamemodeViewerY = (innerHeight) => { return challengeButtonY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("Gamemodes", buttonColorCode, buttonTextColorCode, buttonX, gamemodeViewerY, buttonSizeX, buttonSizeY, (menuInstance) => {
            GC.getMenuManager().switchTo("gamemode_viewer_menu");
        }));

        // Replays
        let replayButtonY = (innerHeight) => { return gamemodeViewerY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("Replays", buttonColorCode, buttonTextColorCode, buttonX, replayButtonY, buttonSizeX, buttonSizeY, (menuInstance) => {
            GC.getMenuManager().switchTo("replay_menu");
        }));

        // Other Projects
        let otherProjectsY = (innerHeight) => { return replayButtonY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("My Projects", buttonColorCode, buttonTextColorCode, buttonX, otherProjectsY, buttonSizeX, buttonSizeY, async (menuInstance) => {
            GC.getMenuManager().switchTo("my_projects_menu");
        }));

        // Settings
        let settingsY = (innerHeight) => { return otherProjectsY(innerHeight) - buttonSizeY - gapSize; }
        this.components.push(new RectangleButton("Settings", buttonColorCode, buttonTextColorCode, buttonX, settingsY, buttonSizeX, buttonSizeY, async (menuInstance) => {
            GC.getMenuManager().switchTo("settings_menu");
        }));

        // Information
        let infoY = MSD["main_menu"]["info_y"];
        let infoXSize = (MD["game_properties"]["expected_canvas_width"] - buttonSizeX)/2;
        let infoYSize = MSD["main_menu"]["info_y_size"];
        let infoText = MSD["main_menu"]["info_text"];
        let infoColorCode = MSD["main_menu"]["info_color_code"];
        this.components.push(new TextComponent(infoText, infoColorCode, 0, infoY, infoXSize, infoYSize));
    }
}