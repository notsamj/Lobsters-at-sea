class ServerConnection {
    constructor(defaultFolderSettingsJSON={}){
        this.eventHandler = new NSEventHandler();
        this.clientMailbox = new ClientMailbox(defaultFolderSettingsJSON);

        this.connectionWS = null;

        this.attemptingToConnect = false;
        this.connectionIsActive = false;
    }

    async sendNowOrOnConnection(message, id){}

    sendJSON(jsonObj){}

    getClientMailbox(){
        return this.clientMailbox;
    }

    notifyConnectionActive(){}

    async sendPendingMessages(){}

    notifyConnectionFailed(){}

    attemptReconnection(){}

    setAttemptingToConnect(value){}

    setConnectionActive(value){}

    getEventHandler(){
        return this.eventHandler;
    }

    shutdownConnectionIfOn(){}

    async initiateConnection(){
        this.eventHandler.emit({
            "name": "status_update",
            "category": "white",
            "text": getPrettyTime() + ' ' + "Cannot attempt server connection because this is a dummy class for index.html"
        });
    }

    createWSSObject(){}

    async handleNewMessageFromServer(event){}

    hasConnectionActive(){
        return this.connectionIsActive;
    }

    isAttemptingConnection(){
        return this.attemptingToConnect;
    }

    terminateConnection(){}
}