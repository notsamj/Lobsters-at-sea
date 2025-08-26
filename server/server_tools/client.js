const ServerMailBox = require("./server_mailbox.js").ServerMailBox;
class Client {
    constructor(clientWS, id, server, defaultFolderSettings){
        this.server = server;
        this.id = id;
        this.clientWS = clientWS;
        this.mailBox = new ServerMailBox(defaultFolderSettings);
        let myReference = this;
        clientWS.on("message", (message) => {
            myReference.messageFromClient(message);
        });
    }

    getID(){
        return this.id;
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

    async messageFromClient(message){
        let messageJSON = JSON.parse(message.toString());
        // Get access
        await this.mailBox.requestAccess();
        this.mailBox.deliver(messageJSON, messageJSON["subject"]);
        // Give up access
        this.mailBox.relinquishAccess();
    }

    getMailBox(){
        return this.mailBox;
    }

    connectionIsDead(){
        // 2 closing, 3 closed
        return this.clientWS.readyState===2 || this.clientWS.readyState === 3;
    }
}

module.exports = {
    Client
}