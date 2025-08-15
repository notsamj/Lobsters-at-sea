// If using NodeJS then do imports
if (typeof window === "undefined"){
    GameRecorder = require("./game_recorder.js").GameRecorder;
    IDManager = require("../general/id_manager.js").IDManager;
    SeededRandomizer = require("../general/seeded_randomizer.js").SeededRandomizer;
    Wind = require("./wind/wind.js").Wind;
    NotSamLinkedList = require("../general/notsam_linked_list.js").NotSamLinkedList;
}

class LasGame {
    constructor(gameProperties){
        this.gameProperties = gameProperties;
        this.gameRecorder = new GameRecorder(gameProperties);
        this.idManager = new IDManager();
        this.wind = new Wind(this);
        this.ships = new NotSamLinkedList();
        this.cannonBalls = new NotSamLinkedList();
        this.tickCount = 0;
    }

    getShipByID(shipID){
        let ships = this.getShips();
        for (let [ship, shipIndex] of ships){
            if (ship.getID() === shipID){
                return ship;
            }
        }
        return null;
    }

    incrementTickCount(){
        this.tickCount++;
    }

    getTickCount(){
        return this.tickCount;
    }

    getGameRecorder(){
        return this.gameRecorder;
    }

    getIDManager(){
        return this.idManager;
    }

    getShips(){
        return this.ships;
    }

    addShip(newShip){
        this.ships.add(newShip);
    }

    tick(){
        throw new Exception("Expect to be overwritten.");
    }

    getGameProperties(){
        return this.gameProperties;
    }

    setGameProperties(gamePropertiesJSON){
        this.gameProperties = gamePropertiesJSON;
    }

    getWind(){
        return this.wind;
    }

    reset(){
        console.debug("Reset in las_game.js")
        // Resets world data
        this.wind.reset();
        this.ships.clear();
        this.tickCount = 0;
    }
}

// If run in NodeJS
if (typeof window === "undefined"){
    module.exports = { LasGame }
}