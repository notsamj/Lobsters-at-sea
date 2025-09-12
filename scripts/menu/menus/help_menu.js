/*
    Class Name: HelpMenu
    Description: The help menu
*/
class HelpMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super("help_menu");
        this.origin = undefined; // Note: expect overwritten before used
        this.leftArrow = undefined;
        this.rightArrow = undefined;
        this.numberOfSlidesText = undefined;
        this.helpImage = undefined;

        this.imageNames = undefined;
        this.currentImageIndex = 0;
    }

    /*
        Method Name: slowLoadImages
        Method Parameters: None
        Method Description: Loads the images related to help
        Method Return: Promise (implicit)
    */
    slowLoadImages(){
        let imageJSON = MSD["help_menu"]["help_image"]["images"];
        let folderURL = "help/";
        for (let helpScreenName of Object.keys(imageJSON)){
            for (let imageName of imageJSON[helpScreenName]){
                // Do not load if already exists
                if (GC.hasImage(imageName)){ continue; }
                GC.slowLoadToImages(imageName, folderURL + helpScreenName + "/");
            }
        }
    }

    /*
        Method Name: setOrigin
        Method Parameters: 
            originMenu:
                The menu that directed to the help menu (or null)
        Method Description: Sets the origin point for the help menu
        Method Return: void
    */
    setOrigin(originMenu){
        this.origin = originMenu;
    }

    /*
        Method Name: informSwitchedTo
        Method Parameters: None
        Method Description: Informs the menu that it has been switched to
        Method Return: void
    */
    informSwitchedTo(){
        let helpMenuName;
        if (this.origin != null){
            helpMenuName = this.origin.getName();
        }else{
            helpMenuName = GC.getGamemodeManager().getActiveGameName();
        }
        if (helpMenuName === null){
            helpMenuName = "default";
        }
        this.setUpHelpMenu(helpMenuName);
    }

    /*
        Method Name: setUpHelpMenu
        Method Parameters: 
            helpMenuName:
                The kind of help that is looked for (String)
        Method Description: Sets up the help menu
        Method Return: void
    */
    setUpHelpMenu(helpMenuName){
        let availableMenuJSON = MSD["help_menu"]["help_image"]["images"];
        // If there is no help then go to default
        if (!objectHasKey(availableMenuJSON, helpMenuName)){
            helpMenuName = "default";
        }

        this.imageNames = availableMenuJSON[helpMenuName];

        this.currentImageIndex = 0;
        this.checkDisableArrowButtons();
        this.updateNOSText();
        this.updateImage();
    }

    /*
        Method Name: updateImage
        Method Parameters: None
        Method Description: Updates the help image
        Method Return: void
    */
    updateImage(){
        this.helpImage.setImageName(this.imageNames[this.currentImageIndex]);
    }

    /*
        Method Name: returnToOrigin
        Method Parameters: None
        Method Description: Returns to the origin
        Method Return: void
    */
    returnToOrigin(){
        GC.getMenuManager().switchToMenu(this.origin);
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the help menus
        Method Return: void
    */
    setup(){
        // Background
        this.components.push(new LoadingScreenComponent(false));

        let menuData = MSD["help_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonYOffset = menuDataBackButton["y_offset"];
        let backButtonY = (innerHeight) => { return innerHeight-backButtonYOffset; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        let backButtonX = menuDataBackButton["x"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], backButtonX, backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            this.returnToOrigin();
        }));

        let menuDataArrowButtons = menuData["arrow_buttons"];
        let arrowXOffset = menuDataArrowButtons["x_offset"];
        let arrowYOffset = menuDataArrowButtons["y_offset"];
        let arrowButtonXSize = menuDataArrowButtons["x_size"];
        let arrowButtonYSize = menuDataArrowButtons["y_size"];
        let leftArrowXFunction = (screenWidth) => {
            return Math.min(arrowXOffset, screenWidth);
        }
        let arrowYFunction = (screenHeight) => {
            return Math.min(screenHeight - arrowButtonYSize, arrowYOffset + arrowButtonYSize);
        }
        let rightArrowXFunction = (screenWidth) => {
            return Math.max(0, screenWidth - arrowXOffset - arrowButtonXSize);
        }

        // Left arrow
        this.leftArrow = new RectangleButton("<-", menuDataArrowButtons["colour_code"], menuDataArrowButtons["text_colour_code"], leftArrowXFunction, arrowYFunction, arrowButtonXSize, arrowButtonYSize, (instance) => {
            this.slide(-1);
        })
        this.components.push(this.leftArrow);

        // Right arrow
        this.rightArrow = new RectangleButton("->", menuDataArrowButtons["colour_code"], menuDataArrowButtons["text_colour_code"], rightArrowXFunction, arrowYFunction, arrowButtonXSize, arrowButtonYSize, (instance) => {
            this.slide(1);
        })
        this.components.push(this.rightArrow);

        // Help image
        let menuDataHelpImage = menuData["help_image"];
        let minHelpImageXSize = menuDataHelpImage["min_x_size"];
        let minHelpImageYSize = menuDataHelpImage["min_y_size"];
        let helpImageXFunction = (screenWidth, helpImageXSize) => {
            if (screenWidth < helpImageXSize){
                return 0;
            }
            return Math.floor((screenWidth - helpImageXSize)/2);
        }
        let helpImageYFunction = (screenHeight, helpImageYSize) => {
            if (screenHeight < helpImageYSize){
                return 0;
            }
            return screenHeight - Math.floor((screenHeight - helpImageYSize)/2)
        }

        let helpImageXSizeFunction = (screenWidth) => {
            let calculatedXSize = screenWidth - arrowButtonXSize * 2 - arrowXOffset * 2;
            return Math.max(minHelpImageXSize, calculatedXSize);
        }

        let helpImageYSizeFunction = (screenHeight) => {
            let calculatedYSize = screenHeight - backButtonYSize - backButtonYOffset - arrowYOffset - arrowButtonYSize;
            return Math.max(minHelpImageYSize, calculatedYSize);
        }

        this.helpImage = new StaticImage(null, helpImageXFunction, helpImageYFunction, helpImageXSizeFunction, helpImageYSizeFunction);
        this.components.push(this.helpImage);

        // Text about number of images
        let numberOfSlidesData = menuData["slide_info_text"];
        let nOSXSize = numberOfSlidesData["x_size"];
        let nOSYSize = numberOfSlidesData["y_size"];
        let nOSYOffset = numberOfSlidesData["y_offset"];

        let nOSXFunction = (screenWidth) => {
            return Math.max(0, screenWidth - arrowXOffset - arrowButtonXSize);
        }

        let nOSYFunction = (screenHeight) => {
            return Math.min(screenHeight - nOSYSize, nOSYOffset + arrowYOffset + nOSYSize + arrowButtonYSize);
        }

        this.numberOfSlidesText = new TextComponent("1/1", numberOfSlidesData["text_colour_code"], nOSXFunction, nOSYFunction, nOSXSize, nOSYSize);
        this.components.push(this.numberOfSlidesText);

        this.setUpHelpMenu("default");
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Checks for user actions
        Method Return: void
    */
    tick(){
        if (GC.getMenuUserInputManager().isActivated("scroll_left_ticked")){
            this.slide(-1);
        }else if (GC.getMenuUserInputManager().isActivated("scroll_right_ticked")){
            this.slide(1);
        }
        super.tick();
    }

    /*
        Method Name: slide
        Method Parameters: 
            direction:
                direction to slide in. int
        Method Description: Slides the images in a direction
        Method Return: void
    */
    slide(direction){
        let newIndex = this.currentImageIndex + direction;
        // Ignore invalid indices (shouldn't happen anyway)
        if (newIndex < 0 || newIndex > this.imageNames.length - 1){
            return;
        }
        this.currentImageIndex = newIndex;
        this.checkDisableArrowButtons();
        this.updateNOSText();
        this.updateImage();
    }

    /*
        Method Name: updateNOSText
        Method Parameters: None
        Method Description: Updates the text displaying the number of slides
        Method Return: void
    */
    updateNOSText(){
        this.numberOfSlidesText.setText((this.currentImageIndex + 1).toString() + "/" + this.imageNames.length);
    }

    /*
        Method Name: checkDisableArrowButtons
        Method Parameters: None
        Method Description: Checks if the arrow button should be disabled
        Method Return: void
    */
    checkDisableArrowButtons(){
        let enabledColourCode = MSD["help_menu"]["arrow_buttons"]["colour_code"];
        let disabledColourCode = MSD["help_menu"]["arrow_buttons"]["disabled_colour_code"];
        // Left arrow
        if (this.currentImageIndex === 0 && this.leftArrow.isEnabled()){
            this.leftArrow.disable();
            this.leftArrow.setColourCode(disabledColourCode);
        }else if (this.currentImageIndex != 0 && this.leftArrow.isDisabled()){
            this.leftArrow.enable();
            this.leftArrow.setColourCode(enabledColourCode);
        }

        // Right arrow
        if (this.currentImageIndex === this.imageNames.length - 1 && this.rightArrow.isEnabled()){
            this.rightArrow.disable();
            this.rightArrow.setColourCode(disabledColourCode);
        }else if (this.currentImageIndex != this.imageNames.length - 1 && this.rightArrow.isDisabled()){
            this.rightArrow.enable();
            this.rightArrow.setColourCode(enabledColourCode);
        }
    }
}