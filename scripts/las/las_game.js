
class LasGame {
    constructor(gameProperties){
        this.gameProperties = gameProperties;
        this.wind = new Wind();
        this.ships = new NotSamLinkedList();
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