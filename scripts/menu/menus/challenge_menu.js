/*
    Class Name: ChallengeMenu
    Description: The menu for the challenge gamemode
*/
class ChallengeMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("challenge_menu");
        // Declare
        this.characterImage = undefined;
        this.switchToManualButton = undefined;
        this.switchToAutomaticButton = undefined;
        this.switchToHealModeButton = undefined;
        this.switchToHealthPoolModeButton = undefined;
        this.startingLevelText = undefined;
        this.startingLevelSlider = undefined;

        this.startingLevel = undefined;
        this.automaticSails = undefined;    
    }

    /*
        Method Name: startGame
        Method Parameters: None
        Method Description: Starts the duel game
        Method Return: void
    */
    startGame(){
        let modifiedSetupJSON = copyObject(MD["challenge"]["default_setup_json"]);

        // Modify
        modifiedSetupJSON["starting_level"] = this.getStartingLevel();
        modifiedSetupJSON["user_is_challenger"] = this.characterImage.getImageName() != "freecam";
        modifiedSetupJSON["user_automatic_sails"] = this.automaticSails;
        modifiedSetupJSON["heal_mode"] = this.healMode;

        GC.newGame(LasLocalGame, Challenge);
        GC.getActiveGamemode().startUp(modifiedSetupJSON);
        GC.getMenuManager().switchTo("game");
    }

    /*
        Method Name: getStartingLevel
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getStartingLevel(){
        return this.startingLevel;
    }

    /*
        Method Name: setStartingLevel
        Method Parameters: 
            newStartingLevel:
                Starting level number
        Method Description: Setter
        Method Return: void
    */
    setStartingLevel(newStartingLevel){
        this.startingLevel = newStartingLevel;
    }


    toggleAutomaticSails(){
        this.automaticSails = !this.automaticSails;
        let switchedToAutomaticSails = this.automaticSails;

        if (switchedToAutomaticSails){
            this.switchToAutomaticButton.fullDisable();
            this.switchToManualButton.fullEnable();
        }else{
            this.switchToAutomaticButton.fullEnable();
            this.switchToManualButton.fullDisable();
        }
    }

    toggleHealMode(){
        this.healMode = !this.healMode;
        let switchedToHealMode = this.healMode;

        if (switchedToHealMode){
            this.switchToHealModeButton.fullDisable();
            this.switchToHealthPoolModeButton.fullEnable();
        }else{
            this.switchToHealModeButton.fullEnable();
            this.switchToHealthPoolModeButton.fullDisable();
        }
    }

    checkIfSailSettingShouldBeEnabled(){
        if (this.characterImage.getImageName() === "freecam"){
            this.switchToAutomaticButton.fullDisable();
            this.switchToManualButton.fullDisable();
        }else{
            if (this.automaticSails){
                this.switchToAutomaticButton.fullDisable();
                this.switchToManualButton.fullEnable();
            }else{
                this.switchToAutomaticButton.fullEnable();
                this.switchToManualButton.fullDisable();
            }
        }
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

        let menuData = MSD["challenge_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            GC.getMenuManager().switchTo("main_menu");
        }));

        let menuOptionsStartX = menuData["menu_items_start_x"];
        let menuOptionsStartY = menuData["menu_items_start_y"];
        let menuOptionsStartYFunction = (innerHeight) => { return innerHeight - menuData["menu_items_start_y"] } ;

        // Character image
        let characterImageHeight = menuData["character_image"]["height"];
        let characterImageYFunction = (innerHeight) => { return menuOptionsStartYFunction(innerHeight); }
        this.characterImage = new RotatingStaticImage(menuData["character_image"]["selection"][0], menuOptionsStartX, characterImageYFunction, menuData["character_image"]["selection"], menuData["character_image"]["width"], characterImageHeight);
        this.characterImage.setOnClick(() => {
            this.checkIfSailSettingShouldBeEnabled();
        });
        this.components.push(this.characterImage);
    
        // Toggle buttons
        let toggleButtonData = menuData["toggle_bot_button"];
        let toggleButtonYOffset = toggleButtonData["y_offset"];
        let toggleButtonYSize = toggleButtonData["y_size"];

        let toggleAutomaticSailsButtonYFunction = (innerHeight) => { return characterImageYFunction(innerHeight) - characterImageHeight - toggleButtonYOffset; }
        let toggleAutomaticSailsFunction = (menu) => {
            return menu.toggleAutomaticSails();
        }

        // Switch to manual button
        this.switchToManualButton = new RectangleButton(toggleButtonData["automatic_text"], toggleButtonData["automatic_colour_code"], toggleButtonData["text_colour_code"], menuOptionsStartX, toggleAutomaticSailsButtonYFunction, toggleButtonData["x_size"], toggleButtonYSize, toggleAutomaticSailsFunction);
        this.components.push(this.switchToManualButton);

        // Set default value
        this.automaticSails = true;

        // Switch to auto button
        this.switchToAutomaticButton = new RectangleButton(toggleButtonData["manual_text"], toggleButtonData["manual_colour_code"], toggleButtonData["text_colour_code"], menuOptionsStartX, toggleAutomaticSailsButtonYFunction, toggleButtonData["x_size"], toggleButtonYSize, toggleAutomaticSailsFunction);
        this.components.push(this.switchToAutomaticButton);
        // Disable by default
        this.switchToAutomaticButton.fullDisable();

        let toggleHealModeButtonYFunction = toggleAutomaticSailsButtonYFunction;
        let toggleHealModeFunction = (menu) => {
            return menu.toggleHealMode();
        }

        // Switch to health pool mode button
        this.switchToHealthPoolModeButton = new RectangleButton(toggleButtonData["heal_mode_text"], toggleButtonData["heal_mode_colour_code"], toggleButtonData["text_colour_code"], menuOptionsStartX + toggleButtonData["x_size"], toggleHealModeButtonYFunction, toggleButtonData["x_size"], toggleButtonYSize, toggleHealModeFunction);
        this.components.push(this.switchToHealthPoolModeButton);

        // Set default value
        this.healMode = true;

        // Switch to heal mode button
        this.switchToHealModeButton = new RectangleButton(toggleButtonData["health_pool_mode_text"], toggleButtonData["health_pool_mode_colour_code"], toggleButtonData["text_colour_code"], menuOptionsStartX + toggleButtonData["x_size"], toggleHealModeButtonYFunction, toggleButtonData["x_size"], toggleButtonYSize, toggleHealModeFunction);
        this.components.push(this.switchToHealModeButton);
        // Disable by default
        this.switchToHealModeButton.fullDisable();


        // Starting level text
        let startingLevelTextSettings = menuData["starting_level_text"];
        let startingLevelTextHeight = startingLevelTextSettings["height"];
        let startingLevelTextYOffset = startingLevelTextSettings["y_offset"];
        let startingLevelTextYFunction = (innerHeight) => { return toggleAutomaticSailsButtonYFunction(innerHeight) - toggleButtonYSize - startingLevelTextYOffset; }
        this.startingLevelText = new TextComponent(startingLevelTextSettings["text"], startingLevelTextSettings["text_colour_code"], menuOptionsStartX, startingLevelTextYFunction, startingLevelTextSettings["width"], startingLevelTextHeight);
        this.components.push(this.startingLevelText);

        // Starting level slider
        let startingLevelSliderSettings = menuData["starting_level_slider"];
        let startingLevelSliderYOffset = startingLevelSliderSettings["y_offset"];
        let startingLevelSliderYTextHeight = startingLevelSliderSettings["text_height"];
        let startingLevelSliderYSliderHeight = startingLevelSliderSettings["slider_height"];
        let startingLevelSliderYSize = startingLevelSliderYTextHeight + startingLevelSliderYSliderHeight;
        let startingLevelOptions = [];

        // Populate starting level options
        for (let i = 0; i < MD["saved_models"].length; i++){
            startingLevelOptions.push(i+1);
        }

        let startingLevelYFunction = (innerHeight) => { return startingLevelTextYFunction(innerHeight) - startingLevelTextHeight - startingLevelSliderYOffset; }
        this.startingLevel = startingLevelOptions[0];

        // Starting level Slider
        let startingLevelGetter = () => { return this.getStartingLevel(); }
        let startingLevelSetter = (newStartingLevel) => { this.setStartingLevel(newStartingLevel); }
        //debugger;
        this.startingLevelSlider = new SelectionSlider(menuOptionsStartX, startingLevelYFunction, startingLevelSliderSettings["slider_width"], startingLevelSliderYSliderHeight, startingLevelSliderYTextHeight, startingLevelSliderSettings["slider_cursor_width"], startingLevelGetter, startingLevelSetter, startingLevelOptions, startingLevelSliderSettings["background_colour_code"], startingLevelSliderSettings["slider_colour_code"], startingLevelSliderSettings["text_colour_code"]);
        this.components.push(this.startingLevelSlider);

        this.components.push(new RectangleButton(menuData["start_game_button"]["text"], menuData["start_game_button"]["colour_code"], menuData["start_game_button"]["text_colour_code"], menuOptionsStartX, menuData["start_game_button"]["y_pos_from_bottom"] + menuData["start_game_button"]["height"], menuData["start_game_button"]["width"], menuData["start_game_button"]["height"], (menuInstance) => {
            this.startGame();
        }));
    }
}