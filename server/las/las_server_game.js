const LasGame = require("../../scripts/las/las_game.js").LasGame;
const Ship = require("../../scripts/las/ship/ship.js").Ship;
const copyObject = require("../../scripts/general/helper_functions.js").copyObject;
const CannonBall = require("../../scripts/las/ship/cannon/cannon_ball/cannon_ball.js").CannonBall;
const GameRecorder = require("./game_recorder.js").GameRecorder;
const BotShipController = require("../../scripts/las/ship/bot_controller/bot_ship_controller.js").BotShipController;

class LasServerGame extends LasGame {
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

    async start(clientData){
        let clientList = clientData["client_data"];
        let clientsArePlayers = clientData["client_role"] === 1;
        // Set running
        this.running = true;
        this.gameStartTime = Date.now();
        // Just testing

        let botControllerModel = copyObject(this.getGameProperties()["saved_models"][0]);
        // Set id
        botControllerModel["id"] = this.getIDManager().generateNewID();

        let tempShipJSON = botControllerModel["ship_json"];
        tempShipJSON["game_instance"] = this;

        let tempShip = new Ship(tempShipJSON);
        this.addShip(tempShip);


        let botController2JSON = botControllerModel["bot_controller_json"];
        botController2JSON["ship"] = tempShip;

        let botController = new BotShipController(botController2JSON);
        this.addBotShipController(botController)

        // Add the clients
        this.clients.addAllFromLL(clientList);

        // Clear client pending decisions
        await this.clearAllClientPendingDecisions();

        // Send opening message
        this.sendOpeningMessage(clientsArePlayers);
    }

    addBotShipController(botShipController){
        this.botShipControllers.push(botShipController);
    }


    sendOpeningMessage(clientsArePlayers){
        let openingMessageJSON = {
            "subject": "game_start",
            "game_details": {
                "server_start_time": this.gameStartTime,
                "game_properties": this.getGameProperties(),
                "clients_are_players": clientsArePlayers,
                "ships": [],
            }
            // TODO
        }

        // If clients are playing, make a ship for each
        let clientShipIDs = {};
        if (clientsArePlayers){
            for (let [client, clientIndex] of this.clients){
                let newShipID = this.getIDManager().generateNewID();
                let newShipJSON = {
                    "starting_x_pos": 450,
                    "starting_y_pos": 0,
                    "starting_speed": 100,
                    "starting_orientation_rad": toRadians(90),
                    "sail_strength": 1,
                    "ship_model": "generic_ship",
                    "ship_colour": this.pickShipColour(),
                    "game_instance": this,
                    "id": newShipID,
                    "health": 50
                }
                this.ships.push(new Ship(newShipJSON));

                // Store ID of ship
                clientShipIDs[clientIndex] = newShipID;
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
                    "sail_strength": ship.getTickSailStrength(),
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

    sendAll(messageJSON){
        for (let [client, clientIndex] of this.clients){
            client.sendJSON(messageJSON);
        }
    }

    tickBotControllers(){
        for (let botShipController of this.botShipControllers){
            botShipController.tick();
        }
    }

    reset(){
        this.running = false;
        this.clients.clear();
        this.tickTimeline.reset();
        this.gameRecorder.reset();
        this.idManager.reset();
        this.wind.reset();
        this.ships.clear();
        this.cannonBalls.clear();
        this.resetColours();
        this.tickCount = 0;
        this.gameStartTime = undefined;
        this.clientIDToShipID = {};
        this.botShipControllers = [];
    }

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
            //this.server.test(this.gameRecorder);

            this.server.addReplay(this.gameRecorder.getReplayString());
        }

        let endMessageJSON = {
            "subject": "end_data",
            "winner_id": winnerShipID
        }
        this.sendAll(endMessageJSON);
        this.reset();

    }

    isRunning(){
        return this.running;
    }

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
            "cannon_ball_hits": cannonBallHits.toList(),
            "cannon_ball_sinkings": cannonBallSinkings.toList(),
            "ship_sinkings": shipSinkings.toList(),
            "new_cannon_shots": newCannonShots.toList()
        }

        // Add ship positions
        for (let [ship, shipIndex] of this.ships){
            positionDataMessageJSON["ship_positions"].push(ship.getPositionJSON());
        }
        // Must be two messages because tick data is read EACH TIME and only most recent position data received is read
        this.sendAll(positionDataMessageJSON);
        this.sendAll(tickDataMessageJSON);
    }

    isReadyToTick(){
        let now = Date.now();
        let expectedTicks = this.calculateExpectedTicks();
        return expectedTicks > this.getTickCount();
    }

    calculateExpectedTicks(){
        return (Date.now() - (this.gameStartTime)) / this.tickGapMS;
    }

    async clearAllClientPendingDecisions(){
        for (let [client, clientIndex] of this.clients){
            await this.clearClientPendingDecisions(client.getMailBox());
        }
    }

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

    async takeAllUserPendingDecisions(){
        for (let [client, clientIndex] of this.clients){
            await this.takeUserPendingDecisions(client.getMailBox());
        }
    }

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
            // Update from received pending decisions
            await this.takeAllUserPendingDecisions();

            // Record
            this.recordShipDecisions();

            //this.getWind().print();
            // Maintenace ticks
            this.tickShips();

            // Tick bot controllers
            this.tickBotControllers();

            // TODO: Update ship orientations, power based on decisions
            this.updateShipOrientationAndSailPower();

            // TODO: Move ships based on orientation and sail power
            this.recordShipPositions();
            this.moveShips();

            // Allow ships to shoot
            this.allowShipsToShoot();

            // Process cannon shots
            this.recordCannonBallPositions();
            this.handleCannonShotMovement();
            this.handleCannonBallCollisionsAndDeaths();
            this.handleNewCannonShots();

            // Take input from the user
            this.updateBotShipDecisions();

            // Update wind
            this.wind.tickUpdate();

            // Output to clients
            this.sendClientsTickAndPositionData();

            // Clean tick timeline
            this.tickTimeline.reset();

            // Up the tick count
            this.incrementTickCount();
        }
    }

    updateBotShipDecisions(){
        // Bot ship controllers
        for (let botShipController of this.botShipControllers){
            botShipController.getShip().updateFromPilot(botShipController.getDecisionJSON());
        }
    }

    recordShipDecisions(){
        let shipDecisionsJSON = {
            "event_type": "ship_decisions_recording",
            "ship_decisions": []
        }
        for (let [ship, shipIndex] of this.getShips()){
            shipDecisionsJSON["ship_decisions"].push({
                "ship_id": ship.getID(),
                "established_decisions": copyObject(ship.getEstablishedDecisions())
            });
        }

        this.gameRecorder.addDecisions(this.getTickCount(), shipDecisionsJSON);
    }

    handleCannonShotMovement(){
        for (let [cannonBall, index] of this.cannonBalls){
            cannonBall.move();
        }
    }

    tickShips(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.tick();
        }
    }

    moveShips(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.moveOneTick();
        }
    }

    allowShipsToShoot(){
        for (let [ship, shipIndex] of this.getShips()){
            ship.checkShoot();
        }
    }

    updateShipOrientationAndSailPower(){
        
        for (let [ship, shipIndex] of this.getShips()){
            ship.updateShipOrientationAndSailPower();
        }
    }

}

module.exports = { LasServerGame } ;