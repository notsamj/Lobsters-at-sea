/*
    Class Name: Gamemode
    Description: Abstract class for a game mode
*/
class Gamemode {

    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */    
    constructor(){
        this.eventHandler = new NSEventHandler();
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getName(){throw new Error("Expect this to be implemented.")}

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Display gamemode specific things
        Method Return: void
    */
    display(){throw new Error("Expect this to be implemented.")}

    /*
        Method Name: handleUnpause
        Method Parameters: None
        Method Description: May or may not be implemeneted. Handles actions on unpause
        Method Return: void
    */
    handleUnpause(){}

    handlePause(){
        throw new Error("Expect this to be overwritten.");
    }

    /*
        Method Name: getEventHandler
        Method Parameters: None
        Method Description: Getter
        Method Return: NSEventHandler
    */
    getEventHandler(){
        return this.eventHandler;
    }
    
    // Abstract
    /*
        Method Name: tick
        Method Parameters: None
        Method Description: dud. Actions during a tick
        Method Return: void
    */
    tick(){throw new Error("Expect to be implemented")}
    // Sort of like a destructor
    /*
        Method Name: end
        Method Parameters: None
        Method Description: Handles actions on end. Optional.
        Method Return: void
    */
    end(){}
}