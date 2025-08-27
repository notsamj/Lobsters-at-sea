// MongoDB
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient, ServerApiVersion } = require("mongodb");

// Other Libraries
const WebSocketServer = require("ws").WebSocketServer;
const fs = require("fs");
const https = require("https");

// Custom classes
const Lock = require("../scripts/general/lock.js").Lock;
const LobbyManager = require("./server_tools/lobby_manager.js").LobbyManager;
const Client = require("./server_tools/client.js").Client;
const ThreadSafeLinkedList = require("./server_tools/thread_safe_linked_list.js").ThreadSafeLinkedList;
const LasServerGame = require("./las/las_server_game.js").LasServerGame;
const IDManager = require("../scripts/general/id_manager.js").IDManager;

// Data
const SDJ = require("./server_data.js");
const CDJ = require("./lobby_settings.js");
const GP = require("./game_properties.js");

// Global vars


class LASServer {
    constructor(serverDataJSON){
        this.SDJ = serverDataJSON;

        this.httpsServer = undefined; // placeholder
        this.WSSServer = undefined; // placeholder

        this.clients = new ThreadSafeLinkedList();

        this.tickLock = new Lock();
        this.lobbyManager = new LobbyManager(CDJ);
        this.game = new LasServerGame(GP, this);

        this.clientIDManager = new IDManager();

        this.mongoDBServer = undefined; // placeholder
        this.mongoDBClient = undefined; // placeholder

        this.setupServer();
    }

    async setupServer(){
        // Set up mongo db first
        await this.setupMongoDB();

        // Set up the WSS Server
        this.setupWSSServer();
    }

    async setupMongoDB(){
        console.log("Attempting MongoDB startup");
        this.mongoDBServer = await MongoMemoryServer.create();
        console.log("MongoDB Server created!");
        this.mongoDBClient = new MongoClient(this.mongoDBServer.getUri(),  {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        // Connect the client
        await this.mongoDBClient.connect();
        console.log("MongoDB connected!");
    }

    async kickWSSClients(){
        let awaitLock = new Lock();
        for (let clientWS of this.WSSServer.clients){
            // If closed, skip
            if (clientWS.readyState === 3){
                continue;
            }
            // Lock the await lock
            awaitLock.lock();
            
            // Set up close handler
            clientWS.once("close", () => { awaitLock.unlock(); })
            
            // Tell healthy clients to close
            if (clientWS.readyState === 1){
                clientWS.close();
            }

            // Wait for the close
            await awaitLock.awaitUnlock();
        }
    }

    async shutDown(){
        console.log("Shutting down HTTPS Server...");
        let httpAwaitLock = new Lock();
        httpAwaitLock.lock();
        this.httpsServer.close(() => {httpAwaitLock.unlock()});
        // Note: Don't await HTTP here

        console.log("Kicking out WSS Clients...");
        // Kick out clients
        await this.kickWSSClients();

        console.log("Shutting down WSS Server...");
        let WSSAwaitLock = new Lock();

        // Wait here for HTTPS Server shut down...
        await httpAwaitLock.awaitUnlock();
        console.log("HTTPS + WSS Shut down!");

        WSSAwaitLock.lock();
        this.WSSServer.close(() => {WSSAwaitLock.unlock()});
        await WSSAwaitLock.awaitUnlock();

        console.log("Shutting down MongoDB Client...");
        await this.mongoDBClient.close(); 

        console.log("Shutting down MongoDB Server...");
        await this.mongoDBServer.stop();

        console.log("Shut down MongoDB!");
    }

    async acceptNewClientsToLobby(availableLobbySlots){
        // Get access to clients
        this.clients.requestAccess();
        // Check which clients want to join
        for (let [client, clientIndex] of this.clients){

            // If zero slots left
            if (availableLobbySlots === 0){
                break;
            }
            // Are they already in the lobby? -> skip
            if (this.lobbyManager.hasClient(client.getID())){
                continue;
            }

            let mailBox = client.getMailBox();

            // Lock mailbox
            await mailBox.requestAccess();
            let folder = mailBox.getFolder("lobby_join");
            let messages = folder["list"];

            if (messages.getLength() > 0){
                let message = messages.get(0);
                // If message isn't read
                if (message["read"] === false){
                    // Add them
                    this.lobbyManager.addClient(client);

                    // Mark message as read
                    message["read"] = true;

                    // Subtract slot
                    availableLobbySlots -= 1;
                }
            }
            // Unlock mailbox
            mailBox.relinquishAccess();
        }
        // Give up access
        this.clients.relinquishAccess();
    }

    async purgeInactiveClients(){
        // Await access
        await this.clients.requestAccess();

        let clientListLength = this.clients.getLength();
        for (let i = clientListLength - 1; i >= 0; i--){
            let client = this.clients.get(i);
            // Remove dead client
            if (client.connectionIsDead()){
                this.clients.pop(i);
            }
        }

        // Relinquish access
        this.clients.relinquishAccess();
    }

    async tick(){
        // Don't tick if still running a tick
        if (this.tickLock.isLocked()){
            return;
        }
        // Not actually awaiting, this just locks it
        this.tickLock.awaitUnlock(true);

        // Purge inactive clients
        await this.purgeInactiveClients();

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
                await this.game.start(this.lobbyManager.transferToGame());
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
        this.httpsServer = https.createServer({
            "cert": fs.readFileSync("./cert.pem"),
            "key": fs.readFileSync("./key.pem")
        });
        this.WSSServer = new WebSocketServer( { "server": this.httpsServer } );

        // Set up connection handling stuff
        this.WSSServer.on("connection", async (connection) => {
            // Await access
            await this.clients.requestAccess();

            // Create
            let clientOBJ = new Client(connection, this.clientIDManager.generateNewID(), this, GP["default_folder_settings"]);
            this.clients.add(clientOBJ);

            // Relinquish access
            this.clients.relinquishAccess();
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

// Shut down
async function shutDown(){
    await SERVER.shutDown();
    process.exit(0);
}

// Set up CTRL + C handler
process.on("SIGINT", shutDown);