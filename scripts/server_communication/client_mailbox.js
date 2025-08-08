class ClientMailbox {
    constructor(){
        this.messages = new NotSamLinkedList();
    }

    deliver(dataJSON){
        console.log("Delvering", JSON.stringify(dataJSON))
        this.messages.push({"read": false, "data_json": dataJSON})
    }
}