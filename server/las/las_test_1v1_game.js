const LasGame = require("../../scripts/las/las_game.js").LasGame;
const Ship = require("../../scripts/las/ship/ship.js").Ship;
const CannonBall = require("../../scripts/las/ship/cannon/cannon_ball/cannon_ball.js").CannonBall;
const BotShipController = require("../../scripts/las/ship/bot_controller/bot_ship_controller.js").BotShipController;

/*
    Class Name: LasTest1v1Game
    Description: For modifying bot settings
*/
class LasTest1v1Game extends LasGame {
    /*
        Method Name: constructor
        Method Parameters: 
            gameProperties:
                JSON with game properties
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(gameProperties){
        super(gameProperties);
        this.running = false;

        this.gameStartTime = undefined;
        this.tickGapMS = 1000 / gameProperties["tick_rate"]; // float likely
        this.winnerID = undefined;
        this.botShipControllers = [];
    }

    /*
        Method Name: getWinnerID
        Method Parameters: None
        Method Description: Gets the winner ID
        Method Return: any
    */
    getWinnerID(){
        return this.winnerID;
    }

    /*
        Method Name: start
        Method Parameters:
            bot1JSON:
                JSON details for bot 1
            bot2JSON:
                JSON details for bot 2
        Method Description: Starts the game
        Method Return: void
    */
    start(bot1JSON, bot2JSON){
        // Set running
        this.running = true;
        this.gameStartTime = performance.now();

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

    /*
        Method Name: tickBotControllers
        Method Parameters: None
        Method Description: Ticks the bot controllers
        Method Return: void
    */
    tickBotControllers(){
        for (let botShipController of this.botShipControllers){
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
        Method Name: end
        Method Parameters: None
        Method Description: End events
        Method Return: void
    */
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
        Method Return: void
    */
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

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Tick actions
        Method Return: void
    */
    tick(){
        // Check if game still going
        this.determineIfContinuingToRun();

        // If still running after check
        if (this.isRunning()){
            // Clean tick timeline
            this.tickTimeline.reset();
            
            // Maintenace ticks
            this.tickShips();

            // Tick bot controllers
            this.tickBotControllers();

            // Updates the established decisions
            this.updateEstablishedDecisions();

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

            // Take input from the user
            this.updateShipDecisions();

            // Update wind
            this.wind.tickUpdate();

            // Up the tick count
            this.incrementTickCount();
        }
    }

    /*
        Method Name: updateBotShipDecisions
        Method Parameters: None
        Method Description: Updates the bot decisions
        Method Return: void
    */
    updateShipDecisions(){
        // Bot ship controllers
        for (let botShipController of this.botShipControllers){
            botShipController.getShip().updateFromPilot(botShipController.getDecisionJSON());
        }
    }

}

module.exports = { LasTest1v1Game } ;