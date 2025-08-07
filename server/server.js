// Libraries
const WebSocketServer = require("ws").WebSocketServer;
const fs = require("fs");
const https = require("https");

// Custom classes
const Lock = require("../scripts/general/lock.js").Lock;
const LobbyManager = require("./server_tools/lobby_manager.js").LobbyManager;
const Client = require("./server_tools/client.js").Client;
const ThreadSafeLinkedList = require("./server_tools/thread_safe_linked_list.js").ThreadSafeLinkedList;
const LasServerGame = require("./las/las_server_game.js").LasServerGame;


// Data
const SDJ = require("./server_data.js");
const CDJ = require("./lobby_settings.js");
const GP = require("./game_properties.js");

// Global vars


class LASServer{
    constructor(serverDataJSON){
        this.SDJ = serverDataJSON;

        this.httpsServer = https.createServer({
            "cert": fs.readFileSync("./cert.pem"),
            "key": fs.readFileSync("./key.pem")
        });
        this.WSSServer = new WebSocketServer( { "server": this.httpsServer } );

        this.newClientQueue = new ThreadSafeLinkedList();

        this.tickLock = new Lock();
        this.lobbyManager = new LobbyManager(CDJ);
        this.game = new LasServerGame(GP);

        this.setupWSSServer();
    }

    async acceptNewClientsToLobby(availableLobbySlots){
        // Wait for access
        await this.newClientQueue.requestAccess();

        let clientsToAdd = Math.min(this.newClientQueue.getLength(), availableLobbySlots);
        // Add clients
        for (let i = 0; i < clientsToAdd; i++){
            this.lobbyManager.addClient(this.newClientQueue.pop(0));
        }

        // Relinquish access
        this.newClientQueue.relinquishAccess();
    }

    async tick(){
        // Don't tick if still running a tick
        if (this.tickLock.isLocked()){
            return;
        }
        // Not actually awaiting, this just locks it
        this.tickLock.awaitUnlock(true);

        // If the game is running
        if (this.game.isRunning()){
            this.game.tick();
        }
        // Else, game is not running, I am instead running a lobby
        else{
            // Check heartbeat status on all lobby clients and remove any no longer active
            this.lobbyManager.checkActiveParticipants();

            let availableLobbySlots = this.lobbyManager.getAvailableSlotCount(); // Expect >= 1

            // Accept new clients to lobby
            await this.acceptNewClientsToLobby(availableLobbySlots);

            // If the lobby is full, start game
            if (this.lobbyManager.isFull()){
                this.game.start(this.lobbyManager.transferToGame());
            }
        }
        // TODO
        /*
                Every 10-15ms run a tick
                ifRunninGame:
                    Run game
                    If game over or all players left
                        End game

                else (not running game):
                    *Running a lobby*
                    Check heartbeat status on all lobby clients and remove any no longer active
                    Accept new lobby clients (Up to max lobby count)
                    If lobby as max pop -> start up
        */

        // Unlock allowing for a new tick
        this.tickLock.unlock();
    }

    setupWSSServer(){
        // Set up connection handling stuff
        this.WSSServer.on("connection", async (connection) => {
            let clientOBJ = new Client(connection);
            
            // Await access
            await this.newClientQueue.requestAccess();

            this.newClientQueue.add(clientOBJ);

            // Relinquish access
            this.newClientQueue.relinquishAccess();
        });

        this.httpsServer.listen(this.SDJ["port"], () => {
            console.log("WSS Server running @", this.SDJ["port"]);
            launchTickSystem();
        });
    }

    getDataJSON(){
        return this.SDJ;
    }
}

// Start up
const SERVER = new LASServer(SDJ);

function launchTickSystem(){
    setInterval(tick, 0);
}

async function tick(){
    SERVER.tick();
}