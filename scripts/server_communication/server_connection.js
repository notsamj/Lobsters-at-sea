class ServerConnection {
    constructor(defaultFolderSettingsJSON={}){
        this.eventHandler = new NSEventHandler();
        this.clientMailbox = new ClientMailbox(defaultFolderSettingsJSON);

        this.messageQueue = new ThreadSafeLinkedList();

        this.connectionWS = null;

        this.attemptingToConnect = false;
        this.connectionIsActive = false;
    }

    async sendNowOrOnConnection(message, id=null){
        // Send now if connected
        if (this.hasConnectionActive()){
            this.sendJSON(message);
            return;
        }

        let hasID = id != null;
        await this.messageQueue.requestAccess();

        let idTaken = false;

        // Note: null cannot be taken
        if (id != null){
            for (let [messageObj, messageObjIndex] of this.messageQueue){
                if (messageObj["id"] === id){
                    idTaken = true;
                    break;
                }
            }
        }

        // If ID is not taken then add
        if (!idTaken){
            this.messageQueue.push({"message": message, "id": id});
        }
        
        this.messageQueue.relinquishAccess();
    }

    sendJSON(jsonObj){
        if (!this.hasConnectionActive()){
            throw new Error("Cannot send message whilst not connected.")
        }
        this.connectionWS.send(JSON.stringify(jsonObj));
    }

    getClientMailbox(){
        return this.clientMailbox;
    }

    notifyConnectionActive(){
        // Update status
        this.setConnectionActive(true);
        this.setAttemptingToConnect(false);

        this.sendPendingMessages();
    }

    async sendPendingMessages(){
        await this.messageQueue.requestAccess();
        for (let [messageObj, messageObjIndex] of this.messageQueue){
            this.sendJSON(messageObj["message"]);
        }
        // Clear queue
        this.messageQueue.clear();
        this.messageQueue.relinquishAccess();
    }

    notifyConnectionFailed(){
        this.setConnectionActive(false);

        // If in the process of connecting, end that process
        if (this.isAttemptingConnection()){
            this.setAttemptingToConnect(false);
        }

        // Try again
        this.attemptReconnection();
    }

    attemptReconnection(){
        this.eventHandler.emit({
            "name": "status_update",
            "category": "yellow",
            "text": getPrettyTime() + ' ' + "Automatically trying to reconnect..."
        });
        this.initiateConnection();
    }

    setAttemptingToConnect(value){
        this.attemptingToConnect = value;
    }

    setConnectionActive(value){
        this.connectionIsActive = value;
    }

    getEventHandler(){
        return this.eventHandler;
    }

    shutdownConnectionIfOn(){
        this.terminateConnection();
    }

    async initiateConnection(){
        // If has an active connection OR a connection is currently being attempted then ignore 
        if (this.hasConnectionActive() || this.isAttemptingConnection()){
            return;
        }

        this.eventHandler.emit({
            "name": "status_update",
            "category": "white",
            "text": getPrettyTime() + ' ' + "Attempting to initiate a server connection."
        });

        // Await permission
        await this.clientMailbox.requestAccess();

        // Clear the mailbox
        this.clientMailbox.clear();

        // Release permission
        this.clientMailbox.relinquishAccess();

        // Create the web socket object
        this.createWSSObject();
    }

    createWSSObject(){
        let fullAddrString = "wss:" + SCD["address"] + ':' + SCD["port"].toString();
        
        // Create WS
        this.connectionWS = new WebSocket(fullAddrString);

        // Set attempting to connect
        this.setAttemptingToConnect(true);

        /*this.eventHandler.emit({
            "name": "status_update",
            "category": "yellow",
            "text": getPrettyTime() + ' ' + "WSS object initialized."
        })*/

        let thisReference = this;

        // Connection on listener
        this.connectionWS.addEventListener("open", (event) => {
            thisReference.notifyConnectionActive();

            thisReference.getEventHandler().emit({
                "name": "status_update",
                "category": "green",
                "text": getPrettyTime() + ' ' + "Connected to: " + fullAddrString + "!"
            })

            thisReference.getEventHandler().emit({
                "name": "connection_initiated"
            });
        });

        // Connection failed listener
        this.connectionWS.addEventListener("error", (event) => {
            thisReference.getEventHandler().emit({
                "name": "status_update",
                "category": "red",
                "text": getPrettyTime() + ' ' + "Connection failed."
            })

            thisReference.notifyConnectionFailed();
        });

        // Connection message listener
        this.connectionWS.addEventListener("message", (event) => {
            thisReference.handleNewMessageFromServer(event);
        })
    }

    async handleNewMessageFromServer(event){
        let dataJSON = JSON.parse(event["data"]);

        // Get access
        await this.clientMailbox.requestAccess();

        // Deliver the data
        this.clientMailbox.deliver(dataJSON, dataJSON["subject"]);

        // Give up access
        this.clientMailbox.relinquishAccess();

        // Send out an event
        this.eventHandler.emit({
            "name": "server_message",
            "message_json": dataJSON 
        });
    }

    hasConnectionActive(){
        return this.connectionIsActive;
    }

    isAttemptingConnection(){
        return this.attemptingToConnect;
    }

    terminateConnection(){
        // Do nothing if connection is not active and also not attempting to connect
        if ((!this.hasConnectionActive()) && (!this.isAttemptingConnection())){
            return;
        }

        // TODO 
        // SEND BYE MESSAGE?
        this.connectionWS.close();
        this.setConnectionActive(false);

        this.eventHandler.emit({
            "name": "status_update",
            "category": "blue",
            "text": getPrettyTime() + ' ' + "User terminated the server connection."
        });
    }
}