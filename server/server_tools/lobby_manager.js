const copyObject = require("../../scripts/general/helper_functions.js").copyObject;
/*
    Class Name: LobbyManager
    Description: Manages clients in a lobby
*/
class LobbyManager {
    /*
        Method Name: constructor
        Method Parameters: 
            lobbySettingsJSON:
                JSON settins for the lobby
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(lobbySettingsJSON){
        this.lobbySettingsJSON = lobbySettingsJSON;
        this.playerCount = this.lobbySettingsJSON["expected_players_data"]["player_count"];
        this.playerRole = this.lobbySettingsJSON["expected_players_data"]["player_role"];

        this.runningALobby = true;

        this.clients = new NotSamLinkedList();
    }

    /*
        Method Name: hasClient
        Method Parameters:
            clientID:
                Id of a client
        Method Description: Checks if a client with the specified id exists
        Method Return: boolean
    */
    hasClient(clientID){
        for (let [client, clientID] of this.clients){
            if (clientID === client.getID()){
                return true;
            }
        }
        return false;
    }

    /*
        Method Name: addClient
        Method Parameters:
            client:
                A Client object
        Method Description: Adds a client to the list
        Method Return: void
    */
    addClient(client){
        this.clients.push(client);
    }

    /*
        Method Name: isRunningALobby
        Method Parameters: None
        Method Description: Checks if a lobby is running
        Method Return: boolean
    */
    isRunningALobby(){
        return this.runningALobby;
    }

    /*
        Method Name: checkActiveParticipants
        Method Parameters: None
        Method Description: Removes non-active participants
        Method Return: boolean
    */
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

    /*
        Method Name: getAvailableSlotCount
        Method Parameters: None
        Method Description: Gets the number of slots available
        Method Return: int
    */
    getAvailableSlotCount(){
        return this.playerCount - this.clients.getLength();
    }

    /*
        Method Name: isFull
        Method Parameters: None
        Method Description: Checks if full
        Method Return: boolean
    */
    isFull(){
        return this.getAvailableSlotCount() === 0;
    }

    /*
        Method Name: transferToGame
        Method Parameters: None
        Method Description: Transfers clients to the game and cleans out the client list
        Method Return: JSON
    */
    transferToGame(){
        let data = copyObject(this.lobbySettingsJSON);
        data["client_data"] = this.clients.copy();
        this.clients.clear();
        return data;
    }
}
module.exports = { LobbyManager }