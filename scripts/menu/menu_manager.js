/*
    Class Name: MenuManager
    Description: A helper class for menus
*/
class MenuManager {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.secondaryMenus = [];
        this.mainMenu = new MainMenu();
        this.helpMenu = new HelpMenu();
        this.pauseMenu = new PauseMenu();
    }

    /*
        Method Name: getActiveMenu
        Method Parameters: None
        Method Description: Getter
        Method Return: Menu or null
    */
    getActiveMenu(){
        return this.activeMenu;
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the menu manager
        Method Return: void
    */
    setup(){
        this.activeMenu = this.mainMenu;
        this.mainMenu.setup();
        this.helpMenu.setup();
        this.pauseMenu.setup();
        this.temporaryMessages = new NotSamLinkedList();
        for (let secondaryMenu of this.secondaryMenus){
            secondaryMenu.setup();
        }
    }

    /*
        Method Name: registerMenu
        Method Parameters: 
            menuInstance:
                A menu instance
        Method Description: Registers a secondary menu
        Method Return: void
    */
    registerMenu(menuInstance){
        this.secondaryMenus.push(menuInstance);
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Determine the width of the screen
        Method Return: void
    */
    getWidth(){
        return getScreenWidth();
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Determine the height of the screen
        Method Return: void
    */
    getHeight(){
        return getScreenHeight();
    }

    /*
        Method Name: hasActiveMenu
        Method Parameters: None
        Method Description: Determine if there is an active menu displayed
        Method Return: Boolean
    */
    hasActiveMenu(){
        return this.activeMenu != null;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Display the active menu on the screen and temporary messages
        Method Return: void
    */
    display(){
        if (!this.hasActiveMenu()){ return; }

        // Dispaly the menu
        this.activeMenu.display();

        // Display all temporary messages
        for (let [temporaryMessage, messageIndex] of this.temporaryMessages){
            temporaryMessage.display();
        }

        this.temporaryMessages.deleteWithCondition((temporaryMessage) => { return temporaryMessage.isExpired(); });
    }

    /*
        Method Name: click
        Method Parameters: 
            screenX:
                x location (in screen coordinates) of a click
            screenY:
                y location (in screen coordinates) of a click
        Method Description: Handles the event of a user click
        Method Return: void
    */
    click(screenX, screenY){
        if (!this.hasActiveMenu()){ return; }
        this.activeMenu.click(screenX, this.changeFromScreenY(screenY));
    }

    /*
        Method Name: changeFromScreenY
        Method Parameters: 
            y:
                y coordinate in screen coordinate system
        Method Description: Converts a screen y to a game y
        Method Return: int
    */
    changeFromScreenY(y){
        return this.getHeight() - y;
    }

    /*
        Method Name: changeToScreenY
        Method Parameters: 
            y:
                y coordinate in game coordinate system
        Method Description: Converts a game y to a screen y
        Method Return: int
    */
    changeToScreenY(y){ return this.changeFromScreenY(y); }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles tick user actions
        Method Return: void
    */
    tick(){
        let leftClick = GC.getGameUserInputManager().isActivated("left_click_ticked");
        if (leftClick){
            this.click(GC.getLastClickedMouseX(), GC.getLastClickedMouseY());
        }

        let escape = GC.getGameUserInputManager().isActivated("escape_ticked");
        if (escape){
            this.escapeKey();
        }

        let help = GC.getGameUserInputManager().isActivated("help_access_ticked");
        if (help){
            this.helpKey();
        }

        if (this.hasActiveMenu()){
            // Tick active menu
            this.activeMenu.tick();
        }

    }

    /*
        Method Name: helpKey
        Method Parameters: None
        Method Description: Takes actions when the help key is pressed
        Method Return: void
    */
    helpKey(){
        if (this.activeMenu.getName() === this.helpMenu.getName()){
            this.helpMenu.returnToOrigin();
        }else{
            this.switchTo(this.helpMenu.getName());
        }
    }

    /*
        Method Name: lostFocus
        Method Parameters: None
        Method Description: Called when focus is lost and launches the pause menu
        Method Return: void
    */
    lostFocus(){
        if (!this.hasActiveMenu()){
            this.switchTo(this.pauseMenu.getName());
        }
    }

    /*
        Method Name: escapeKey
        Method Parameters: None
        Method Description: Called when escape key is pressed and launches the pause menu (or gets away from it)
        Method Return: void
    */
    escapeKey(){
        if (this.activeMenu === this.pauseMenu){
            this.switchTo("game");
        }else if (!this.hasActiveMenu()){
            this.switchTo(this.pauseMenu.getName());
        }
    }

    /*
        Method Name: switchTo
        Method Parameters: 
            newMenuName:
                String, name of new menu
        Method Description: Switches to desired menu
        Method Return: void
    */
    switchTo(newMenuName){
        let enableCursor = true;
        if (newMenuName === this.mainMenu.getName()){
            this.activeMenu = this.mainMenu;
        }else if (newMenuName === this.pauseMenu.getName()){
            if (!GC.getGameTickScheduler().isPaused()){
                GC.getGameTickScheduler().pause();
            }
            this.activeMenu = this.pauseMenu;
        }else if (newMenuName === this.helpMenu.getName()){
            if (!GC.getGameTickScheduler().isPaused()){
                GC.getGameTickScheduler().pause();
            }
            this.helpMenu.setOrigin(this.activeMenu);
            this.activeMenu = this.helpMenu;
        }else if (newMenuName === "game"){
            if (GC.getGameTickScheduler().isPaused()){
                GC.getGameTickScheduler().unpause();
                GC.getGamemodeManager().handleUnpause();
            }
            // Maybe enable the cursor
            enableCursor = MD["game_properties"]["cursor_enabled"];
            this.activeMenu = null;
        }
        // Try switching to a secondary menu with this name
        else if (this.switchToSecondary(newMenuName)){
            // If switched -> do nothing
        }
        // Else no menu and enable cursor
        else{
            throw new Error("Unknown menu: " + newMenuName);
        }
        document.getElementById("canvas").style.cursor = (enableCursor ? "" : "none");

        // If not the game then inform that it's switched
        if (newMenuName != "game"){
            this.activeMenu.informSwitchedTo();
        }
    }

    /*
        Method Name: switchToMenu
        Method Parameters: 
            menu:
                The new menu instance
        Method Description: Switches to the new menu
        Method Return: void
    */
    switchToMenu(menu){
        if (menu === null){
            this.switchTo("game");
        }else{
            this.switchTo(menu.getName());
        }
    }

    /*
        Method Name: switchToSecondary
        Method Parameters: 
            secondaryMenuName:
                The name of the secondary menu. String
        Method Description: Switches to a secondary menu
        Method Return: boolean, true -> found the secondary menu, false -> did not find it
    */
    switchToSecondary(secondaryMenuName){
        let secondaryMenu = this.getMenuByName(secondaryMenuName);
        if (secondaryMenu != null){
            this.activeMenu = secondaryMenu;
        }
        return secondaryMenu != null;
    }

    /*
        Method Name: getMenuByName
        Method Parameters: 
            menuName:
                String, name of menu
        Method Description: Gets a menu instance by its name
        Method Return: Menu
    */
    getMenuByName(menuName){
        if (menuName === this.mainMenu.getName()){
            return this.mainMenu;
        }else if (menuName === this.pauseMenu.getName()){
            return this.pauseMenu;
        }else if (menuName === this.helpMenu.getName()){
            return this.helpMenu;
        }
        // Check secondary menus
        for (let secondaryMenu of this.secondaryMenus){
            if (secondaryMenu.getName() === menuName){
                return secondaryMenu;
            }
        }
        // Else
        return null;
    }

    /*
        Method Name: addTemporaryMessage
        Method Parameters:
            message:
                A message to show on the screen
            colour:
                Colour of the temporary message
            timeMS:
                The time that the message appears on screen
        Method Description: Adds a temporary message onto the screen
        Method Return: void
    */
    addTemporaryMessage(message, colour, timeMS=Infinity){
        this.temporaryMessages.add(new TemporaryMessage(message, colour, timeMS));
    }
}

/*
    Class Name: TemporaryMessage
    Description: A temporary message that pops up on the screen
*/
class TemporaryMessage {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(message, colour, timeMS){
        this.message = message;
        this.colour = colour;
        this.expiryLock = new CooldownLock(timeMS);
        this.expiryLock.lock();
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the message on the screen
        Method Return: void
    */
    display(){
        Menu.makeText(this.message, this.colour, 0, getScreenHeight(), getScreenWidth(), getScreenHeight(), "center", "middle");
    }

    /*
        Method Name: isExpired
        Method Parameters: None
        Method Description: Checks if the message is expired
        Method Return: Boolean
    */
    isExpired(){
        return this.expiryLock.isReady();
    }
}