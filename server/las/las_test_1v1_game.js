const LasGame = require("../../scripts/las/las_game.js").LasGame;
const Ship = require("../../scripts/las/ship/ship.js").Ship;
const CannonBall = require("../../scripts/las/ship/cannon/cannon_ball/cannon_ball.js").CannonBall;
const BotShipController = require("../../scripts/las/ship/bot_controller/bot_ship_controller.js").BotShipController;

class LasTest1v1Game extends LasGame {
    constructor(gameProperties){
        super(gameProperties);
        this.running = false;

        this.gameStartTime = undefined;
        this.tickGapMS = 1000 / gameProperties["tick_rate"]; // float likely
        this.winnerID = undefined;
        this.botShipControllers = [];
    }

    getWinnerID(){
        return this.winnerID;
    }

    start(bot1JSON, bot2JSON){
        // Set running
        this.running = true;
        this.gameStartTime = Date.now();

        // Bot 1
        let bot1Ship = new Ship(bot1JSON["ship_json"]);
        this.addShip(bot1Ship);
        bot1JSON["bot_controller_json"]["ship"] = bot1Ship;
        let bot1Controller = new BotShipController(bot1JSON["bot_controller_json"]);
        this.addBotShipController(bot1Controller);

        // Bot 2
        let bot2Ship = new Ship(bot2JSON["ship_json"]);
        this.addShip(bot2Ship);
        bot2JSON["bot_controller_json"]["ship"] = bot2Ship;
        let bot2Controller = new BotShipController(bot2JSON["bot_controller_json"]);
        this.addBotShipController(bot2Controller);
    }

    tickBotControllers(){
        for (let botShipController of this.botShipControllers){
            botShipController.tick();
        }
    }

    reset(){
        this.running = false;
        this.tickTimeline.reset();
        this.idManager.reset();
        this.wind.reset();
        this.ships.clear();
        this.cannonBalls.clear();
        this.resetColours();
        this.tickCount = 0;
        this.gameStartTime = undefined;
        this.botShipControllers = [];
    }

    addBotShipController(botShipController){
        this.botShipControllers.push(botShipController);
    }

    end(){
        let winnerShipID = "tie";
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

        this.winnerID = winnerShipID;
        this.running = false;

    }

    isRunning(){
        return this.running;
    }

    determineIfContinuingToRun(){
        let shipsAlive = 0;
        for (let [ship, shipIndex] of this.ships){
            if (!ship.isDead()){
                shipsAlive++;
            }
        }

        // If 1 or fewer ships are left, game is over
        if (shipsAlive <= 1){
            this.end();
        }
    }

    tick(){
        // Check if game still going
        this.determineIfContinuingToRun();

        // If still running after check
        if (this.isRunning()){
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
            this.updateShipDecisions();

            // Update wind
            this.wind.tickUpdate();

            // Clean tick timeline
            this.tickTimeline.reset();

            // Up the tick count
            this.incrementTickCount();
        }
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

    updateShipDecisions(){
        // Bot ship controllers
        for (let botShipController of this.botShipControllers){
            botShipController.getShip().updateFromPilot(botShipController.getDecisionJSON());
        }
    }

}

module.exports = { LasTest1v1Game } ;