/*
    Class Name: ServerConnection
    Class Description: Disabled version of server rconnection
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
    async sendNowOrOnConnection(message, id){}

    /*
        Method Name: sendJSON
        Method Parameters: 
            jsonObj:
                A JSON object to send
        Method Description: Sends a JSON object
        Method Return: void
    */
    sendJSON(jsonObj){}

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
    notifyConnectionActive(){}


    /*
        Method Name: sendPendingMessages
        Method Parameters: None
        Method Description: Sends pending messages
        Method Return: Promice (implicit)
    */
    async sendPendingMessages(){}

    /*
        Method Name: notifyConnectionFailed
        Method Parameters: None
        Method Description: Handles the notification that the server connection failed
        Method Return: void
    */
    notifyConnectionFailed(){}

    /*
        Method Name: attemptReconnection
        Method Parameters: None
        Method Description: Attempts a reconnection to the server
        Method Return: void
    */
    attemptReconnection(){}

    /*
        Method Name: setAttemptingToConnect
        Method Parameters: 
            value:
                Boolean value for attempting to connect
        Method Description: Setter
        Method Return: void
    */
    setAttemptingToConnect(value){}

    /*
        Method Name: setConnectionActive
        Method Parameters: 
            value:
                Boolean value for connection being avid
        Method Description: Setter
        Method Return: void
    */
    setConnectionActive(value){}

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
    shutdownConnectionIfOn(){}

    /*
        Method Name: initiateConnection
        Method Parameters: None
        Method Description: Initiates a connection
        Method Return: Promise (implicit)
    */
    async initiateConnection(){
        this.eventHandler.emit({
            "name": "status_update",
            "category": "white",
            "text": getPrettyTime() + ' ' + "Cannot attempt server connection because this is a dummy class for index.html"
        });
    }

    /*
        Method Name: createWSSObject
        Method Parameters: None
        Method Description: Creates a WSS object
        Method Return: void
    */
    createWSSObject(){}

    /*
        Method Name: handleNewMessageFromServer
        Method Parameters: 
            event:
                An event JSON that is from the server
        Method Description: Handles a new message
        Method Return: Promise (implicit)
    */
    async handleNewMessageFromServer(event){}

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
    terminateConnection(){}
}