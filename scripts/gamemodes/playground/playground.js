class Playground extends Gamemode {

    constructor(){
        super();
        this.prepareTestEnvironment();
    }

    handlePause(){
        if (!GC.getGameTickScheduler().isPaused()){
                GC.getGameTickScheduler().pause();
        }
    }

    handleUnpause(){
        if (GC.getGameTickScheduler().isPaused()){
            GC.getGameTickScheduler().unpause();
        }
    }

    prepareTestEnvironment(){
        let game = this.getGame();

        // Destroy wind
        //game.wind = new DebugStaticWind(this);
        //game.getWind().windMagntiude = 0;
        //game.getWind().windDirectionRAD = toRadians(0);

        let tempShipJSON = {
            "health": randomFloatBetween(20, 100),
            "starting_x_pos": 0,
            "starting_y_pos": 0,
            "starting_speed": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 0,
            "ship_model": "generic_ship",
            "ship_colour": "white",
            "game_instance": game,
            "id": this.getGame().getIDManager().generateNewID()
        }
        let tempShip = new Ship(tempShipJSON);
        //game.addShip(tempShip);

        // Focus
        //game.setFocusedShip(tempShip);
        

        // Add test ship
        let tempShip2JSON = {
            "health": 20,
            "starting_x_pos": 200,
            "starting_y_pos": 100,
            "starting_speed": 0,
            "starting_orientation_rad": toRadians(90),
            "sail_strength": 0,
            "ship_model": "generic_ship",
            "ship_colour": "white",
            "game_instance": game,
            "id": this.getGame().getIDManager().generateNewID()
        }

        let tempShip2 = new Ship(tempShip2JSON);
        //game.addShip(tempShip2);

        // Add a bot controller
        let botControllerJSON = {
            "ship": tempShip2,
            "reaction_time_ticks": 0,
            "update_sail_ticks": 40 * 3,
            "update_enemy_ticks": 40 * 3,
            "update_heading_ticks": 5
        }
        //game.addBotShipController(new BotShipController(botControllerJSON));

        // Add all colors as bots
        let spread = 500;
        let minHealth = 20;
        let maxHealth = 50;
        let count = 8;
        let c = 0;
        for (let colour of this.getGame().getGameProperties()["ship_colours"]){
            if (c++ >= count){
                break;
            }
            let csJSON = {
                "health": randomFloatBetween(minHealth, maxHealth),
                "starting_x_pos": randomFloatBetween(-1 * spread/2, spread/2),
                "starting_y_pos": randomFloatBetween(-1 * spread/2, spread/2),
                "starting_speed": randomFloatBetween(0, 50),
                "starting_orientation_rad": toRadians(randomFloatBetween(0, 360)),
                "sail_strength": randomFloatBetween(0, 1),
                "ship_model": "generic_ship",
                "ship_colour": this.getGame().pickShipColour(),
                "game_instance": game,
                "id": this.getGame().getIDManager().generateNewID()
            }
            let cs = new Ship(csJSON);
            game.addShip(cs);

            let cbJSON = {
                "ship": cs,
                "reaction_time_ticks": randomNumberInclusive(4,15),
                "update_sail_ticks": randomNumberInclusive(40*2,40*3),
                "update_enemy_ticks": randomNumberInclusive(40*2,40*3),
                "update_heading_ticks": randomNumberInclusive(40*4,40*6)
            }

            game.addBotShipController(new BotShipController(cbJSON));
        }
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
        hud.updateElement("x", this.getGame().getFocusedEntity().getTickX().toFixed(2));
        hud.updateElement("x_v", this.getGame().getFocusedEntity().getTickXV().toFixed(2));
        hud.updateElement("y", this.getGame().getFocusedEntity().getTickY().toFixed(2));
        hud.updateElement("y_v", this.getGame().getFocusedEntity().getTickYV().toFixed(2));
        hud.updateElement("speed", this.getGame().getFocusedEntity().getSpeed().toFixed(2));
        hud.updateElement("orientation", toDegrees(this.getGame().getFocusedEntity().getTickOrientation()).toFixed(2));
        hud.updateElement("sail strength", this.getGame().getFocusedEntity().getTickSailStrength().toFixed(2));
        

        // Display HUD
        hud.display();
    }
}