class ServerConnection {
    constructor(defaultFolderSettingsJSON={}){
        this.eventHandler = new NSEventHandler();
        this.clientMailbox = new ClientMailbox(defaultFolderSettingsJSON);
        this.connectionWS = null;

        this.userDesiresServerConnection = false;
        this.attemptingToConnect = false;
        this.connectionIsActive = false;
    }

    getClientMailbox(){
        return this.clientMailbox;
    }

    notifyConnectionActive(){
        // Update status
        this.setConnectionActive(true);
        this.setAttemptingToConnect(false);

        // If the user is on the page, do nothing, user wishes to continue connection
        if (this.connectionIsDesired()){
            return;
        }

        // Else, connection is no longer desired

        // TODO: Send a GOODBYE message?

        // Close WS
        this.connectionWS.close();

        // User has left the page, shut down the connection
        this.eventHandler.emit({
            "name": "status_update",
            "category": "blue",
            "text": getPrettyTime() + ' ' + "Terminated the server connection due to user activity."
        });

    }
    notifyConnectionFailed(){
        this.setConnectionActive(false);

        // If in the process of connecting, end that process
        if (this.isAttemptingConnection()){
            this.setAttemptingToConnect(false);
        }

        // If the user left the page, do nothing
        if (!this.connectionIsDesired()){
            return;
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

    connectionIsDesired(){
        return this.userDesiresServerConnection;
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

    setUserInterest(value){
        this.userDesiresServerConnection = value;
    }

    shutdownConnectionIfOn(){
        this.setUserInterest(false);
        this.terminateConnection();
    }

    async initiateConnection(){
        // If a connection is currently being attempted then ignore
        if (this.isAttemptingConnection()){
            return;
        }

        this.eventHandler.emit({
            "name": "status_update",
            "category": "white",
            "text": getPrettyTime() + ' ' + "Attempting to initiate a server connection."
        });

        // Await permission
        await this.clientMailbox.getAccess();

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
            thisReference.getEventHandler().emit({
                "name": "status_update",
                "category": "green",
                "text": getPrettyTime() + ' ' + "Connected to: " + fullAddrString + "!"
            })

            thisReference.notifyConnectionActive();
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
        await this.clientMailbox.getAccess();

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