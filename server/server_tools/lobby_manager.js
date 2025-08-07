class LobbyManager {

    constructor(lobbySettingsJSON){
        this.lobbySettingsJSON = lobbySettingsJSON;
        this.playerCount = this.lobbySettingsJSON["expected_players_data"]["player_count"];
        this.playerRole = this.lobbySettingsJSON["expected_players_data"]["player_role"];

        this.runningALobby = true;

        this.clients = new NotSamLinkedList();
    }

    addClient(client){
        let old = this.clients.getLength();
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
        return this.playerCount - this.clients.getLength();
    }

    isFull(){
        return this.getAvailableSlotCount() === 0;
    }

    transferToGame(){
        return this.clients.copy();
    }
}
module.exports = { LobbyManager }