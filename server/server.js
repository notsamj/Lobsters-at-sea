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
const ThreadSafeLinkedList = require("../scripts/general/thread_safe_linked_list.js").ThreadSafeLinkedList;
const LasServerGame = require("./las/las_server_game.js").LasServerGame;
const IDManager = require("../scripts/general/id_manager.js").IDManager;

// Data
const SDJ = require("./server_data.js");
const CDJ = require("./lobby_settings.js");
const GP = require("./game_properties.js");

// Global vars

/*
    Class Name: LASServer
    Description: A server for the game
*/
class LASServer {
    /*
        Method Name: constructor
        Method Parameters: 
            serverDataJSON:
                Server settings json
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(serverDataJSON){
        this.SDJ = serverDataJSON;

        this.httpsServer = undefined; // placeholder
        this.WSServer = undefined; // placeholder

        this.clients = new ThreadSafeLinkedList();

        this.tickLock = new Lock();
        this.lobbyManager = new LobbyManager(CDJ);
        this.game = new LasServerGame(GP, this);

        this.clientIDManager = new IDManager();

        this.mongoDBServer = undefined; // placeholder
        this.mongoDBClient = undefined; // placeholder
        this.mongoDBRefOfDB = undefined; // placeholder

        this.savedReplayCount = 0;

        this.setupServer();
    }


    /*
        Method Name: backupReplayToFile
        Method Parameters:
            replayString:
                Replay string
        Method Description: Saves a replay to file
        Method Return: void
    */
    backupReplayToFile(replayString){
        // Modify to add \ infront of all " so that I can drag into the .js later
        let modifiedString = replayString.replaceAll("\"", "\\\"");
 
        modifiedString = "const LOCAL_REPLAYS = [{\"name\": \"local_replay_1\", \"data\": \"" + modifiedString + "\"}]"

        // Backup
        fs.writeFileSync("replay_backup.replay", modifiedString);
    }


    /*
        Method Name: addReplay
        Method Parameters:
            replayString:
                Replay string
        Method Description: Adds a replay to the database
        Method Return: Promise (implicit)
    */
    async addReplay(replayString){
        // Save to file
        this.backupReplayToFile(replayString);

        // Replay name
        let replayName = "server_replay_" + (this.savedReplayCount++).toString();
        try {
            await this.mongoDBRefOfDB.collection("replays").insertOne({
                "replay_name": replayName,
                "replay_string": replayString
            });
        }catch (error){
            console.error(error);
        }
    }

    /*
        Method Name: setupServer
        Method Parameters: None
        Method Description: Sets up the server
        Method Return: Promise (implicit)
    */
    async setupServer(){
        // Set up mongo db first
        await this.setupMongoDB();

        // Sets up an WSS or WS server
        if (this.isSecure()){
            // Set up the WSS Server
            this.setupWSSServer();
        }else{
            // Set up the WS Server
            this.setupWSServer();
        }

    }

    /*
        Method Name: isSecure
        Method Parameters: None
        Method Description: Checks if using WSS instead of WS
        Method Return: boolean
    */
    isSecure(){
        return this.SDJ["web_socket_secure"];
    }

    /*
        Method Name: setupMongoDB
        Method Parameters: None
        Method Description: Sets up the mongo db server and client
        Method Return: Promise (implicit)
    */
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

        // Add the db
        this.mongoDBRefOfDB = this.mongoDBClient.db("replay_db");

        // Add replay collection
        await this.mongoDBRefOfDB.createCollection("replays");
    }

    /*
        Method Name: kickWSSClients
        Method Parameters: None
        Method Description: Kicks all WSS clients
        Method Return: Promise (implicit)
    */
    async kickWSSClients(){
        let awaitLock = new Lock();
        for (let clientWS of this.WSServer.clients){
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

    /*
        Method Name: shutDown
        Method Parameters: None
        Method Description: Shuts down the server
        Method Return: Promise (implicit)
    */
    async shutDown(){
        // Shut down depending on if secure
        if (this.isSecure()){
            await this.shutDownWSS();
        }else{
            await this.shutDownWS();
        }
    }

    /*
        Method Name: shutDownWS
        Method Parameters: None
        Method Description: Shuts down the server (using WS)
        Method Return: Promise (implicit)
    */
    async shutDownWS(){
        console.log("Kicking out WS Clients...");
        // Kick out clients
        await this.kickWSSClients();

        console.log("Shutting down WS Server...");
        let WSSAwaitLock = new Lock();

        console.log("WS Shut down!");

        WSSAwaitLock.lock();
        this.WSServer.close(() => {WSSAwaitLock.unlock()});
        await WSSAwaitLock.awaitUnlock();

        console.log("Shutting down MongoDB Client...");
        await this.mongoDBClient.close(); 

        console.log("Shutting down MongoDB Server...");
        await this.mongoDBServer.stop();

        console.log("Shut down MongoDB!");
    }

    /*
        Method Name: shutDownWSS
        Method Parameters: None
        Method Description: Shuts down the server (using WSS)
        Method Return: Promise (implicit)
    */
    async shutDownWSS(){
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
        this.WSServer.close(() => {WSSAwaitLock.unlock()});
        await WSSAwaitLock.awaitUnlock();

        console.log("Shutting down MongoDB Client...");
        await this.mongoDBClient.close(); 

        console.log("Shutting down MongoDB Server...");
        await this.mongoDBServer.stop();

        console.log("Shut down MongoDB!");
    }

    /*
        Method Name: acceptNewClientsToLobby
        Method Parameters:
            availableLobbySlots:
                Number of lobby slots available
        Method Description: Accepts n new clients to the lobby
        Method Return: Promise (implicit)
    */
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
            let folder = mailBox.getFolder("desire_to_play_battle");
            let messages = folder["list"];

            if (messages.getLength() > 0){
                let message = messages.get(0);
                // If message isn't read
                if (message["read"] === false && message["data_json"]["value"] === true){
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

    /*
        Method Name: purgeInactiveClients
        Method Parameters: None
        Method Description: Purges inactive clients
        Method Return: Promise (implicit)
    */
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

    /*
        Method Name: handleReplayRequests
        Method Parameters: None
        Method Description: Handles replay requests
        Method Return: Promise (implicit)
    */
    async handleReplayRequests(){
        await this.handleReplayListRequests();
        await this.handleReplayDataRequests();
    }

    /*
        Method Name: handleReplayListRequests
        Method Parameters: None
        Method Description: Looks for and handles client requests for replay list
        Method Return: Promise (implicit)
    */
    async handleReplayListRequests(){
        // Get access to clients
        this.clients.requestAccess();
        // Check which clients want to join
        for (let [client, clientIndex] of this.clients){
            let mailBox = client.getMailBox();

            // Lock mailbox
            await mailBox.requestAccess();
            let folder = mailBox.getFolder("get_replay_list");
            let messages = folder["list"];

            if (messages.getLength() > 0){
                let message = messages.get(0);
                // If message isn't read
                if (message["read"] === false){
                    await this.sendClientReplayList(client);

                    // Mark message as read
                    message["read"] = true;
                }
            }
            // Unlock mailbox
            mailBox.relinquishAccess();
        }
        // Give up access
        this.clients.relinquishAccess();
    }

    /*
        Method Name: sendClientReplayList
        Method Parameters:
            client:
                A client
        Method Description: Sends client the replay list
        Method Return: Promise (implicit)
    */

    async sendClientReplayList(client){
        let dataList = await this.mongoDBRefOfDB.collection("replays").find({}).toArray();
        
        let replayNameList = [];
        for (let entry of dataList){
            replayNameList.push(entry["replay_name"]);
        }

        client.sendJSON({
            "subject": "replay_list_data",
            "replays": replayNameList
        })
    }

    /*
        Method Name: handleReplayDataRequests
        Method Parameters: None
        Method Description: Handles requests for replay data
        Method Return: Promise (implicit)
    */
    async handleReplayDataRequests(){
        // Get access to clients
        this.clients.requestAccess();
        // Check which clients want to join
        for (let [client, clientIndex] of this.clients){
            let mailBox = client.getMailBox();

            // Lock mailbox
            await mailBox.requestAccess();
            let folder = mailBox.getFolder("get_replay_data");
            let messages = folder["list"];

            if (messages.getLength() > 0){
                let message = messages.get(0);
                // If message isn't read
                if (message["read"] === false){
                    await this.sendClientReplayData(client, message["data_json"]["replay_name"]);

                    // Mark message as read
                    message["read"] = true;
                }
            }
            // Unlock mailbox
            mailBox.relinquishAccess();
        }
        // Give up access
        this.clients.relinquishAccess();
    }

    /*
        Method Name: sendClientReplayData
        Method Parameters:
            client:
                A client
            replayName:
                Name of a client (String)
        Method Description: Sends a client replay data
        Method Return: Promise (implicit)
    */
    async sendClientReplayData(client, replayName){
        let dataList = await this.mongoDBRefOfDB.collection("replays").find({}).toArray();
        
        let foudndReplayString = null;
        for (let entry of dataList){
            if (entry["replay_name"] === replayName){
                foudndReplayString = entry["replay_string"];
            }
        }

        client.sendJSON({
            "subject": "replay_data",
            "replay_string": foudndReplayString
        })
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Tick actions
        Method Return: Promise (implicit)
    */
    async tick(){
        // Don't tick if still running a tick
        if (this.tickLock.isLocked()){
            return;
        }
        // Not actually awaiting, this just locks it
        this.tickLock.awaitUnlock(true);

        // Purge inactive clients
        await this.purgeInactiveClients();

        // Handle replay requests
        await this.handleReplayRequests();

        // If the game is running
        if (this.game.isRunning()){
            this.game.tick();
        }
        // Else, game is not running, I am instead running a lobby
        else{
            // Check heartbeat status on all lobby clients and remove any no longer active
            await this.lobbyManager.checkActiveParticipants();

            let availableLobbySlots = this.lobbyManager.getAvailableSlotCount(); // Expect >= 1

            // Accept new clients to lobby
            await this.acceptNewClientsToLobby(availableLobbySlots);

            // If the lobby is full, start game
            if (this.lobbyManager.isFull()){
                await this.game.start(this.lobbyManager.transferToGame());
            }
        }

        // Unlock allowing for a new tick
        this.tickLock.unlock();
    }

    /*
        Method Name: setupWSSServer
        Method Parameters: None
        Method Description: Sets up the WSS server
        Method Return: void
    */
    setupWSSServer(){
        this.httpsServer = https.createServer({
            "cert": fs.readFileSync("./cert.pem"),
            "key": fs.readFileSync("./key.pem")
        });
        this.WSServer = new WebSocketServer( { "server": this.httpsServer } );

        // Set up connection handling stuff
        this.WSServer.on("connection", async (connection) => {
            // Await access
            await this.clients.requestAccess(); 

            // Create
            let clientOBJ = new Client(connection, this.clientIDManager.generateNewID(), this, GP["default_folder_settings"]);
            this.clients.add(clientOBJ);

            // Relinquish access
            this.clients.relinquishAccess();
        });

        this.httpsServer.listen(this.SDJ["port"], () => {
            console.log("WSS (secure) Server running @", this.SDJ["port"]);

            console.log("Lobby settings:", CDJ);
            launchTickSystem();
        });
    }
    /*
        Method Name: setupWSServer
        Method Parameters: None
        Method Description: Sets up the WS server
        Method Return: void
    */
    setupWSServer(){
        this.WSServer = new WebSocketServer( { "port": this.SDJ["port"] } );

        // Set up connection handling stuff
        this.WSServer.on("connection", async (connection) => {
            // Await access
            await this.clients.requestAccess(); 

            // Create
            let clientOBJ = new Client(connection, this.clientIDManager.generateNewID(), this, GP["default_folder_settings"]);
            this.clients.add(clientOBJ);

            // Relinquish access
            this.clients.relinquishAccess();
        });

        console.log("WS (not secure) Server running @", this.SDJ["port"]);

        console.log("Lobby settings:", CDJ);
        launchTickSystem();
    }

    /*
        Method Name: getDataJSON
        Method Parameters: None
        Method Description: Getter
        Method Return: JSON
    */
    getDataJSON(){
        return this.SDJ;
    }
}

// Start up
const SERVER = new LASServer(SDJ);

/*
    Function Name: launchTickSystem
    Function Parameters: None
    Function Description: Starts the tick loop
    Function Return: void
*/
function launchTickSystem(){
    setInterval(tick, 0);
}

/*
    Function Name: tick
    Function Parameters: None
    Function Description: Calls sick on the server
    Function Return: Promise (implicit)
*/
async function tick(){
    SERVER.tick();
}

/*
    Function Name: shutDown
    Function Parameters: None
    Function Description: Shuts down the server
    Function Return: Promise (implicit)
*/
async function shutDown(){
    await SERVER.shutDown();
    process.exit(0);
}

// Set up CTRL + C handler
process.on("SIGINT", shutDown);