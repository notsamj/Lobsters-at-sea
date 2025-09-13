const LasGame = require("../../scripts/las/las_game.js").LasGame;
const Ship = require("../../scripts/las/ship/ship.js").Ship;
const copyObject = require("../../scripts/general/helper_functions.js").copyObject;
const randomNumberInclusive = require("../../scripts/general/helper_functions.js").randomNumberInclusive;
const CannonBall = require("../../scripts/las/ship/cannon/cannon_ball/cannon_ball.js").CannonBall;
const GameRecorder = require("./game_recorder.js").GameRecorder;
const BotShipController = require("../../scripts/las/ship/bot_controller/bot_ship_controller.js").BotShipController;

/*
    Class Name: LasServerGame
    Description: A LasGame game running on a server
*/
class LasServerGame extends LasGame {
    /*
        Method Name: constructor
        Method Parameters: 
            gameProperties:
                Game properties in a JSON
            server:
                A server class reference
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(gameProperties, server){
        super(gameProperties);
        this.running = false;

        this.server = server;

        this.gameRecorder = new GameRecorder(gameProperties["game_recorder_settings"]);

        this.gameStartTime = undefined;
        this.tickGapMS = 1000 / gameProperties["tick_rate"]; // float likely
        this.clients = new NotSamLinkedList();
        this.clientIDToShipID = {};
        this.botShipControllers = [];
    }

    /*
        Method Name: start
        Method Parameters:
            setupData:
                JSON with setup data
        Method Description: Starts the game
        Method Return: Promise (implicit)
    */
    async start(setupData){
        // Reset
        this.reset();

        let clientList = setupData["client_data"];
        let clientsArePlayers = setupData["expected_players_data"]["player_role"] === 1;
        // Set running
        this.running = true;
        this.gameStartTime = performance.now();

        // Add the clients
        this.clients.addAllFromLL(clientList);

        // Add bots
        this.addBots(setupData["bot_data"], setupData["gamemode_data"]);

        // Clear client pending decisions
        await this.clearAllClientPendingDecisions();

        // Send opening message
        this.spawnClientsAndSendOpeningMessage(clientsArePlayers, setupData["gamemode_data"]);
    }

    /*
        Method Name: addBots
        Method Parameters:
            botData:
                JSON with bot info
            gamemodeData:
                JSON with info about the gammode
        Method Description: Adds bots to the game
        Method Return: void
    */
    addBots(botData, gamemodeData){
        // Find bot model
        let botModel = undefined;

        for (let model of this.getGameProperties()["saved_models"]){
            // If the model is found
            if (model["model_name"] === botData["bot_model_name"]){
                botModel = model;
                break;
            }
        }

        // If not found -> Error
        if (botModel === undefined){
            throw new Error("Failed to find bot model: " + botModel + ".");
        }


        // Add bots
        for (let i = 0; i < botData["bot_count"]; i++){
            let botModelCopy = copyObject(botModel);

            let botShipJSON = botModelCopy["ship_json"];
            botShipJSON["id"] = this.getIDManager().generateNewID();
            botShipJSON["game_instance"] = this;

            // Set varied settings
            botShipJSON["starting_x_pos"] = randomFloatBetween(-1 * gamemodeData["spread"]/2, gamemodeData["spread"]/2);
            botShipJSON["starting_y_pos"] = randomFloatBetween(-1 * gamemodeData["spread"]/2, gamemodeData["spread"]/2);
            botShipJSON["starting_speed"] = 0;
            botShipJSON["starting_orientation_rad"] = toRadians(randomFloatBetween(0, 360));
            botShipJSON["starting_sail_strength"] = randomFloatBetween(0, 1);
            botShipJSON["ship_colour"] = this.pickShipColour();

            let botShip = new Ship(botShipJSON);
            this.addShip(botShip);

            let botControllerJSON = botModelCopy["bot_controller_json"];
            botControllerJSON["ship"] = botShip;
            let botShipController = new BotShipController(botControllerJSON);
            this.addBotShipController(botShipController);
        }
    
    }

    /*
        Method Name: addBotShipController
        Method Parameters:
            botShipController:
                JSON with bot ship controller info
        Method Description: Adds a bot ship controller
        Method Return: void
    */
    addBotShipController(botShipController){
        this.botShipControllers.push(botShipController);
    }

    /*
        Method Name: spawnClientsAndSendOpeningMessage
        Method Parameters:
            clientsArePlayers:
                Boolean specifying if clients are playing or spectating
            gamemodeData:
                JSON with gamemode info
        Method Description: Spawns clients and send the opening message
        Method Return: void
    */
    spawnClientsAndSendOpeningMessage(clientsArePlayers, gamemodeData){
        let openingMessageJSON = {
            "subject": "game_start",
            "game_details": {
                "server_start_time": this.gameStartTime,
                "game_properties": this.getGameProperties(),
                "clients_are_players": clientsArePlayers,
                "ships": [],
            }
        }

        // If clients are playing, make a ship for each
        let clientShipIDs = {};
        if (clientsArePlayers){
            for (let [client, clientIndex] of this.clients){
                let playerModel = this.getGameProperties()["saved_models"][0]; // Best model
                let newShipJSON = copyObject(playerModel["ship_json"]); 
                newShipJSON["id"] = this.getIDManager().generateNewID();
                newShipJSON["starting_x_pos"] = randomFloatBetween(-1 * gamemodeData["spread"]/2, gamemodeData["spread"]/2);
                newShipJSON["starting_y_pos"] = randomFloatBetween(-1 * gamemodeData["spread"]/2, gamemodeData["spread"]/2);
                newShipJSON["starting_speed"] = 0;
                newShipJSON["starting_orientation_rad"] = toRadians(randomFloatBetween(0, 360));
                newShipJSON["starting_sail_strength"] = 1;
                newShipJSON["ship_colour"] = this.pickShipColour();
                newShipJSON["game_instance"] = this;

                this.ships.push(new Ship(newShipJSON));

                // Store ID of ship
                clientShipIDs[clientIndex] = newShipJSON["id"];
            }
        }

        // Add ship data

        let shipsList = openingMessageJSON["game_details"]["ships"];
        for (let [ship, shipIndex] of this.ships){
            shipsList.push(
                {
                    "starting_x_pos": ship.getTickX(),
                    "starting_y_pos": ship.getTickY(),
                    "starting_speed": ship.getSpeed(),
                    "starting_orientation_rad": ship.getTickOrientation(),
                    "starting_sail_strength": ship.getTickSailStrength(),
                    "ship_model": ship.getShipModel(),
                    "ship_colour": ship.getColour(),
                    "id": ship.getID(),
                    "health": ship.getHealth()
                }
            );
        }

        let openingMessageForRecordingEvent = copyObject(openingMessageJSON);

        openingMessageForRecordingEvent["event_type"] = "opening_game_representation";

        // Set the opening message
        this.gameRecorder.setOpeningMessage(openingMessageForRecordingEvent);

        // Send each client a personalized message
        for (let [client, clientIndex] of this.clients){
            let personalizedMessage = copyObject(openingMessageJSON);

            // Add their ship id to message
            if (clientsArePlayers){
                personalizedMessage["game_details"]["your_ship_id"] = clientShipIDs[clientIndex];

                // Store ship idea of each client
                this.clientIDToShipID[client.getID()] = clientShipIDs[clientIndex];
            }

            client.sendJSON(personalizedMessage);
        }
    }

    /*
        Method Name: sendAll
        Method Parameters:
            messageJSON:
                A JSON to send
        Method Description: Sends all the clients a JSON
        Method Return: void
    */
    sendAll(messageJSON){
        for (let [client, clientIndex] of this.clients){
            client.sendJSON(messageJSON);
        }
    }

    /*
        Method Name: tickBotControllers
        Method Parameters: None
        Method Description: Tick actions for bot controllers
        Method Return: void
    */
    tickBotControllers(){
        for (let botShipController of this.botShipControllers){
            if (botShipController.getShip().isDead()){ continue; }
            botShipController.tick();
        }
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the game
        Method Return: void
    */
    reset(){
        // Reset seed
        this.getGameProperties()["random_seed"] = randomNumberInclusive(1, 100000);

        this.running = false;
        this.clients.clear();
        this.tickTimeline.reset();
        this.gameRecorder.reset();
        this.idManager.reset();
        this.wind.resetWithNewSeed(this.getGameProperties()["random_seed"]);
        this.ships.clear();
        this.cannonBalls.clear();
        this.resetColours();
        this.tickCount = 0;
        this.gameStartTime = undefined;
        this.clientIDToShipID = {};
        this.botShipControllers = [];
    }

    /*
        Method Name: end
        Method Parameters: None
        Method Description: End events
        Method Return: void
    */
    end(){
        let winnerShipID = null;
        let aliveCount = 0;

        // Try to find the winner
        for (let [ship, shipIndex] of this.ships){
            if (ship.isAlive()){
                aliveCount++;
                if (aliveCount > 1){
                    break;
                }
                winnerShipID = ship.getID();
            }
        }

        let gameCompleted = winnerShipID != null;
        
        // If game successfully completed then get replay string
        if (gameCompleted){
            this.gameRecorder.setLastTick(this.getTickCount() - 1);

            this.server.addReplay(this.gameRecorder.getReplayString());
        }

        let endMessageJSON = {
            "subject": "end_data",
            "winner_id": winnerShipID
        }
        this.sendAll(endMessageJSON);

        // No longe running
        this.running = false;
    }

    /*
        Method Name: isRunning
        Method Parameters: None
        Method Description: Checks if the game is still running
        Method Return: boolean
    */
    isRunning(){
        return this.running;
    }

    /*
        Method Name: determineIfContinuingToRun
        Method Parameters: None
        Method Description: Checks if the game should continue running
        Method Return: Promise (implicit)
    */
    async determineIfContinuingToRun(){
        // Purge clients
        let shipsIDsToKill = await this.checkActiveParticipants();

        // Kill these ships of disconnected players
        for (let shipID of shipsIDsToKill){
            this.getShipByID(shipID).kill();
        }

        // If no clients left, stop running
        if (this.clients.getLength() === 0){
            this.end();
            return;
        }

        let shipsAlive = 0;
        for (let [ship, shipIndex] of this.ships){
            if (!ship.isDead()){
                shipsAlive++;
            }
        }

        // If 1 or fewer ships are left, game is over
        if (shipsAlive <= 1){
            this.end();
            return;
        }


        // Check max delay
        let tickCountIfITickNow = this.getTickCount() + 1;
        let expectedTicks = this.calculateExpectedTicks();
        let tickDiff = expectedTicks - tickCountIfITickNow;

        let timeGap = tickDiff * this.tickGapMS;
        if (timeGap > this.getGameProperties()["max_delay_ms"]){
            this.end();
            return;
        }
    }

    /*
        Method Name: checkActiveParticipants
        Method Parameters: None
        Method Description: Checks for participants taht are still active
        Method Return: Promise (implicit)
    */
    async checkActiveParticipants(){
        let removalFunc = async (client) => {
            return client.connectionIsDead() || (!(await client.checkForStatus("desire_to_play_battle")));
        }

        let shipIDsToDelete = [];

        // Remove clients meeting removal function criteria
        for (let [client, clientIndex] of this.clients){
            // If client needs to be removed
            if (await removalFunc(client)){

                // Save ship id if applicable
                if (objectHasKey(this.clientIDToShipID, client.getID())){
                    shipIDsToDelete.push(this.clientIDToShipID[client.getID()]);
                }

                this.clients.pop(clientIndex);
            }
        }

        return shipIDsToDelete;
    }

    /*
        Method Name: sendClientsTickAndPositionData
        Method Parameters: None
        Method Description: Sends clients needed data
        Method Return: void
    */
    sendClientsTickAndPositionData(){
        let cannonBallSinkings = this.getTickTimeline().getEventsOfType("cannon_ball_sunk");
        let cannonBallHits = this.getTickTimeline().getEventsOfType("cannon_ball_hit");
        let shipSinkings = this.getTickTimeline().getEventsOfType("ship_sunk");
        let newCannonShots = this.getTickTimeline().getEventsOfType("cannon_shot");
        let positionDataMessageJSON = {
            "subject": "position_data",
            "server_tick": this.tickCount,
            "ship_positions": []
        }

        let tickDataMessageJSON = {
            "subject": "tick_data",
            "server_tick": this.tickCount,
            "cannon_ball_hits": cannonBallHits.toArray(),
            "cannon_ball_sinkings": cannonBallSinkings.toArray(),
            "ship_sinkings": shipSinkings.toArray(),
            "new_cannon_shots": newCannonShots.toArray()
        }

        // Add ship positions
        for (let [ship, shipIndex] of this.ships){
            positionDataMessageJSON["ship_positions"].push(ship.getPositionJSON());
        }
        // Must be two messages because tick data is read EACH TIME and only most recent position data received is read
        this.sendAll(positionDataMessageJSON);
        this.sendAll(tickDataMessageJSON);
    }

    /*
        Method Name: isReadyToTick
        Method Parameters: None
        Method Description: Checks if the gamemode is ready to tick
        Method Return: boolean
    */
    isReadyToTick(){
        let now = performance.now();
        let expectedTicks = this.calculateExpectedTicks();
        return expectedTicks > this.getTickCount();
    }

    /*
        Method Name: calculateExpectedTicks
        Method Parameters: None
        Method Description: Calculates the number of ticks expected
        Method Return: float
    */
    calculateExpectedTicks(){
        return (performance.now() - (this.gameStartTime)) / this.tickGapMS;
    }

    /*
        Method Name: clearAllClientPendingDecisions
        Method Parameters: None
        Method Description: Clears pending decision mailboxes
        Method Return: Promise (implicit)
    */
    async clearAllClientPendingDecisions(){
        for (let [client, clientIndex] of this.clients){
            await this.clearClientPendingDecisions(client.getMailBox());
        }
    }

    /*
        Method Name: clearClientPendingDecisions
        Method Parameters:
            mailBox:
                A mailbox
        Method Description: Clears client pending decisions
        Method Return: Promise (implicit)
    */
    async clearClientPendingDecisions(mailBox){
        // Get access
        await mailBox.requestAccess();

        // Read
        let pendingDecisionsFolder = mailBox.getFolder("pending_decisions");
        let decisionsMessages = pendingDecisionsFolder["list"];

        // Delete all messages
        decisionsMessages.clear();

        // Give up access
        mailBox.relinquishAccess();
    }

    /*
        Method Name: takeAllUserPendingDecisions
        Method Parameters: None
        Method Description: Reads user pending decisions
        Method Return: Promise (implicit)
    */
    async takeAllUserPendingDecisions(){
        for (let [client, clientIndex] of this.clients){
            await this.takeUserPendingDecisions(client.getMailBox());
        }
    }

    /*
        Method Name: takeUserPendingDecisions
        Method Parameters: 
            mailBox:
                A mailbox
        Method Description: Take one user's pending decisions
        Method Return: Promise (implicit)
    */
    async takeUserPendingDecisions(mailBox){
        // Get access
        await mailBox.requestAccess();

        // Read
        let pendingDecisionsFolder = mailBox.getFolder("pending_decisions");
        let decisionsMessages = pendingDecisionsFolder["list"];
        
        // Update decisions
        for (let [messageJSONWrapper, messageIndex] of decisionsMessages){
            let messageJSON = messageJSONWrapper["data_json"];
            let shipID = messageJSON["ship_id"];

            let ship = this.getShipByID(shipID);

            // Update decisions
            ship.updateFromPilot(messageJSON["pending_decisions"]);
        }

        // Delete all messages
        decisionsMessages.clear();

        // Give up access
        mailBox.relinquishAccess();
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Tick actions
        Method Return: Promise (implicit)
    */
    async tick(){
        // Tick cooldown
        if (!this.isReadyToTick()){
            return;
        }

        // If game over
        if (!this.isRunning()){
            return;
        }


        // Check if game still going
        await this.determineIfContinuingToRun();

        // If still running after check
        if (this.isRunning()){
            // Clean tick timeline
            this.tickTimeline.reset();
            
            // Update from received pending decisions
            await this.takeAllUserPendingDecisions();

            // Maintenace ticks
            this.tickShips();

            // Tick bot controllers
            this.tickBotControllers();

            // Updates the established decisions
            this.updateEstablishedDecisions();

            // Record establish decisions
            this.recordShipDecisions(); 

            // Record ship positions then moves the ships
            this.recordShipPositions();
            this.moveShips();

            // Allow ships to shoot
            this.allowShipsToShoot();

            // Process cannon shots
            this.recordCannonBallPositions();
            this.handleCannonShotMovement();
            this.handleCannonBallCollisionsAndDeaths();
            this.handleNewCannonShots();

            // Process kills
            this.processKills();

            // Take input from the user
            this.updateBotShipDecisions();

            // Update wind
            this.wind.tickUpdate();

            // Output to clients
            this.sendClientsTickAndPositionData();

            // Up the tick count
            this.incrementTickCount();
        }
    }

    /*
        Method Name: processKills
        Method Parameters: None
        Method Description: Process kills for vampire effect
        Method Return: void
    */
    processKills(){
        let shipSinkings = this.getTickTimeline().getEventsOfType("ship_sunk");

        let vampireHealthAmount = this.getGameProperties()["saved_models"][0]["ship_json"]["health"];

        // Apply vampire effect
        for (let [shipSinkingObj, shipSinkingIndex] of shipSinkings){
            // Ignore suicide where there's no vampire effect
            if (shipSinkingObj["shooter_ship_id"] === null){ continue; }
            let killerShip = this.getShipByID(shipSinkingObj["shooter_ship_id"]);

            // Doesn't apply if killer is dead
            if (killerShip.isDead()){ continue; }
            killerShip.setHealth(killerShip.getHealth() + vampireHealthAmount);
        }
    }

    /*
        Method Name: updateBotShipDecisions
        Method Parameters: None
        Method Description: Updates the bot decisions
        Method Return: void
    */
    updateBotShipDecisions(){
        // Bot ship controllers
        for (let botShipController of this.botShipControllers){
            botShipController.getShip().updateFromPilot(botShipController.getDecisionJSON());
        }
    }

    /*
        Method Name: recordShipDecisions
        Method Parameters: None
        Method Description: Saves ship decisions and records them
        Method Return: void
    */
    recordShipDecisions(){
        let shipDecisionsJSON = {
            "event_type": "ship_decisions_recording",
            "ship_decisions": []
        }
        for (let [ship, shipIndex] of this.getShips()){
            let decisions = copyObject(ship.getEstablishedDecisions());

            // Apply band-aid for trimming
            if (!decisions["fire_cannons"]){
                decisions["aiming_cannons_position_x"] = undefined;
                decisions["aiming_cannons_position_y"] = undefined;
            }

            shipDecisionsJSON["ship_decisions"].push({
                "ship_id": ship.getID(),
                "established_decisions": decisions
            });
        }

        this.gameRecorder.addDecisions(this.getTickCount(), shipDecisionsJSON);
    }

}

module.exports = { LasServerGame } ;