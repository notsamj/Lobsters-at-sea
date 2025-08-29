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

    async checkActiveParticipants(){
        let removalFunc = async (client) => {
            return client.connectionIsDead() || (!(await client.checkForStatus("desire_to_play_battle")));
        }


        // Remove clients meeting removal function criteria
        for (let [client, clientIndex] of this.clients){
            // If client needs to be removed
            if (await removalFunc(client)){
                this.clients.pop(clientIndex);
            }
        }
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