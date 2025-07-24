class LobbyManager {

    constructor(lobbySettingsJSON){
        this.lobbySettingsJSON = lobbySettingsJSON;
        this.playerCount = this.lobbySettingsJSON["player_count"];
        this.playerRole = this.lobbySettingsJSON["player_role"];

        this.runningALobby = true;


    }

    isRunningALobby(){
        return this.runningALobby;
    }
}