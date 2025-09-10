// If using NodeJS then do imports
if (typeof window === "undefined"){
    NotSamLinkedList = require("./notsam_linked_list.js").NotSamLinkedList;
}

/*
    Class Name: IDManager
    Class Description: Manages ID assignment
*/
class IDManager {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        this.data = new NotSamLinkedList();
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the data
        Method Return: void
    */
    reset(){
        this.data.clear();
    }

    /*
        Method Name: hasID
        Method Parameters: 
            id:
                An ID number
        Method Description: Checks if the ID is present
        Method Return: boolean
    */
    hasID(id){
        return id < this.data.getLength(); 
    }

    /*
        Method Name: clear
        Method Parameters: None
        Method Description: Clears the data
        Method Return: void
    */
    clear(){
        this.data.clear();
    }

    /*
        Method Name: registerMe
        Method Parameters: 
            referenceObj:
                Reference of object that is associated with the ID
        Method Description: Registers an object
        Method Return: int [new id]
    */
    registerMe(referenceObj){
        this.data.push(referenceObj);
        return this.data.getLength();
    }

    /*
        Method Name: generateNewID
        Method Parameters: None
        Method Description: Generates a new id
        Method Return: int [new id]
    */
    generateNewID(){
        return this.registerMe(null);
    }

    /*
        Method Name: setIDReference
        Method Parameters: 
            id:
                An id
            referenceObj:
                A reference object
        Method Description: Adds a reference to an id
        Method Return: void
    */
    setIDReference(id, referenceObj){
        // If ID out of range
        if (!this.hasID(id)){
            throw new Error("ID not found.");
        }

        this.data.set(id, referenceObj);
    }

    /*
        Method Name: getIDReference
        Method Parameters: 
            id:
                An id [int]
        Method Description: Gets the reference for a given id 
        Method Return: any type
    */
    getIDReference(id){
        // If ID out of range
        if (!this.hasID(id)){
            throw new Error("ID not found.");
        }
        return this.data.get(id);
    }

    /*
        Method Name: hasIDReference
        Method Parameters: 
            id:
                An id [int]
        Method Description: Checks if a given ID has a reference
        Method Return: boolean
    */
    hasIDReference(id){
        // If ID out of range
        if (!this.hasID(id)){
            throw new Error("ID not found.");
        }
        return this.getIDReference(id) != null;
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { IDManager }
}