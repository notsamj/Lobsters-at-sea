/*
    Class Name: SkirmishMenu
    Description: The menu for the skirmish gamemode
*/
class SkirmishMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("skirmish_menu");
        // Declare
        this.characterImage = undefined;

        this.switchToManualButton = undefined;
        this.switchToAutomaticButton = undefined;

        this.botShipCountText = undefined;
        this.botShipCountSlider = undefined;

        this.botShipModelText = undefined;
        this.botShipModelSlider = undefined;

        this.botShipCount = undefined;
        this.botShipModel = undefined;    
    }

    /*
        Method Name: startGame
        Method Parameters: None
        Method Description: Starts the duel game
        Method Return: void
    */
    startGame(){
        let modifiedSetupJSON = copyObject(MD["skirmish"]["default_setup_json"]);

        // Modify
        modifiedSetupJSON["bot_model"] = this.getBotShipModel();
        modifiedSetupJSON["bot_count"] = this.getBotShipCount();
        modifiedSetupJSON["user_is_a_ship"] = this.characterImage.getImageName() != "freecam";
        modifiedSetupJSON["user_automatic_sails"] = this.automaticSails;

        GC.newGame(LasLocalGame, Skirmish);
        GC.getActiveGamemode().startUp(modifiedSetupJSON);
        GC.getMenuManager().switchTo("game");
    }

    /*
        Method Name: getBotShipCount
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getBotShipCount(){
        return this.botShipCount;
    }

    /*
        Method Name: setBotShipCount
        Method Parameters: 
            newBotShipCount:
                The number of bot ships
        Method Description: Setter
        Method Return: void
    */
    setBotShipCount(newBotShipCount){
        this.botShipCount = newBotShipCount;
    }

    /*
        Method Name: getBotShipModel
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getBotShipModel(){
        return this.botShipModel;
    }

    /*
        Method Name: setBotShipModel
        Method Parameters: 
            newBotShipModel:
                New ship model (string)
        Method Description: Setter
        Method Return: void
    */
    setBotShipModel(newBotShipModel){
        this.botShipModel = newBotShipModel;
    }


    /*
        Method Name: toggleAutomaticSails
        Method Parameters: None
        Method Description: Toggles automatic sails for the user
        Method Return: void
    */
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

    /*
        Method Name: onUserTypeChange
        Method Parameters: None
        Method Description: Handles actions on user type change
        Method Return: void
    */
    onUserTypeChange(){
        // Handle button
        if (this.characterImage.getImageName() === "freecam"){
            this.switchToAutomaticButton.fullDisable();
            this.switchToManualButton.fullDisable();

            this.botShipCountSlider.setMaxValue(MD["ship_colours"].length);
        }else{
            if (this.automaticSails){
                this.switchToAutomaticButton.fullDisable();
                this.switchToManualButton.fullEnable();
            }else{
                this.switchToAutomaticButton.fullEnable();
                this.switchToManualButton.fullDisable();
            }
            this.botShipCountSlider.setMaxValue(MD["ship_colours"].length -1);
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

        let menuData = MSD["skirmish_menu"];

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
            this.onUserTypeChange();
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

        // bot ship count text
        let botShipCountTextSettings = menuData["bot_ship_count_text"];
        let botShipCountTextHeight = botShipCountTextSettings["height"];
        let botShipCountTextYOffset = botShipCountTextSettings["y_offset"];
        let botShipCountTextYFunction = (innerHeight) => { return toggleAutomaticSailsButtonYFunction(innerHeight) - toggleButtonYSize - botShipCountTextYOffset; }
        this.botShipCountText = new TextComponent(botShipCountTextSettings["text"], botShipCountTextSettings["text_colour_code"], menuOptionsStartX, botShipCountTextYFunction, botShipCountTextSettings["width"], botShipCountTextHeight);
        this.components.push(this.botShipCountText);

        // bot ship count slider
        let botShipCountSliderSettings = menuData["bot_ship_count_slider"];
        let botShipCountSliderYOffset = botShipCountSliderSettings["y_offset"];
        let botShipCountSliderYTextHeight = botShipCountSliderSettings["text_height"];
        let botShipCountSliderYSliderHeight = botShipCountSliderSettings["slider_height"];
        let botShipCountSliderYSize = botShipCountSliderYTextHeight + botShipCountSliderYSliderHeight;
        let maxColours = MD["ship_colours"].length;

        // Character is taking a colour
        if (this.characterImage.getImageName() != "freecam"){
            maxColours -= 1;
        }

        let botShipCountYFunction = (innerHeight) => { return botShipCountTextYFunction(innerHeight) - botShipCountTextHeight - botShipCountSliderYOffset; }

        // Bot ship count slider
        let botShipCountGetter = () => { return this.getBotShipCount(); }
        let botShipCountSetter = (newBotShipCount) => { this.setBotShipCount(newBotShipCount); }
        
        // Set default value
        this.botShipCount = 1;

        this.botShipCountSlider = new QuantitySlider(menuOptionsStartX, botShipCountYFunction, botShipCountSliderSettings["slider_width"], botShipCountSliderYSliderHeight, botShipCountSliderYTextHeight, botShipCountSliderSettings["slider_cursor_width"], botShipCountGetter, botShipCountSetter, 0, maxColours, false, botShipCountSliderSettings["background_colour_code"], botShipCountSliderSettings["slider_colour_code"], botShipCountSliderSettings["text_colour_code"]);
        this.components.push(this.botShipCountSlider);

        // bot ship model text
        let botShipModelTextSettings = menuData["bot_ship_model_text"];
        let botShipModelTextHeight = botShipCountTextSettings["height"];
        let botShipModelTextYOffset = botShipCountTextSettings["y_offset"];
        let botShipModelTextYFunction = (innerHeight) => { return botShipCountYFunction(innerHeight) - botShipCountSliderYTextHeight - botShipCountSliderYSliderHeight - botShipModelTextYOffset; }
        this.botShipModelText = new TextComponent(botShipModelTextSettings["text"], botShipModelTextSettings["text_colour_code"], menuOptionsStartX, botShipModelTextYFunction, botShipModelTextSettings["width"], botShipModelTextHeight);
        this.components.push(this.botShipModelText);

        // bot ship model slider
        let botShipModelSliderSettings = menuData["bot_ship_model_slider"];
        let botShipModelSliderYOffset = botShipModelSliderSettings["y_offset"];
        let botShipModelSliderYTextHeight = botShipModelSliderSettings["text_height"];
        let botShipModelSliderYSliderHeight = botShipModelSliderSettings["slider_height"];
        let botShipModelSliderYSize = botShipModelSliderYTextHeight + botShipModelSliderYSliderHeight;

        let botShipModelYFunction = (innerHeight) => { return botShipModelTextYFunction(innerHeight) - botShipModelTextHeight - botShipModelSliderYOffset; }

        // Bot ship model slider
        let botShipModelGetter = () => { return this.getBotShipModel(); }
        let botShipModelSetter = (newBotShipModel) => { this.setBotShipModel(newBotShipModel); }
        
        // Set default value
        this.botShipModel = MD["saved_models"][0]["model_name"];

        let botShipModelOptions = [];
        for (let i = MD["saved_models"].length - 1; i >= 0; i--){
            botShipModelOptions.push(MD["saved_models"][i]["model_name"]);
        }

        this.botShipModelSlider = new SelectionSlider(menuOptionsStartX, botShipModelYFunction, botShipModelSliderSettings["slider_width"], botShipModelSliderYSliderHeight, botShipModelSliderYTextHeight, botShipModelSliderSettings["slider_cursor_width"], botShipModelGetter, botShipModelSetter, botShipModelOptions, botShipModelSliderSettings["background_colour_code"], botShipModelSliderSettings["slider_colour_code"], botShipModelSliderSettings["text_colour_code"]);
        this.components.push(this.botShipModelSlider);

        this.components.push(new RectangleButton(menuData["start_game_button"]["text"], menuData["start_game_button"]["colour_code"], menuData["start_game_button"]["text_colour_code"], menuOptionsStartX, menuData["start_game_button"]["y_pos_from_bottom"] + menuData["start_game_button"]["height"], menuData["start_game_button"]["width"], menuData["start_game_button"]["height"], (menuInstance) => {
            this.startGame();
        }));


    }
}