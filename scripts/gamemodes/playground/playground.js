class Playground extends Gamemode {

    constructor(){
        super();
        this.prepareTestEnvironment();
    }

    prepareTestEnvironment(){
        let game = this.getGame();

        let tempShipJSON = {
            "starting_x_pos": 0,
            "starting_y_pos": 0,
            "starting_x_velocity": 0,
            "starting_y_velocity": 0,
            "starting_orientation_rad": toRadians(90),
            "orientation_power": 1,
            "ship_model": "generic_ship",
            "game_instance": game
        }
        let tempShip = new Ship(tempShipJSON);
        game.addShip(tempShip);

        // Focus
        game.setFocusedShip(tempShip);
        console.debug("Setup ships")
    }

    tick(){
        // TODO
    }

    getName(){ return "playground"; }

    getGame(){
        return GC.getGameInstance();
    }

    display(){
        // Display game
        this.getGame().display();


        // Display FPS
        let fps = GC.getFrameCounter().getFPS();
        let hud = GC.getHUD();
        hud.updateElement("fps", fps);
        hud.display();
    }
}