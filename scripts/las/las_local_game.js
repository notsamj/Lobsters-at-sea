/*
    TODO: Add NSRequire thing
        registerAllKeybinds
        loadImages
*/
class LasLocalGame extends LasGame {
    constructor(gameProperties){
        super(gameProperties);
        this.seaDisplay = new LASSeaDisplay();
        this.focusedShip = null;
    }

    tick(){
        // TODO: Update ship orientations, power based on decisions
        this.updateShipOrientationAndSailPower();

        // TODO: Move ships based on orientation and sail power
        this.moveShips();

        // Take input from the user
        this.updateShipDecisions();

        // Update wind
        this.wind.tickUpdate();
    }

    moveShips(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.moveOneTick();
        }
    }

    updateShipDecisions(){
        // TODO
        let lrV = 0;
        let pV = 0;
        if (GC.getGameUserInputManager().isActivated("ship_left")){
            lrV = -1;
        }else if (GC.getGameUserInputManager().isActivated("ship_right")){
            lrV = 1;
        }

        if (GC.getGameUserInputManager().isActivated("sails_inc")){
            pV = 1;
        }else if (GC.getGameUserInputManager().isActivated("sails_dec")){
            pV = -1;
        }
        this.focusedShip.updateFromPilot(lrV, pV);
    }

    updateShipOrientationAndSailPower(){
        
        for (let [ship, shipIndex] of this.getShips()){
            ship.updateShipOrientationAndSailPower();
        }
    }

    getFocusedShip(){
        return this.focusedShip;
    }

    setFocusedShip(ship){
        this.focusedShip = ship; 
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

        // Display ships
        for (let [ship, shipIndex] of this.getShips()){
            ship.display(this.getFocusedFrameX(), this.getFocusedFrameY());
        }

        // Display windsock
        this.getWind().display();
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
        let keyCodeZoom18 = MD["default_key_binds"]["zoom_1/8"];
        let keyCodeZoom14 = MD["default_key_binds"]["zoom_1/4"];
        let keyCodeZoom12 = MD["default_key_binds"]["zoom_1/2"];
        let keyCodeZoom1 = MD["default_key_binds"]["zoom_1"];
        let keyCodeZoom2 = MD["default_key_binds"]["zoom_2"];

        // Game controls
        let keyCodeSailsInc = MD["default_key_binds"]["sails_inc"];
        let keyCodeSailsDec = MD["default_key_binds"]["sails_dec"];
        let keyCodeShipLeft = MD["default_key_binds"]["ship_left"];
        let keyCodeShipRight = MD["default_key_binds"]["ship_right"];


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
        inputManager.register("1/8zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom18; }, true);
        inputManager.register("1/8zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom18; }, false);
        inputManager.register("1/4zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom14; }, true);
        inputManager.register("1/4zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom14; }, false);
        inputManager.register("1/2zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom12; }, true);;
        inputManager.register("1/2zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom12; }, false);
        inputManager.register("1zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom1; }, true);
        inputManager.register("1zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom1; }, false);
        inputManager.register("2zoomhold", "keydown", (event) => { return event.keyCode === keyCodeZoom2; }, true);
        inputManager.register("2zoomhold", "keyup", (event) => { return event.keyCode === keyCodeZoom2; }, false);

        inputManager.register("sails_inc", "keydown", (event) => { return event.keyCode === keyCodeSailsInc; }, true);
        inputManager.register("sails_inc", "keyup", (event) => { return event.keyCode === keyCodeSailsInc; }, false);

        inputManager.register("sails_dec", "keydown", (event) => { return event.keyCode === keyCodeSailsDec; }, true);
        inputManager.register("sails_dec", "keyup", (event) => { return event.keyCode === keyCodeSailsDec; }, false);

        inputManager.register("ship_left", "keydown", (event) => { return event.keyCode === keyCodeShipLeft; }, true);
        inputManager.register("ship_left", "keyup", (event) => { return event.keyCode === keyCodeShipLeft; }, false);

        inputManager.register("ship_right", "keydown", (event) => { return event.keyCode === keyCodeShipRight; }, true);
        inputManager.register("ship_right", "keyup", (event) => { return event.keyCode === keyCodeShipRight; }, false);
    }

    static async loadImages(){
        // Load logo
        await GC.loadToImages("logo");

        // Load windsock
        await GC.loadToImages("wind_sock");

        // Load project images
        await GC.getMenuManager().getMenuByName("my_projects_menu").loadImages();
        await GC.getMenuManager().getMenuByName("help_menu").loadImages();

        // Load boat
        await GC.loadToImages("generic_ship_left", "/ships/generic_ship/");
        await GC.loadToImages("generic_ship_down", "/ships/generic_ship/");
        await GC.loadToImages("generic_ship_up", "/ships/generic_ship/");

        console.log("Finished loading game images.")
    }
}