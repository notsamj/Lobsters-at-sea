const WebSocketServer = require("ws").WebSocketServer;
const fs = require("fs");
const https = require("https");

const SDJ = require("./server_data.js");
const CDJ = require("./lobby_settings.js");

// Global vars

// Game
const LasServerGame = require("./las/las_server_game.js");


class LASServer{
    constructor(serverDataJSON){
        this.SDJ = serverDataJSON;
        this.httpsServer = https.createServer({
            "cert": fs.readFileSync("./cert.pem"),
            "key": fs.readFileSync("./key.pem")
        });
        this.WSSServer = new WebSocketServer( { "server": this.httpsServer } );

        this.setupWSSServer();

        this.lobbyManager = new LobbyManager(CDJ);
    }

    setupWSSServer(){
        // Set up connection handling stuff
        this.WSSServer.on("connection", (connection) => {
            // TODO
            /*connection.on("message", (message) => {
                // TODO
            });*/
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
    // TODO
}