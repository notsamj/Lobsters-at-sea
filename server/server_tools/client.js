class Client {
    constructor(clientWS){
        this.clientWS = clientWS;
        let myReference = this;
        clientWS.on("message", (message) => {
            myReference.messageFromClient(message);
        });
    }

    messageFromClient(message){

    }

    connectionIsDead(){
        
    }
}

module.exports = {
    Client
}