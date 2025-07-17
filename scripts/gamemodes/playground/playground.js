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
            "sail_strength": 1,
            "ship_model": "generic_ship",
            "game_instance": game
        }
        let tempShip = new Ship(tempShipJSON);
        game.addShip(tempShip);

        // Focus
        game.setFocusedShip(tempShip);
        

        // Add test ship
        let tempShip2JSON = {
            "starting_x_pos": 500,
            "starting_y_pos": 0,
            "starting_x_velocity": 0,
            "starting_y_velocity": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 0,
            "ship_model": "generic_ship",
            "game_instance": game
        }

        let tempShip2 = new Ship(tempShip2JSON);
        game.addShip(tempShip2);
    }

    tick(){
        // Tick the game
        this.getGame().tick();
    }

    getName(){ return "playground"; }

    getGame(){
        return GC.getGameInstance();
    }

    display(){
        // Display game
        this.getGame().display();

        let hud = GC.getHUD();

        // Display FPS
        let fps = GC.getFrameCounter().getFPS();
        hud.updateElement("fps", fps);

        // Display wind direction
        let windDirection = toDegrees(this.getGame().getWind().getWindDirectionRAD()).toFixed(2);
        hud.updateElement("wind direction", windDirection);
        hud.updateElement("wind force", this.getGame().getWind().getWindMagnitude().toFixed(2));

        // Display HUD for focused ship
        if (this.getGame().hasFocusedShip()){
            let focusedShip = this.getGame().getFocusedShip();
            hud.updateElement("x", focusedShip.getTickX().toFixed(2));
            hud.updateElement("x_v", focusedShip.getTickXV().toFixed(2));
            hud.updateElement("y", focusedShip.getTickY().toFixed(2));
            hud.updateElement("y_v", focusedShip.getTickYV().toFixed(2));
            hud.updateElement("orientation", toDegrees(focusedShip.getTickOrientation()).toFixed(2));
            hud.updateElement("sail strength", focusedShip.getTickSailStrength().toFixed(2));
        }

        // Display HUD
        hud.display();
    }
}