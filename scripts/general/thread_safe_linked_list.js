if (typeof window === "undefined"){
    NotSamLinkedList = require("../../scripts/general/notsam_linked_list.js").NotSamLinkedList;
    Lock = require("../../scripts/general/lock.js").Lock;
}

class ThreadSafeLinkedList extends NotSamLinkedList {
    /*
        Method Name: constructor
        Method Parameters: 
            providedList:
                A list to load from
        Method Description: constructor
        Method Return: constructor
    */
    constructor(providedList=null){
        super();
        this.accessLock = new Lock();
    }

    /*
        Method Name: requestAccess
        Method Parameters: None
        Method Description: Awaits access to be granted
        Method Return: Promise (implicit)
    */
    async requestAccess(){
        return this.accessLock.awaitUnlock(true);
    }

    /*
        Method Name: relinquishAccess
        Method Parameters: None
        Method Description: Removes access
        Method Return: void
    */
    relinquishAccess(){
        this.accessLock.unlock();
    }
}
if (typeof window === "undefined"){
    module.exports = { ThreadSafeLinkedList }
}
