
class LasGame {
    constructor(gameProperties){
        this.gameProperties = gameProperties;
        this.wind = new Wind();
        this.ships = new NotSamLinkedList();
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
        // Resets world data
        this.ships.clear();
    }
}