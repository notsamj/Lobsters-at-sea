/*
    Class Name: Component
    Description: An abstract class of a component of a visual interface
*/
class Component {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.enabled = true;
        this.displayEnabled = true;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Default handler for actions on tick
        Method Return: void
    */
    tick(){}

    /*
        Method Name: enable
        Method Parameters: None
        Method Description: Enables the component
        Method Return: void
    */
    enable(){
        this.enabled = true;
    }

    /*
        Method Name: disable
        Method Parameters: None
        Method Description: Disables the component
        Method Return: void
    */
    disable(){
        this.enabled = false;
    }

    /*
        Method Name: isDisabled
        Method Parameters: None
        Method Description: Reports whether the component is disabled
        Method Return: Boolean
    */
    isDisabled(){
        return !this.enabled;
    }

    /*
        Method Name: isEnabled
        Method Parameters: None
        Method Description: Reports whether the component is enabled
        Method Return: Boolean
    */
    isEnabled(){
        return this.enabled;
    }

    /*
        Method Name: isDisplayEnabled
        Method Parameters: None
        Method Description: Reports whether the component has its display enabled
        Method Return: Boolean
    */
    isDisplayEnabled(){
        return this.displayEnabled;
    }

    /*
        Method Name: enableDisplay
        Method Parameters: None
        Method Description: Enables the display of the component
        Method Return: void
    */
    enableDisplay(){
        this.displayEnabled = true;
    }

    /*
        Method Name: disableDisplay
        Method Parameters: None
        Method Description: Disables the display of the component
        Method Return: void
    */
    disableDisplay(){
        this.displayEnabled = false;
    }

    /*
        Method Name: fullDisable
        Method Parameters: None
        Method Description: Disables the component, including display
        Method Return: void
    */
    fullDisable(){
        this.disableDisplay();
        this.disable();
    }

    /*
        Method Name: fullEnable
        Method Parameters: None
        Method Description: Enables the component, including display
        Method Return: void
    */
    fullEnable(){
        this.enableDisplay();
        this.enable();
    }


    /*
        Method Name: covers
        Method Parameters: None
        Method Description: Default checker for component covering
        Method Return: boolean
    */
    covers(){ return false; }
    /*
        Method Name: clicked
        Method Parameters: None
        Method Description: Default handler for click
        Method Return: void
    */
    clicked(){}

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Default handler for display
        Method Return: void
    */
    display(){}
}

/*
    Class Name: ComponentGroup
    Class Description: A group of components
*/
class ComponentGroup extends Component {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        super();
        this.components = [];
    }

    /*
        Method Name: addComponent
        Method Parameters: 
            component:
                A component
        Method Description: Adds a component
        Method Return: void
    */
    addComponent(component){
        this.components.push(component);
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays all components
        Method Return: void
    */
    display(){
        for (let component of this.components){
            component.display();
        }
    }

    /*
        Method Name: getComponents
        Method Parameters: None
        Method Description: Getter
        Method Return: List of Component
    */
    getComponents(){
        return this.components;
    }

    /*
        Method Name: clicked
        Method Parameters:
            instance:
                The menu responsible for the click
            x:
                X location of click
            y:
                Y location of click
        Method Description: Handles what occurs when clicked on
        Method Return: void
    */
    clicked(instance, x=undefined, y=undefined){
        for (let component of this.components){
            if (component.covers(x,y)){
                component.clicked(x,y);
                return;
            }
        }
    }

    /*
        Method Name: covers
        Method Parameters: 
            x:
                x location
            y:
                y location
        Method Description: Checks if any components cover the location
        Method Return: boolean
    */
    covers(x, y){
        for (let component of this.components){
            if (component.covers(x,y)){
                return true;
            }
        }
        return false;
    }
}