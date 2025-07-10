/*
    Class Name: HUD
    Description: A heads up display
*/
class HUD {
    /*
        Method Name: constructor
        Method Parameters:
            hudJSON:
                JSON with hud info
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(hudJSON){
        this.hudElements = [];
        this.hudJSON = hudJSON;
    }

    getHUDJSON(){
        return this.hudJSON;
    }

    /*
        Method Name: updateElement
        Method Parameters:
            name:
                The name of the element
            value:
                The value of the element
        Method Description: Updates an element of the HUD (creates if doesn't exist)
        Method Return: void
    */
    updateElement(name, value){
        let foundElement = null;
        for (let element of this.hudElements){
            if (name === element.getName()){
                foundElement = element;
                break;
            }
        }
        // If element doesn't exist, create it
        if (foundElement === null){
            foundElement = new HUDElement(this, name, value);
            this.hudElements.push(foundElement);

            // Sort by priority (highest to lowest)
            let priorityFunction = (he1, he2) => {
                return he2.getPriority() - he1.getPriority();
            }
            this.hudElements.sort(priorityFunction);
        }else{
            foundElement.update(value);
        }

    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the HUD
        Method Return: void
    */
    display(){
        let i = 1;
        for (let element of this.hudElements){
            if (!element.isReadyToDisplay()){
                continue;
            }
            element.display(this.hudJSON["display_x_offset"], i * this.hudJSON["text_size"]);
            i++;
        }
    }

    /*
        Method Name: clearAll
        Method Parameters: None
        Method Description: Clears all elements from the screen
        Method Return: void
    */
    clearAll(){
        for (let element of this.hudElements){
            element.clear();
        }
    }

    /*
        Method Name: clearElement
        Method Parameters: 
            elementName:
                The name of the element
        Method Description: Clears an element
        Method Return: void
    */
    clearElement(elementName){
        for (let element of this.hudElements){
            if (elementName === element.getName()){
                element.clear();
            }
        }
    }
}

/*
    Class Name: HUDElement
    Description: A indicator to be displayed in the HUD
*/
class HUDElement {
    /*
        Method Name: constructor
        Method Parameters:
            hudInstance:
                Instance of a HUD
            name:
                Name of the hud element (string)
            value:
                Value of the hud element (variable)
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(hudInstance, name, value){
        this.hudInstance = hudInstance;
        this.name = name;
        this.value = null;
        this.disabled = false;
        this.priority = objectHasKey(this.hudInstance.getHUDJSON()["priorities"], name) ? this.hudInstance.getHUDJSON()["priorities"][name] : 0;
    }

    /*
        Method Name: getPriority
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getPriority(){
        return this.priority;
    }

    /*
        Method Name: update
        Method Parameters:
            value:
                The new value for the element
        Method Description: Updates the value of an element. Allows it to be displayed on next display.
        Method Return: void
    */
    update(value){
        this.value = value;
        this.disabled = false;
    }

    /*
        Method Name: getValue
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getValue(){
        return this.value;
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getName(){
        return this.name;
    }

    /*
        Method Name: display
        Method Parameters:
            x:
                x coordinate to display at
            y:
                y coordinate to display at
        Method Description: Displays the hud element
        Method Return: void
    */
    display(x, y){
        if (this.isDisabled()){ return; }
        let key = this.name + ": ";
        makeText(key, x, y, getScreenWidth(), getScreenHeight(), Colour.fromCode(this.hudInstance.getHUDJSON()["key_colour"]), this.hudInstance.getHUDJSON()["text_size"], "left", "top");
        let xOffset = measureTextWidth(key);
        makeText(`${this.value}`, x + xOffset, y, getScreenWidth(), getScreenHeight(), Colour.fromCode(this.hudInstance.getHUDJSON()["value_colour"]), this.hudInstance.getHUDJSON()["text_size"], "left", "top");
    }

    /*
        Method Name: isDisabled
        Method Parameters: None
        Method Description: Checks if disabled
        Method Return: boolean
    */
    isDisabled(){
        return this.disabled;
    }

    /*
        Method Name: isReadyToDisplay
        Method Parameters: None
        Method Description: Checks if ready to display
        Method Return: boolean
    */
    isReadyToDisplay(){
        return !this.isDisabled();
    }

    /*
        Method Name: disable
        Method Parameters: None
        Method Description: Disables the hud
        Method Return: void
    */
    disable(){
        this.disabled = true;
    }

    /*
        Method Name: clear
        Method Parameters: None
        Method Description: Disables the hud
        Method Return: void
    */
    clear(){
        this.disable();
    }
}