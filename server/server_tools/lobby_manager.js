class LobbyManager {

    constructor(lobbySettingsJSON){
        this.lobbySettingsJSON = lobbySettingsJSON;
        this.playerCount = this.lobbySettingsJSON["player_count"];
        this.playerRole = this.lobbySettingsJSON["player_role"];

        this.runningALobby = true;

        this.clients = new NotSamLinkedList();
    }

    addClient(client){
        this.clients.push(client);
    }

    isRunningALobby(){
        return this.runningALobby;
    }

    checkActiveParticipants(){
        let removalFunc = (client) => {
            return client.connectionIsDead();
        }
        this.clients.deleteWithCondition(removalFunc);
    }

    getAvailableSlotCount(){
        return this.clients.getLength() - this.playerCount;
    }

    isFull(){
        return this.getAvailableSlotCount() === 0;
    }

    transferToGame(){

    }
}
module.exports = { LobbyManager }