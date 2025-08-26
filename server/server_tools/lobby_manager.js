class LobbyManager {

    constructor(lobbySettingsJSON){
        this.lobbySettingsJSON = lobbySettingsJSON;
        this.playerCount = this.lobbySettingsJSON["expected_players_data"]["player_count"];
        this.playerRole = this.lobbySettingsJSON["expected_players_data"]["player_role"];

        this.runningALobby = true;

        this.clients = new NotSamLinkedList();
    }

    hasClient(clientID){
        for (let [client, clientID] of this.clients){
            if (clientID === client.getID()){
                return true;
            }
        }
        return false;
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
        let data = {"client_data": this.clients.copy(), "client_role": this.playerRole }
        this.clients.clear();
        return data;
    }
}
module.exports = { LobbyManager }