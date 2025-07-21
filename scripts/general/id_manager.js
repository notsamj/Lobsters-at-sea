class IDManager {
    constructor(){
        this.data = new NotSamLinkedList();
    }

    hasID(id){
        return id < this.data.getLength(); 
    }

    clear(){
        this.data.clear();
    }

    registerMe(referenceObj){
        this.data.push(referenceObj);
        return this.data.getLength();
    }

    generateNewID(){
        return this.registerMe(null);
    }

    setIDReference(id, referenceObj){
        // If ID out of range
        if (!this.hasID(id)){
            throw new Error("ID not found.");
        }

        this.data.set(id, referenceObj);
    }

    getIDReference(id){
        // If ID out of range
        if (!this.hasID(id)){
            throw new Error("ID not found.");
        }
        return this.data.get(id);
    }

    hasIDReference(id){
        // If ID out of range
        if (!this.hasID(id)){
            throw new Error("ID not found.");
        }
        return this.getIDReference(id) != null;
    }
}