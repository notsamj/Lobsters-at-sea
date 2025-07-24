
class LasGame {
    constructor(gameProperties){
        this.gameProperties = gameProperties;
        this.gameRecorder = new GameRecorder(gameProperties);
        this.idManager = new IDManager();
        this.randomizer = new SeededRandomizer(gameProperties["random_seed"]);
        this.wind = new Wind(this);
        this.ships = new NotSamLinkedList();
        this.cannonBalls = new NotSamLinkedList();
        this.tickCount = 0;
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

    getRandom(){
        return this.randomizer;
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

    getWind(){
        return this.wind;
    }

    reset(){
        console.debug("Reset")
        // Resets world data
        this.ships.clear();
    }
}

if (typeof window === "undefined"){
    module.exports = { LasGame }
}