class ServerConnection {
    constructor(){
        this.eventHandler = new NSEventHandler();
        this.connectionWS = null;

        this.userDesiresServerConnection = false;
        this.attemptingToConnect = false;
        this.connectionIsActive = false;
    }

    notifyConnectionActive(){
        // If the user is on the page, do nothing
        if (this.connectionIsDesired()){
            return;
        }

        // TODO: Send a GOODBYE message

        // Close WS
        this.connectionWS.close();

        // User has left the page, shut down the connection
        this.eventHandler.emit({
            "name": "status_update",
            "category": "blue",
            "text": "Terminated the server connection due to user activity."
        });

    }
    notifyConnectionFailed(){
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
            "text": "Automatically trying to reconnect..."
        });
        // TODO
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

    initiateConnection(){
        // User has indicated that a connection is desired
        this.userDesiresServerConnection = true;

        this.eventHandler.emit({
            "name": "status_update",
            "category": "white",
            "text": "Attempting to initiate a server connection."
        });

        // Create the web socket object
        if (this.connectionWS === null){
            this.createWSSObject();
        }
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
            "text": "WSS object initialized."
        })*/

        let thisReference = this;

        // Connection on listener
        this.connectionWS.addEventListener("open", (event) => {
            thisReference.getEventHandler().emit({
                "name": "status_update",
                "category": "green",
                "text": "Connected to: " + fullAddrString + "!"
            })

            thisReference.setConnectionActive(true);

            thisReference.notifyConnectionActive();
        });

        // Connection failed listener
        this.connectionWS.addEventListener("error", (event) => {
            thisReference.getEventHandler().emit({
                "name": "status_update",
                "category": "red",
                "text": "Connection failed."
            })

            thisReference.setConnectionActive(false);
            thisReference.notifyConnectionFailed();
        });
    }

    hasConnectionActive(){
        return this.connectionIsActive;
    }

    isAttemptingConnection(){
        return this.attemptingToConnect;
    }

    terminateConnection(){
        // User has indicated that a connection is not desired
        this.userDesiresServerConnection = false;

        // Do nothing if connection is not active and also not attempting to connect
        if ((!this.hasConnectionActive()) && (!this.isAttemptingConnection())){
            return;
        }

        // TODO 
        // SEND BYE MESSAGE
        // CLOSE THE WS

        this.eventHandler.emit({
            "name": "status_update",
            "category": "blue",
            "text": "User terminated the server connection."
        });
    }
}