const LasGame = require("../../scripts/las/las_game.js").LasGame;
const Ship = require("../../scripts/las/ship/ship.js").Ship;
const copyObject = require("../../scripts/general/helper_functions.js").copyObject;

class LasServerGame extends LasGame {
    constructor(gameProperties, server){
        super(gameProperties);
        this.running = false;

        this.server = server;

        this.gameStartTime = undefined;
        this.tickGapMS = 1000 / gameProperties["tick_rate"]; // float likely
        this.clients = new NotSamLinkedList();
    }

    getServerGameMailbox(){ return this.server.getGameMailbox(); }

    start(clientData){
        let clientList = clientData["client_data"];
        let clientsArePlayers = clientData["client_role"] === 1;
        // Set running
        this.running = true;
        this.gameStartTime = Date.now();
        // Just testing
        let tempShipJSON = {
            "starting_x_pos": 0,
            "starting_y_pos": 0,
            "starting_x_velocity": 0,
            "starting_y_velocity": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 1,
            "ship_model": "generic_ship",
            "game_instance": this,
            "id": this.getIDManager().generateNewID()
        }
        this.ships.push(new Ship(tempShipJSON));

        let tempShipJSON2 = {
            "starting_x_pos": 550,
            "starting_y_pos": 0,
            "starting_x_velocity": 0,
            "starting_y_velocity": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 1,
            "ship_model": "generic_ship",
            "game_instance": this,
            "id": this.getIDManager().generateNewID()
        }
        this.ships.push(new Ship(tempShipJSON2));

        // Add the clients
        this.clients.addAllFromLL(clientList);

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
                    "starting_x_pos": 900,
                    "starting_y_pos": 0,
                    "starting_x_velocity": 0,
                    "starting_y_velocity": 0,
                    "starting_orientation_rad": toRadians(90),
                    "sail_strength": 1,
                    "ship_model": "generic_ship",
                    "game_instance": this,
                    "id": newShipID
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
                    "starting_x_velocity": ship.getTickXV(),
                    "starting_y_velocity": ship.getTickYV(),
                    "starting_orientation_rad": ship.getTickOrientation(),
                    "sail_strength": ship.getTickSailStrength(),
                    "ship_model": ship.getShipModel(),
                    "id": ship.getID()
                }
            );
        }

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
        this.gameRecorder.reset();
        this.idManager.reset();
        this.wind.reset();
        this.ships.clear();
        this.cannonBalls.clear();
        this.tickCount = 0;
        this.gameStartTime = undefined;
        this.getServerGameMailbox().clear();
    }

    end(){
        // TODO: Send END result! Note: Can be ended abruptly or something like this
        console.log("Ending")
        
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

    sendClientsTickData(){
        let tickDataMessageJSON = {
            "subject": "tick_data",
            "server_tick": this.tickCount,
            "tick_data": {
                "ship_positions": []
            }
        }

        // Add ship positions
        for (let [ship, shipIndex] of this.ships){
            tickDataMessageJSON["tick_data"]["ship_positions"].push(ship.getPositionJSON());
        }

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

    async takeUserPendingDecisions(){
        // Get access
        let mailBox = this.server.getGameMailbox();
        await mailBox.getAccess();

        // Read
        let pendingDecisionsFolder = mailBox.getFolder("pending_decisions");
        let decisionsMessages = pendingDecisionsFolder["list"];
        
        // Update decisions
        for (let [messageJSONWrapper, messageIndex] of decisionsMessages){
            let messageJSON = messageJSONWrapper["data_json"];
            let shipID = messageJSON["ship_id"];

            let ship = this.getShipByID(shipID);

            // Update decisions
            //console.log("Updated", messageJSON, messageJSON["pending_decisions"])
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
        //console.log("Tick", this.getTickCount())
        // Check if game still going
        this.determineIfContinuingToRun();

        // If still running after check
        if (this.isRunning()){
            // Update from received pending decisions
            await this.takeUserPendingDecisions();

            // Maintenace ticks
            this.tickShips();

            // TODO: Update ship orientations, power based on decisions
            this.updateShipOrientationAndSailPower();

            // TODO: Move ships based on orientation and sail power
            this.moveShips();

            // Allow ships to shoot
            //this.allowShipsToShoot();

            // Process cannon shots
            //this.handleCannonShotMovement();
            //this.handleNewCannonShots();
            //this.checkForCannonShotHits();

            // Take input from the user
            //this.updateShipDecisions();

            // Update wind
            this.wind.tickUpdate();

            // Output to clients
            this.sendClientsTickData();

            // Up the tick count
            this.incrementTickCount();
        }
    }

    handleCannonShotMovement(){
        for (let [cannonBall, index] of this.cannonBalls){
            cannonBall.move();
        }
    }

    handleNewCannonShots(){
        let newCannonShots = this.getGameRecorder().getEventsOfTickAndType(this.getTickCount(), "cannon_shot");
        let idManager = this.getIDManager();
        let cannonBallSettings = this.getGameProperties()["cannon_ball_settings"];
        for (let [cannonShotObj, index] of newCannonShots){
            // Add an id
            cannonShotObj["id"] = idManager.generateNewID();
            this.cannonBalls.push(new CannonBall(this, cannonShotObj));
        }
    }

    processAllCannonShots(){
        // TODO: collisions
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