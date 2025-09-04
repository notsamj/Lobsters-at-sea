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

        // Randomize wind
        game.getWind().resetWithNewSeed(randomNumberInclusive(1, 100000));

        // Destroy wind
        game.wind = new DebugStaticWind(this);
        game.wind.windMagntiude = 30;
        game.wind.windDirectionRAD = toRadians(316);
        //game.getWind().windDirectionRAD = toRadians(0);

        let botControllerModel1 = copyObject(MD["saved_models"][0]);
        let tempShipJSON = botControllerModel1["ship_json"];
        tempShipJSON["id"] = "me";

        //tempShipJSON["sail_strength"] = 0.1;
        tempShipJSON["sail_strength"] = 0;

        tempShipJSON["starting_x_pos"] = -250;
        tempShipJSON["starting_y_pos"] = -500;
        tempShipJSON["starting_speed"] = 0;
        tempShipJSON["health"] = 10000;
        tempShipJSON["game_instance"] = game;
        let tempShip = new Ship(tempShipJSON);
        //game.addShip(tempShip);

        console.log("Bot1 model", botControllerModel1["model_name"]);

        // Focus
        //game.setFocusedShip(tempShip);
        

        let botControllerModel2 = copyObject(MD["saved_models"][0]);
        // Add test ship
        let tempShip2JSON = botControllerModel2["ship_json"];
        tempShip2JSON["starting_x_pos"] = -700;
        tempShip2JSON["starting_y_pos"] = -600;
        tempShip2JSON["starting_speed"] = 139;
        tempShip2JSON["sail_strength"] = 0.33;
        tempShip2JSON["starting_orientation_rad"] = toRadians(244.88)

        //tempShip2JSON["starting_x_pos"] = randomFloatBetween(-2000,2000);
        //tempShip2JSON["starting_y_pos"] = randomFloatBetween(-2000,2000);

        tempShip2JSON["ship_colour"] = "red";

        tempShip2JSON["game_instance"] = game;

        let tempShip2 = new Ship(tempShip2JSON);
        game.addShip(tempShip2);

        // Add a bot controller
        let botController2JSON = botControllerModel2["bot_controller_json"];
        botController2JSON["ship"] = tempShip2;

        console.log("Bot2 model", botControllerModel2["model_name"])
        let botController = new BotShipController(botController2JSON);
        //botController.updateSailTickLock.lock();
        //botController.updateSailTickLock.ticksLeft = 999999;
        //game.addBotShipController(botController);

        game.getFocusedEntity().snapToClosestEntity();

        game.setFocusedShip(tempShip2);

        // Add all colors as bots
        let spread = 3000;
        let minHealth = 50;
        let maxHealth = 30;
        let minReactionTimeTicks = 4; // 4 (100ms)
        let maxReactionTimeTicks = 8; // 15 (375ms)
        let count = 1;
        let c = 0;
        let colorBotModel = copyObject(MD["saved_models"][0]);
        console.log("Color bots model", colorBotModel["model_name"])
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
            let cbJSON = copyObject(colorBotModel["bot_controller_json"]);
            cbJSON["ship"] = cs;

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

        this.displayHUD();
    }

    displayHUD(){
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