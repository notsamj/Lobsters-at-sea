const ServerMailBox = require("./server_mailbox.js").ServerMailBox;

/*
    Class Name: Client
    Description: A client over WS
*/
class Client {
    /*
        Method Name: constructor
        Method Parameters: 
            clientWS:
                Client WS object
            id:
                Client ID
            server:
                server reference
            defaultFolderSettings:
                Default settings JSON
        Method Description: Constructor
        Method Return: Constructor
    */
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

    /*
        Method Name: checkForSubject
        Method Parameters:
            subjectName:
                Subject to check
        Method Description: Checks the messages with a certain subject
        Method Return: TODO
    */
    async checkForSubject(subjectName){
        // Get access
        await this.mailBox.requestAccess();
        
        let pendingDecisionsFolder = this.mailBox.getFolder(subjectName);
        let decisionsMessages = pendingDecisionsFolder["list"];
        
        let subjectMessageFound = false;

        // Check messages in folder
        for (let [messageJSONWrapper, messageIndex] of decisionsMessages){
            // Skip read messages
            if (messageJSONWrapper["read"]){ continue; }

            let messageJSON = messageJSONWrapper["data_json"];

            // Mark read
            messageJSONWrapper["read"] = true;

            // Mark found
            subjectMessageFound = true;
            break;
        }

        // Give up access
        this.mailBox.relinquishAccess();

        // Return result
        return subjectMessageFound;
    }

    /*
        Method Name: checkForStatus
        Method Parameters:
            subjectName:
                Subject to check
        Method Description: Checks the status of a certan attribute
        Method Return: Promise (implicit)
    */
    async checkForStatus(subjectName){
        // Get access
        await this.mailBox.requestAccess();
        
        let pendingDecisionsFolder = this.mailBox.getFolder(subjectName);
        let decisionsMessages = pendingDecisionsFolder["list"];
        
        let statusFound = false; // Assume false

        // Check messages in folder
        for (let [messageJSONWrapper, messageIndex] of decisionsMessages){
            // Note: Allowing read messages (status)
            let messageJSON = messageJSONWrapper["data_json"];

            statusFound = messageJSONWrapper["data_json"]["value"];
            break;
        }

        // Give up access
        this.mailBox.relinquishAccess();

        // Return result
        return statusFound;
    }

    /*
        Method Name: getID
        Method Parameters: None
        Method Description: Getter
        Method Return: any
    */
    getID(){
        return this.id;
    }

    /*
        Method Name: sendJSON
        Method Parameters:
            messageJSON:
                Message JSON to send to the client
        Method Description: Sends a message to the client
        Method Return: void
    */
    sendJSON(messageJSON){
        this.send(JSON.stringify(messageJSON));
    }

    /*
        Method Name: send
        Method Parameters:
            message:
                A string message to send to the client
        Method Description: Sends a message to the client
        Method Return: void
    */
    send(message){
        // Little protection here
        if (this.connectionIsDead()){
            return;
        }
        this.clientWS.send(message);
    }

    /*
        Method Name: messageFromClient
        Method Parameters:
            message:
                Message from the client (Some block format)
        Method Description: Receives and handles a message from the client
        Method Return: Promise (implicit)
    */
    async messageFromClient(message){
        let messageJSON = JSON.parse(message.toString());
        // Get access
        await this.mailBox.requestAccess();
        this.mailBox.deliver(messageJSON, messageJSON["subject"]);
        // Give up access
        this.mailBox.relinquishAccess();
    }

    /*
        Method Name: getMailBox
        Method Parameters: None
        Method Description: Getter
        Method Return: ServerMailBox
    */
    getMailBox(){
        return this.mailBox;
    }

    /*
        Method Name: connectionIsDead
        Method Parameters: None
        Method Description: Checks if the connection is dying/dead
        Method Return: boolean
    */
    connectionIsDead(){
        // 2 closing, 3 closed
        return this.clientWS.readyState===2 || this.clientWS.readyState === 3;
    }
}

module.exports = {
    Client
}