/*
    TODO: Add NSRequire thing
        registerAllKeybinds
        loadImages
*/
class LasLocalGame extends LasGame {
    constructor(){
        super();
        this.seaDisplay = new LASSeaDisplay();
        this.focusedShip = null;
    }

    tick(){
        // TODO: Update ship orientations, power based on decisions

        // TODO: Move ships based on orientation and sail power


        updateShipDecisions();

        // Update wind
        this.wind.update();
    }

    getFocusedShip(){
        return this.focusedShip;
    }

    hasFocusedShip(){
        return this.getFocusedShip() != null;
    }

    getFocusedFrameX(){
        if (!this.hasFocusedShip()){
            return 0; // default to 0
        }
        return this.focusedShip.getFrameX();
    }

    getFocusedFrameY(){
        if (!this.hasFocusedShip()){
            return 0; // default to 0
        }
        return this.focusedShip.getFrameY();
    }

    reset(){
        super.reset();
    }

    display(){
        // Display the seas
        this.seaDisplay.display(this.getFocusedFrameX(), this.getFocusedFrameY());
    }

    static registerAllKeybinds(){
        /* TODO: List out all keybinds
            get value from DEFAULT_KEY_BIND in main_data_json
            modify keybind if a local storage data value exists for that keybind
            register
        */

        // Read default values
        let keyCodeLeftClick = MD["default_key_binds"]["left_click_ticked"];

        let keyCodeScrollL = MD["default_key_binds"]["scroll_left"];
        let keyCodeScrollR = MD["default_key_binds"]["scroll_right"];
        let keyCodeAccessHelp = MD["default_key_binds"]["help_access_ticked"];
        let keyCodePressEscape = MD["default_key_binds"]["escape_ticked"];
        let zoom18 = MD["default_key_binds"]["zoom_1/8"];
        let zoom14 = MD["default_key_binds"]["zoom_1/4"];
        let zoom12 = MD["default_key_binds"]["zoom_1/2"];
        let zoom1 = MD["default_key_binds"]["zoom_1"];
        let zoom2 = MD["default_key_binds"]["zoom_2"];


        // TODO: Read modified keybinds

        // Register
        let inputManager = GC.getGameUserInputManager();

        // Click
        inputManager.register("left_click_ticked", "click", (event) => { return event.which===keyCodeLeftClick; }, true, {"ticked": true, "ticked_activation": false});

        // Keys
        inputManager.register("scroll_left_ticked", "keydown", (event) => { return event.which===keyCodeScrollL; }, true, {"ticked": true, "ticked_activation": false});
        inputManager.register("scroll_right_ticked", "keydown", (event) => { return event.which===keyCodeScrollR; }, true, {"ticked": true, "ticked_activation": false});
        inputManager.register("help_access_ticked", "keydown", (event) => { return event.keyCode===keyCodeAccessHelp; }, true, {"ticked": true, "ticked_activation": false});
        inputManager.register("escape_ticked", "keydown", (event) => { return event.keyCode===keyCodePressEscape; }, true, {"ticked": true, "ticked_activation": false});
        inputManager.register("1/8zoomhold", "keydown", (event) => { return event.keyCode === zoom18; }, true);
        inputManager.register("1/8zoomhold", "keyup", (event) => { return event.keyCode === zoom18; }, false);
        inputManager.register("1/4zoomhold", "keydown", (event) => { return event.keyCode === zoom14; }, true);
        inputManager.register("1/4zoomhold", "keyup", (event) => { return event.keyCode === zoom14; }, false);
        inputManager.register("1/2zoomhold", "keydown", (event) => { return event.keyCode === zoom12; }, true);;
        inputManager.register("1/2zoomhold", "keyup", (event) => { return event.keyCode === zoom12; }, false);
        inputManager.register("1zoomhold", "keydown", (event) => { return event.keyCode === zoom1; }, true);
        inputManager.register("1zoomhold", "keyup", (event) => { return event.keyCode === zoom1; }, false);
        inputManager.register("2zoomhold", "keydown", (event) => { return event.keyCode === zoom2; }, true);
        inputManager.register("2zoomhold", "keyup", (event) => { return event.keyCode === zoom2; }, false);
    }

    static async loadImages(){
        // Load logo
        await GC.loadToImages("logo");

        // Load project images
        await GC.getMenuManager().getMenuByName("my_projects_menu").loadImages();
        await GC.getMenuManager().getMenuByName("help_menu").loadImages();

        // Load boat
        await GC.loadToImages("generic_ship_left");
        await GC.loadToImages("generic_ship_up");

        console.log("Finished loading game images.")
    }
}