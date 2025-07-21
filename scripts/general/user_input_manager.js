/*
    Class Name: UserInputManager
    Description: A class for managing the user's inputs.
*/
class UserInputManager {
     /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.handlerNodes = [];
        this.specialNodes = [];
    }

    /*
        Method Name: register
        Method Parameters:
            alias:
                The name of the listener
            eventName:
                The name of the event to await
            checker:
                The function that checks if the event meets requirements
            onOff:
                Whether or not the event activates or deactivates the node
            extraInfo:
                Extra information for setting up the node
        Method Description: Sets up a listener for an event and potentially creates a node
        Method Return: void
    */
    register(alias, eventName, checker, onOff=true, extraInfo=null){
        let newNode = this.getOrCreate(alias);
        this.handlerNodes.push(newNode);
        document.addEventListener(eventName, (event) => {
            if (checker(event)){
                newNode.setActivated(onOff);
            }
        });
        newNode.setExtraInfo(extraInfo);
    }

    /*
        Method Name: has
        Method Parameters:
            alias:
                The name of the listener
        Method Description: Determines if a listener exists with a given name
        Method Return: boolean, true -> exists, false -> does not exist
    */
    has(alias){
        return this.getMaybeNull(alias) != null;
    }

    /*
        Method Name: get
        Method Parameters:
            alias:
                The name of the listener
        Method Description: Finds a listener if it exists, otherwise, creates it. Returns it.
        Method Return: UserInputNode
    */
    get(alias){
        let result = this.getMaybeNull(alias);
        if (result != null){
            return result;
        }
        throw new Error("Listener node not found.");

        /*// Else doesn't exist -> create it
        let newNode = new UserInputNode(alias);
        this.handlerNodes.push(newNode);
        return newNode; */
    }

    /*
        Method Name: getOrCreate
        Method Parameters: 
            alias:
                The new handler node name
        Method Description: Creates if needed, retrieves a handler node
        Method Return: UserInputNode
    */
    getOrCreate(alias){
        let result = this.getMaybeNull(alias);
        if (result != null){
            return result;
        }

        // Else doesn't exist -> create it
        let newNode = new UserInputNode(alias);
        this.handlerNodes.push(newNode);
        return newNode;
    }

    /*
        Method Name: getMaybeNull
        Method Parameters: 
            alias:
                The new handler node name
        Method Description: Retrieves a node
        Method Return: UserInputNode or null
    */
    getMaybeNull(alias){
        // Check if we have this node
        for (let handlerNode of this.handlerNodes){
            if (handlerNode.getAlias() === alias){
                return handlerNode;
            }
        }

        for (let specialNode of this.specialNodes){
            if (specialNode.getAlias() === alias){
                return specialNode;
            }
        }
        return null;
    }
    
    /*
        Method Name: isActivated
        Method Parameters:
            alias:
                The name of the listener
        Method Description: Determines if a listener node has been activated by an event
        Method Return: boolean, true -> activated, false -> not activated
    */
    isActivated(alias){
        if (!this.has(alias)){
            throw new Error("Alias not found: " + alias + ".");
        }
        return this.get(alias).isActivated();
    }

    /*
        Method Name: notActivated
        Method Parameters:
            alias:
                The name of the listener
        Method Description: Determines if a listener node has not been activated by an event
        Method Return: boolean, true -> not activated, false -> activated
    */
    notActivated(alias){
        return !this.isActivated(alias);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Ticks nodes
        Method Return: void
    */
    tick(){
        for (let handlerNode of this.handlerNodes){
            if (handlerNode.isTicked()){
                handlerNode.tick();
            }
        }
        for (let specialNode of this.specialNodes){
            specialNode.tick();
        }
    }

    /*
        Method Name: registerSpecialType
        Method Parameters: 
            specialNode:
                A new node
        Method Description: Registers a special node
        Method Return: void
    */
    registerSpecialType(specialNode){
        this.specialNodes.push(specialNode);
    }
}

/*
    Class Name: UserInputManager
    Description: A class for managing the user's inputs.
*/
class UserInputNode {
    /*
        Method Name: constructor
        Method Parameters:
            alias:
                Alias/name of the node
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(alias){
        this.alias = alias;
        this.activated = false;
        this.ticked = false;
    }

    /*
        Method Name: getAlias
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getAlias(){
        return this.alias;
    }

    /*
        Method Name: setActivated
        Method Parameters:
            onOff:
                Whether to activate or deactivate the node
        Method Description: Getter
        Method Return: void
    */
    setActivated(onOff){
        this.activated = onOff;
    }

    /*
        Method Name: isActivated
        Method Parameters: None
        Method Description: Getter
        Method Return: boolean, true -> activated, false -> not activated
    */
    isActivated(){
        return this.activated;
    }

    /*
        Method Name: setExtraInfo
        Method Parameters: 
            extraInfo:
                JSON object with info
        Method Description: Sets extra info about a handler node
        Method Return: void
    */
    setExtraInfo(extraInfo){
        if (extraInfo === null){ return; }
        this.extraInfo = extraInfo;
        this.ticked = extraInfo["ticked"];
    }

    /*
        Method Name: isTicked
        Method Parameters: None
        Method Description: Checks if a node is ticked
        Method Return: boolean
    */
    isTicked(){
        return this.ticked;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Handles the tick actions
        Method Return: void
        Note:
        ticked_activation means that on a tick it gets disabled
        If you use key_down for a press. key_down will get called by browser say 5x/second while its down
    */
    tick(){
        this.activated = this.extraInfo["ticked_activation"];
    }
}

/*
    Class Name: SpecialNode
    Class Description: A special type of node. Intended as an abstract class
*/
class SpecialNode {
    /*
        Method Name: constructor
        Method Parameters: 
            alias:
                String name of node
        Method Description: constructor
        Method Return: constructor
    */
    constructor(alias){
        this.alias = alias;
    }

    /*
        Method Name: getAlias
        Method Parameters: None
        Method Description: Getter
        Method Return: String
    */
    getAlias(){
        return this.alias;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Dud
        Method Return: void
    */
    tick(){ throw new Error("Please implement this method."); }
}

/*
    Class Name: TickedValueNode
    Description: Takes values from events and resets on tick
*/
class TickedValueNode extends SpecialNode {
    /*
        Method Name: constructor
        Method Parameters: 
            alias:
                The name of the node
            eventName:
                The name of the event that it is listening for
            valueExtractorFunction:
                Function that takes a value from a node
            defaultValue:
                Value to use when not activated by an event
        Method Description: constructor
        Method Return: constructor
    */
    constructor(alias, eventName, valueExtractorFunction, defaultValue){
        super(alias);
        this.defaultValue = defaultValue;
        this.value = this.defaultValue;
        this.valueExtractorFunction = valueExtractorFunction;
        document.addEventListener(eventName, (event) => {
            this.updateValue(event);
        });
    }

    /*
        Method Name: getValue
        Method Parameters: None
        Method Description: Getter
        Method Return: Variable
    */
    getValue(){
        return this.value;
    }

    /*
        Method Name: updateValue
        Method Parameters: 
            event:
                Event object
        Method Description: Updates the value from an event
        Method Return: void
    */
    updateValue(event){
        this.value = this.valueExtractorFunction(event);
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Resets the value
        Method Return: void
    */
    tick(){
        this.value = this.defaultValue;
    }
}