class Client {
    constructor(clientWS, server){
        this.server = server;
        this.clientWS = clientWS;
        let myReference = this;
        clientWS.on("message", (message) => {
            myReference.messageFromClient(message);
        });
    }

    sendJSON(messageJSON){
        this.send(JSON.stringify(messageJSON));
    }

    send(message){
        // Little protection here
        if (this.connectionIsDead()){
            return;
        }
        this.clientWS.send(message);
    }

    messageFromClient(message){
        this.server.deliverClientMessage(this, message.toString());
    }

    connectionIsDead(){
        // 2 closing, 3 closed
        return this.clientWS.readyState===2 || this.clientWS.readyState === 3;
    }
}

module.exports = {
    Client
}