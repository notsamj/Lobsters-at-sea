// If using NodeJS then do imports
if (typeof window === "undefined"){
    BotPerception = require("./bot_perception.js").BotPerception;
}
class BotShipController {
    constructor(botShipControllerJSON){
        this.ship = botShipControllerJSON["ship"];

        this.perception = new BotPerception(botShipControllerJSON["reaction_time_ticks"]);

        this.workingData = {}

        this.decisions = {
            "orientation_direction_change": 0,
            "sail_strength_change": 0,
            "aiming_cannons": false,
            "aiming_cannons_position_x": undefined,
            "aiming_cannons_position_y": undefined,
            "fire_cannons": false
        }
    }

    tick(){
        // Save tick
        this.workingData["tick"] = this.getShip().getGame().getTickCount();

        // Update perception
        this.updatePerception();

        // Make decisions
        this.makeDecisions();
    }

    updatePerception(){
        let currentTick = this.workingData["tick"];

        let myShip = this.getShip();
        let game = myShip.getGame();
        let wind = game.getWind();

        // Whether I have any data for this tick
        this.perception.inputData("default", true, currentTick);

        // Save my data
        // TODO

        // Save wind direction
        let windDirectionRAD = wind.getWindDirectionRAD();
        this.perception.inputData("wind_direction_rad", windDirectionRAD, currentTick);

        // Save wind magnitude
        let windDirectionMagnitude = wind.getWindMagnitude();
        this.perception.inputData("wind_direction_magnitude", windDirectionMagnitude, currentTick);
    }

    makeDecisions(){
        // If no data -> No decision changes
        if (!this.perception.hasDataToReactTo("default", this.workingData["tick"])){ return; }


        /*
            Determine best target ship
            Aim to go upwind of the target ship

            determineDesiredHeading();
                Find the most dangerous ship to you. Aim upwind of it.
            determineShooting();
                Find all ships that you can hit. Shoot at them.
            determineSailStrengthAndDirection();
                Based on desired heading + wind set sail strength
        */
        this.determineSailStrength();
    }

    determineSailStrength(){
        let windDirection
    }

    getShip(){
        return this.ship;
    }

    getDecisionJSON(){
        return this.decisions;
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { BotShipController }
}
