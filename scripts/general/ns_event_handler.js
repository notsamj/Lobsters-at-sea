/*
    Class Name: NSEventHandler
    Description: A custom event handler
*/
class NSEventHandler {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.events = [];
    }

    /*
        Method Name: getEvent
        Method Parameters:
            eventName:
                A string representing the name of an event
        Method Description: Finds an event a given name
        Method Return: NSEvent
    */
    getEvent(eventName){
        for (let event of this.events){
            if (event.getName() == eventName){
                return event;
            }
        }
        return null;
    }

    /*
        Method Name: hasEvent
        Method Parameters:
            eventName:
                A string representing the name of an event
        Method Description: Checks if an event with the given name exists
        Method Return: Boolean
    */
    hasEvent(eventName){
        return this.getEvent(eventName) != null;
    }

    /*
        Method Name: getOrCreate
        Method Parameters:
            eventName:
                A string representing the name of an event
        Method Description: Finds or creates an event
        Method Return: NSEvent
    */
    getOrCreate(eventName){
        let event;
        if (!this.hasEvent(eventName)){
            event = new NSEvent(eventName)
            this.events.push(event);
        }else{
            event = this.getEvent(eventName);
        }
        return event;
    }

    /*
        Method Name: addHandler
        Method Parameters:
            eventName:
                A string representing the name of an event
            handlerFunction:
                A function to call when the event is emitted
            priority:
                A rating for the priority fo this handler (lower integer -> higher priority)
        Method Description: Adds a handler for an event
        Method Return: Integer
    */
    addHandler(eventName, handlerFunction, priority=0){
        let event = this.getOrCreate(eventName);
        let handlerID = event.addHandler(handlerFunction, priority);
        return handlerID;
    }

    /*
        Method Name: removeHandler
        Method Parameters:
            eventName:
                A string representing the name of an event
            handlerID:
                An id for the handler being removed
        Method Description: Removes a handler from an event
        Method Return: void
    */
    removeHandler(eventName, handlerID){
        if (!this.hasEvent(eventName)){
            throw new Error("Event does not exist: " + eventName);
        }
        let event = this.getEvent(eventName);
        event.removeHandler(handlerID);
    }

    /*
        Method Name: emit
        Method Parameters:
            eventDetails:
                Details to pass on to the handlers
        Method Description: Passes information to event handlers
        Method Return: void
    */
    emit(eventDetails){
        let event = this.getOrCreate(eventDetails["name"]);
        event.emit(eventDetails);
    }
}

/*
    Class Name: NSEvent
    Description: A custom Event implementation
*/
class NSEvent {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(name){
        this.name = name;
        this.newHandlerID = 0;
        this.handlers = [];
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
        Method Name: addHandler
        Method Parameters:
            handlerFunction:
                A function to call when the event is emitted
            priority:
                A rating for the priority fo this handler (lower integer -> higher priority)
        Method Description: Adds a handler to an event
        Method Return: Integer
    */
    addHandler(handlerFunction, priority){
        let handlerID = this.newHandlerID;
        this.newHandlerID++;
        this.handlers.push({"handler_id": handlerID, "handler_function": handlerFunction, "priority": priority});
        this.handlers.sort((a, b) => {
            return a["priority"] - b["priority"];
        })
        return handlerID;
    }

    /*
        Method Name: removeHandler
        Method Parameters:
            handlerID:
                An id to identify a specificer event handler method
        Method Description: Removes an event handler
        Method Return: void
    */
    removeHandler(handlerID){
        let foundIndex = -1;
        
        // Find handler
        for (let i = 0; i < this.handlers.length; i++){
            let handlerObject = this.handlers[i];
            if (handlerObject["handler_id"] == handlerID){
                foundIndex = i;
                break;
            }
        }

        // If handler not found
        if (foundIndex == -1){
            throw new Error(this.getName() + " handler with id: " + handlerID + " not found.");
        }

        // Shift all down
        for (let i = foundIndex; i < this.handlers.length - 1; i++){
            this.handlers[i] = this.handlers[i+1];
        }

        // Remove last element
        this.handlers.pop();
    }

    /*
        Method Name: emit
        Method Parameters:
            eventDetails:
                Details to pass on to the handlers
        Method Description: Passes information to event handlers
        Method Return: void
    */
    emit(eventDetails){
        for (let handlerObject of this.handlers){
            handlerObject["handler_function"](eventDetails);
        }
    }
}
// If using NodeJS then export
if (typeof window === "undefined"){
    module.exports = NSEventHandler;
}