/*
    Class Name: GameContainer
    Class Description: A container for games
*/
class GameContainer {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(gameType, localGameProperties){
        this.gameType = gameType;
        this.localGameProperties = localGameProperties;
        this.activeGameInstance = undefined;

        this.FRAME_COUNTER = new FrameRateCounter(localGameProperties["frame_rate"]);
        this.HUD = new HUD(localGameProperties["hud_json"]);
        this.GAME_TICK_SCHEDULER = new TickScheduler(localGameProperties["tick_rate"]);
        this.GAMEMODE_MANAGER = new GamemodeManager();
        this.GAME_USER_INPUT_MANAGER = new UserInputManager();
        this.MENU_USER_INPUT_MANAGER = new UserInputManager();
        this.SOUND_MANAGER = new SoundManager(localGameProperties["sound_data"]);
        this.LOADING_SCREEN = new LoadingScreen(localGameProperties["loading_screen_data"]);
        this.GAME_CONTAINER_EVENT_HANDLER = new NSEventHandler();
        this.MENU_MANAGER = new MenuManager();
        this.ZOOM_MONITOR = {"button": null, "start_time_ms": null};
        this.IMAGES = {}

        this.gMouseX = 0;
        this.gMouseY = 0;
        this.gLastClickedMouseX = 0;
        this.gLastClickedMouseY = 0;
        this.programOver = false;
        this.setupOngoing = false;
    }

    /*
        Method Name: isMobile
        Method Parameters: None
        Method Description: Checks if the game is running on mobile
        Method Return: boolean
    */
    isMobile(){
        return navigator.maxTouchPoints > 0;
    }

    /*
        Method Name: getSoundManager
        Method Parameters: None
        Method Description: Getter
        Method Return: SoundManager
    */
    getSoundManager(){
        return this.SOUND_MANAGER;
    }

    /*
        Method Name: getGMouseX
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getGMouseX(){
        return this.gMouseX;
    }

    /*
        Method Name: getGMouseY
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getGMouseY(){
        return this.gMouseY;
    }

    /*
        Method Name: getFrameCounter
        Method Parameters: None
        Method Description: Getter
        Method Return: FrameCounter
    */
    getFrameCounter(){
        return this.FRAME_COUNTER;
    }

    /*
        Method Name: getHUD
        Method Parameters: None
        Method Description: Getter
        Method Return: Hud
    */
    getHUD(){
        return this.HUD;
    }

    /*
        Method Name: newGame
        Method Parameters: 
            gameType:
                A class of LasGame
            gamemodeType:
                A class of Gamemode
        Method Description: Starts a new game
        Method Return: void
    */
    newGame(gameType, gamemodeType){
        this.activeGameInstance = new gameType(this.localGameProperties);
        this.GAMEMODE_MANAGER.setActiveGamemode(new gamemodeType());
    }

    /*
        Method Name: getGameInstance
        Method Parameters: None
        Method Description: Getter
        Method Return: LASGame
    */
    getGameInstance(){
        return this.activeGameInstance;
    }

    /*
        Method Name: isInGame
        Method Parameters: None
        Method Description: Checks if a game is running
        Method Return: boolean
    */
    isInGame(){
        return this.GAMEMODE_MANAGER.hasActiveGamemode();
    }

    /*
        Method Name: getLastClickedMouseX
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getLastClickedMouseX(){
        return this.gLastClickedMouseX;
    }
    /*
        Method Name: getLastClickedMouseY
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getLastClickedMouseY(){
        return this.gLastClickedMouseY;
    }

    /*
        Method Name: getLoadingScreen
        Method Parameters: None
        Method Description: Getter
        Method Return: LoadingScreen
    */
    getLoadingScreen(){
        return this.LOADING_SCREEN;
    }

    /*
        Method Name: getImage
        Method Parameters: 
            imageName:
                The requested image
        Method Description: Gets the requested image
        Method Return: Image
    */
    getImage(imageName){
        // Image not found
        if (!this.hasImage(imageName)){
            throw new Error("Image: " + imageName + " not found.");
        }

        let image = this.IMAGES[imageName];

        let imageIsNotLoaded = !(image instanceof HTMLImageElement);

        // If not loaded
        if (imageIsNotLoaded){
            // Check if loading
            let imageIsLoading = image["loading"];

            // Not loading -> Load it
            if (!imageIsLoading){

                // Mark that it's loadingso not down twice
                image["loading"] = true;
                this.loadToImages(image["name"], image["folder_prefix"], image["type"], image["extra_data"]);
            }

            return this.IMAGES["image_loading"];
        }

        // Else, loaded
        return image;
    }

    /*
        Method Name: getLocalGameProperties
        Method Parameters: None
        Method Description: Gets the local game's properties
        Method Return: JSON
    */
    getLocalGameProperties(){
        return this.localGameProperties;
    }

    /*
        Method Name: getGameUserInputManager
        Method Parameters: None
        Method Description: Getter
        Method Return: UserInputManager
    */
    getGameUserInputManager(){
        return this.GAME_USER_INPUT_MANAGER;
    }

    /*
        Method Name: getMenuUserInputManager
        Method Parameters: None
        Method Description: Getter
        Method Return: UserInputManager
    */
    getMenuUserInputManager(){
        return this.MENU_USER_INPUT_MANAGER;
    }

    /*
        Function Name: loadToImages
        Function Parameters: 
            imageName:
                The name of an image
            folderPrefix:
                The folder prefix in images
            type:
                The type of file
            extraData:
                JSON of extra data to submit when needed
        Function Description: Loads an image to the image JSON
        Function Return: Promise (implicit)
    */
    async loadToImages(imageName, folderPrefix="", type=".png", extraData={}){
        let imageFileName = imageName + type;
        if (objectHasKey(extraData, "custom_name")){
            imageName = extraData["custom_name"];
        }
        this.IMAGES[imageName] = await loadLocalImage("images/" + folderPrefix + imageFileName);
    }

    /*
        Function Name: slowLoadToImages
        Function Parameters: 
            imageName:
                The name of an image
            folderPrefix:
                The folder prefix in images
            type:
                The type of file
            extraData:
                JSON of extra data to submit when needed
        Function Description: Loads an image to the image JSON
        Function Return: Promise (implicit)
    */
    slowLoadToImages(imageName, folderPrefix="", type=".png", extraData={}){
        // Store data if needed later
        this.IMAGES[imageName] = {"loading": false, "name": imageName, "folder_prefix": folderPrefix, "type": type, "extra_data": extraData};
    }

    /*
        Method Name: hasImage
        Method Parameters: 
            imageName:
                Name of an image (string)
        Method Description: Checks if an image exists
        Method Return: boolean
    */
    hasImage(imageName){
        return objectHasKey(this.IMAGES, imageName);
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the game container
        Method Return: Promise (implicit)
    */
    async setup(){
        // Indicate taht the setup is ongoing
        this.setupOngoing = true;

        let myClassReference = this;

        // Set up window listeners

        document.addEventListener("pointerdown", (event) => {
            myClassReference.setGMouseX(event.clientX);
            myClassReference.setGMouseY(event.clientY);
        });

        document.addEventListener("pointermove", (event) => {
            myClassReference.setGMouseX(event.clientX);
            myClassReference.setGMouseY(event.clientY);
        });

        document.onclick = (event) => {
            myClassReference.setGLastClickedMouseX(event.clientX);
            myClassReference.setGLastClickedMouseY(event.clientY);
        }

        window.onerror = (event) => {
            myClassReference.setProgramOver(true);
        };

        window.onblur = () => {
            let gameTickScheduler = myClassReference.getGameTickScheduler();
            if (!gameTickScheduler.isPaused()){
                gameTickScheduler.pause();
            }
        }

        window.onfocus = () => {
            let gameTickScheduler = myClassReference.getGameTickScheduler();
            let menuManager = myClassReference.getMenuManager();
            if (gameTickScheduler.isPaused() && !(menuManager.getActiveMenu() != null && menuManager.getActiveMenu().getName() === "pause_menu")){
                gameTickScheduler.unpause();
                myClassReference.getGamemodeManager().handleUnpause();
            }
        }

        // Register all keybinds
        this.gameType.registerAllKeybinds();

        // Disable context menu
        document.getElementById("main_area").addEventListener("contextmenu", (event) => {event.preventDefault()});

        // Create Canvas
        let canvasDOM = document.getElementById("canvas");
        canvasDOM.width = getScreenWidth();
        canvasDOM.height = getScreenHeight();

        // Set global variable drawingContext
        drawingContext = canvasDOM.getContext("2d");

        this.GAME_TICK_SCHEDULER.setStartTime(Date.now());

        // Start loading screen
        requestAnimationFrame(launcherTickHandler);

        // Tell the game to load its images
        await this.gameType.loadImages();

        // Setup menus
        this.MENU_MANAGER.setup();

        // Indicate that setup is over
        this.setupOngoing = false;
    }

    /*
        Method Name: setGMouseX
        Method Parameters: 
            newMouseXValue:
                New mouse x (int)
        Method Description: Setter
        Method Return: void
    */
    setGMouseX(newMouseXValue){
        this.gMouseX = newMouseXValue;
    }

    /*
        Method Name: setGMouseY
        Method Parameters: 
            newMouseYValue:
                New mouse y (int)
        Method Description: Setter
        Method Return: void
    */
    setGMouseY(newMouseYValue){
        this.gMouseY = newMouseYValue;
    }

    /*
        Method Name: setGLastClickedMouseX
        Method Parameters: 
            newMouseXValue:
                New mouse x (int)
        Method Description: Setter
        Method Return: void
    */
    setGLastClickedMouseX(newMouseXValue){
        this.gLastClickedMouseX = newMouseXValue;
    }

    /*
        Method Name: setGLastClickedMouseY
        Method Parameters: 
            newMouseYValue:
                New mouse y (int)
        Method Description: Setter
        Method Return: void
    */
    setGLastClickedMouseY(newMouseYValue){
        this.gLastClickedMouseY = newMouseYValue;
    }

    /*
        Method Name: setProgramOver
        Method Parameters: 
            booleanValue:
                Specifies if program is over
        Method Description: Setter
        Method Return: void
    */
    setProgramOver(booleanValue){
        this.programOver = booleanValue;
    }

    /*
        Method Name: getGameTickScheduler
        Method Parameters: None
        Method Description: Getter
        Method Return: TickScheduler
    */
    getGameTickScheduler(){
        return this.GAME_TICK_SCHEDULER;
    }

    /*
        Method Name: getMenuManager
        Method Parameters: None
        Method Description: Getter
        Method Return: MenuManager
    */
    getMenuManager(){
        return this.MENU_MANAGER;
    }

    /*
        Method Name: getGamemodeManager
        Method Parameters: None
        Method Description: Getter
        Method Return: GamemodeManager
    */
    getGamemodeManager(){
        return this.GAMEMODE_MANAGER;
    }

    /*
        Method Name: getActiveGamemode
        Method Parameters: None
        Method Description: Gets the active gamemode
        Method Return: Gamemode
    */
    getActiveGamemode(){
        return this.GAMEMODE_MANAGER.getActiveGamemode();
    }

    /*
        Method Name: setGameZoom
        Method Parameters: None
        Method Description: Changes the game zoom
        Method Return: void
    */
    setGameZoom(){
        let buttonCount = 0;
        let eighth = this.GAME_USER_INPUT_MANAGER.isActivated("1/8zoomhold");
        let quarter = this.GAME_USER_INPUT_MANAGER.isActivated("1/4zoomhold");
        let half = this.GAME_USER_INPUT_MANAGER.isActivated("1/2zoomhold");
        let whole = this.GAME_USER_INPUT_MANAGER.isActivated("1zoomhold");
        let two = this.GAME_USER_INPUT_MANAGER.isActivated("2zoomhold");

        buttonCount += eighth ? 1 : 0;
        buttonCount += quarter ? 1 : 0;
        buttonCount += half ? 1 : 0;
        buttonCount += whole ? 1 : 0;
        buttonCount += two ? 1 : 0;
        // Anything other than 1 is treated the same
        if (buttonCount != 1){
            // Ignore if button is null
            if (this.ZOOM_MONITOR["button"] == null){ return; }
            let timePassed = Date.now() - this.ZOOM_MONITOR["start_time_ms"];
            // If the button was pressed for a short amount of time then switch gamezoom to recorded
            if (timePassed < this.getLocalGameProperties()["approximate_zoom_peek_time_ms"]){
                this.getLocalGameProperties()["game_zoom"] = gameZoom;
            }else{ // If not taking the button then reset zoom
                gameZoom = this.getLocalGameProperties();
            }
            // Reset zoom monitor
            this.ZOOM_MONITOR["button"] = null;
        }else{ // 1 button pressed
            let pressedButton;
            // Determine which button
            if (eighth){
                pressedButton = 1/8;
            }else if (quarter){
                pressedButton = 1/4;
            }else if (half){
                pressedButton = 1/2;
            }else if (whole){
                pressedButton = 1;
            }else{ // two
                pressedButton = 2;
            }
            // If changed which 1 button is pressed
            if (this.ZOOM_MONITOR["button"] != pressedButton){
                this.ZOOM_MONITOR["button"] = pressedButton;
                this.ZOOM_MONITOR["start_time_ms"] = Date.now();
                gameZoom = pressedButton;
            }
        }
    }

    /*
        Function Name: draw
        Function Parameters: None
        Function Description: Draws things on the canvas
        Function Return: void
    */
    draw() {
        // Temporary white background
        noStrokeRectangle(Colour.fromCode("#ffffff"), 0, 0, getScreenWidth(), getScreenHeight());
        this.GAMEMODE_MANAGER.display();
        this.MENU_MANAGER.display();
    }

    /*
        Function Name: stop
        Function Parameters: None
        Function Description: Stops ticks
        Function Return: void
    */
    stop(){
        console.log("stop called")
        this.programOver = true;
    }

    /*
        Function Name: displayLoading
        Function Parameters: None
        Function Description: Runs a tick
        Function Return: Promise (implicit)
    */
    displayLoading(){
        this.LOADING_SCREEN.display(true);
        let sW = getScreenWidth();
        let sH = getScreenHeight();
        let cX = Math.ceil(sW/2);
        let cY = Math.ceil(sH/2);
        Menu.makeText("Loading...", "#000000", cX, cY, sW, sH, "center", "middle");
    }

    /*
        Function Name: tick
        Function Parameters: None
        Function Description: Runs a tick
        Function Return: Promise (implicit)
    */
    async tick(){
        // Display loading screen
        if (this.setupOngoing){
            this.displayLoading();
            // Don't speed it up too much
            await sleep(this.getLocalGameProperties()["ms_between_ticks_floor"]);
            requestAnimationFrame(launcherTickHandler);
            return;
        }
        if (this.programOver){ return; }
        if (this.GAME_TICK_SCHEDULER.getTickLock().notReady()){ 
            requestAnimationFrame(launcherTickHandler);
            return; 
        }

        // Tick the menu manager
        await this.MENU_MANAGER.tick();

        // Tick the GAME_USER_INPUT_MANAGER
        this.MENU_USER_INPUT_MANAGER.tick();

        let expectedTicks = this.GAME_TICK_SCHEDULER.getExpectedNumberOfTicksPassed();
        let tickDifference = expectedTicks - this.GAME_TICK_SCHEDULER.getNumTicks()

        // If ready for a tick then execute
        if (tickDifference > 0 && !this.GAME_TICK_SCHEDULER.isPaused()){
            // Destroy extra ticks
            if (tickDifference > 1){
                let ticksToDestroy = tickDifference - 1;
                this.GAME_TICK_SCHEDULER.addTimeDebt(this.getLocalGameProperties()["ms_between_ticks"] * ticksToDestroy);
            }

            this.GAME_TICK_SCHEDULER.getTickLock().lock()

            // Tick the game mode
            await this.GAMEMODE_MANAGER.tick();

            // Tick the GAME_USER_INPUT_MANAGER
            this.GAME_USER_INPUT_MANAGER.tick();

            // Count the tick
            this.GAME_TICK_SCHEDULER.countTick();
            this.GAME_TICK_SCHEDULER.getTickLock().unlock();
        }

         // Once within main tick lock, set zoom
        this.setGameZoom();

        // Draw a frame
        if (this.FRAME_COUNTER.ready()){
            this.FRAME_COUNTER.countFrame();
            let canvas = document.getElementById("canvas");
            // Update Canvas size if applicable
            if (getScreenWidth() != canvas.width || getScreenHeight() != canvas.height){
                canvas.width = getScreenWidth();
                canvas.height = getScreenHeight();
            }
            this.draw();
        }

        requestAnimationFrame(launcherTickHandler);
    }
}