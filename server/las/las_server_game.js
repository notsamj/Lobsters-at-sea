const LasGame = require("../../scripts/las/las_game.js").LasGame;
const Ship = require("../../scripts/las/ship/ship.js").Ship;
const copyObject = require("../../scripts/general/helper_functions.js").copyObject;
const CannonBall = require("../../scripts/las/ship/cannon/cannon_ball/cannon_ball.js").CannonBall;
const GameRecorder = require("./game_recorder.js").GameRecorder;

class LasServerGame extends LasGame {
    constructor(gameProperties, server){
        super(gameProperties);
        this.running = false;

        this.server = server;

        this.gameRecorder = new GameRecorder();

        this.gameStartTime = undefined;
        this.tickGapMS = 1000 / gameProperties["tick_rate"]; // float likely
        this.clients = new NotSamLinkedList();
    }

    async start(clientData){
        let clientList = clientData["client_data"];
        let clientsArePlayers = clientData["client_role"] === 1;
        // Set running
        this.running = true;
        this.gameStartTime = Date.now();
        // Just testing
        let tempShipJSON = {
            "starting_x_pos": 0,
            "starting_y_pos": 0,
            "starting_speed": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 1,
            "ship_model": "generic_ship",
            "ship_colour": this.pickShipColour(),
            "game_instance": this,
            "id": this.getIDManager().generateNewID(),
            "health": 10
        }
        this.ships.push(new Ship(tempShipJSON));

        let tempShipJSON2 = {
            "starting_x_pos": 350,
            "starting_y_pos": 0,
            "starting_speed": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 1,
            "ship_model": "generic_ship",
            "ship_colour": this.pickShipColour(),
            "game_instance": this,
            "id": this.getIDManager().generateNewID(),
            "health": 10
        }
        this.ships.push(new Ship(tempShipJSON2));

        // Add the clients
        this.clients.addAllFromLL(clientList);

        // Clear client pending decisions
        await this.clearAllClientPendingDecisions();

        // Send opening message
        this.sendOpeningMessage(clientsArePlayers);
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
                    "starting_speed": 0,
                    "starting_orientation_rad": toRadians(90),
                    "sail_strength": 1,
                    "ship_model": "generic_ship",
                    "ship_colour": this.pickShipColour(),
                    "game_instance": this,
                    "id": newShipID,
                    "health": 10
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
            }

            client.sendJSON(personalizedMessage);
        }
    }

    sendAll(messageJSON){
        for (let [client, clientIndex] of this.clients){
            client.sendJSON(messageJSON);
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
            //console.log(this.tickTimeline.getReplayString());
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

    determineIfContinuingToRun(){
        // Purge clients
        this.checkActiveParticipants();
        // If no clients left, stop running
        if (this.clients.getLength() === 0){
            this.end();
            return;
        }

        // TODO: Kill ships linked to clients that are gone

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

    checkActiveParticipants(){
        let removalFunc = (client) => {
            return client.connectionIsDead();
        }
        this.clients.deleteWithCondition(removalFunc);
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
        this.determineIfContinuingToRun();

        // If still running after check
        if (this.isRunning()){
            // Update from received pending decisions
            await this.takeAllUserPendingDecisions();

            // Record
            this.recordShipDecisions();

            //this.getWind().print();
            // Maintenace ticks
            this.tickShips();

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