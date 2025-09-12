/*
    Class Name: ServerConnection
    Class Description: A connection to the server
*/
class ServerConnection {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(defaultFolderSettingsJSON={}){
        this.eventHandler = new NSEventHandler();
        this.clientMailbox = new ClientMailbox(defaultFolderSettingsJSON);

        this.messageQueue = new ThreadSafeLinkedList();

        this.connectionWS = null;

        this.attemptingToConnect = false;
        this.connectionIsActive = false;
    }

    /*
        Method Name: sendNowOrOnConnection
        Method Parameters: 
            message:
                A message to send to the server (JSON)
            id:
                ID for the message (prevents duplication)
        Method Description: Sends a message now or when connection is established
        Method Return: Promise (implicit)
    */
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

    /*
        Method Name: sendJSON
        Method Parameters: 
            jsonObj:
                A JSON object to send
        Method Description: Sends a JSON object
        Method Return: void
    */
    sendJSON(jsonObj){
        if (!this.hasConnectionActive()){
            throw new Error("Cannot send message whilst not connected.")
        }
        this.connectionWS.send(JSON.stringify(jsonObj));
    }

    /*
        Method Name: getClientMailbox
        Method Parameters: None
        Method Description: Getter
        Method Return: ClientMailbox
    */
    getClientMailbox(){
        return this.clientMailbox;
    }

    /*
        Method Name: notifyConnectionActive
        Method Parameters: None
        Method Description: Handles the notification that the connection is active
        Method Return: void
    */
    notifyConnectionActive(){
        // Update status
        this.setConnectionActive(true);
        this.setAttemptingToConnect(false);

        this.sendPendingMessages();
    }

    /*
        Method Name: sendPendingMessages
        Method Parameters: None
        Method Description: Sends pending messages
        Method Return: Promice (implicit)
    */
    async sendPendingMessages(){
        await this.messageQueue.requestAccess();
        for (let [messageObj, messageObjIndex] of this.messageQueue){
            this.sendJSON(messageObj["message"]);
        }
        // Clear queue
        this.messageQueue.clear();
        this.messageQueue.relinquishAccess();
    }

    /*
        Method Name: notifyConnectionFailed
        Method Parameters: None
        Method Description: Handles the notification that the server connection failed
        Method Return: void
    */
    notifyConnectionFailed(){
        this.setConnectionActive(false);

        // If in the process of connecting, end that process
        if (this.isAttemptingConnection()){
            this.setAttemptingToConnect(false);
        }

        // Try again (disabled)
        // this.attemptReconnection();
    }

    /*
        Method Name: attemptReconnection
        Method Parameters: None
        Method Description: Attempts a reconnection to the server
        Method Return: void
    */
    attemptReconnection(){
        this.eventHandler.emit({
            "name": "status_update",
            "category": "yellow",
            "text": getPrettyTime() + ' ' + "Automatically trying to reconnect..."
        });
        this.initiateConnection();
    }

    /*
        Method Name: setAttemptingToConnect
        Method Parameters: 
            value:
                Boolean value for attempting to connect
        Method Description: Setter
        Method Return: void
    */
    setAttemptingToConnect(value){
        this.attemptingToConnect = value;
    }

    /*
        Method Name: setConnectionActive
        Method Parameters: 
            value:
                Boolean value for connection being avid
        Method Description: Setter
        Method Return: void
    */
    setConnectionActive(value){
        this.connectionIsActive = value;
    }

    /*
        Method Name: getEventHandler
        Method Parameters: None
        Method Description: Getter
        Method Return: EventHandler
    */
    getEventHandler(){
        return this.eventHandler;
    }

    /*
        Method Name: shutdownConnectionIfOn
        Method Parameters: None
        Method Description: Shuts down the connection
        Method Return: void
    */
    shutdownConnectionIfOn(){
        this.terminateConnection();
    }

    /*
        Method Name: initiateConnection
        Method Parameters: None
        Method Description: Initiates a connection
        Method Return: Promise (implicit)
    */
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

    /*
        Method Name: createWSSObject
        Method Parameters: None
        Method Description: Creates a WSS object
        Method Return: void
    */
    createWSSObject(){
        let fullAddrString = SCD["protocol"] + "://" + SCD["address"] + ':' + SCD["port"].toString();
        
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

    /*
        Method Name: handleNewMessageFromServer
        Method Parameters: 
            event:
                An event JSON that is from the server
        Method Description: Handles a new message
        Method Return: Promise (implicit)
    */
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

    /*
        Method Name: hasConnectionActive
        Method Parameters: None
        Method Description: Checks if there is a connection active
        Method Return: boolean
    */
    hasConnectionActive(){
        return this.connectionIsActive;
    }

    /*
        Method Name: isAttemptingConnection
        Method Parameters: None
        Method Description: Checks if there is a connection being attempted
        Method Return: boolean
    */
    isAttemptingConnection(){
        return this.attemptingToConnect;
    }

    /*
        Method Name: terminateConnection
        Method Parameters: None
        Method Description: Terminates a connection
        Method Return: void
    */
    terminateConnection(){
        // Do nothing if connection is not active and also not attempting to connect
        if ((!this.hasConnectionActive()) && (!this.isAttemptingConnection())){
            return;
        }

        this.connectionWS.close();
        this.setConnectionActive(false);

        this.eventHandler.emit({
            "name": "status_update",
            "category": "blue",
            "text": getPrettyTime() + ' ' + "User terminated the server connection."
        });
    }
}