class HumanShipController {
    constructor(ship){
        this.ship = ship;
        this.radar = new Radar(ship, MD["radar_settings"]);
    }

    tick(){
        this.radar.tick();
    }

    getShip(){
        return this.ship;
    }

    getDecisionJSON(){
        let lrV = 0;
        let pV = 0;

        let inputManager = GC.getGameUserInputManager();

        if (inputManager.isActivated("ship_left")){
            lrV = -1;
        }else if (inputManager.isActivated("ship_right")){
            lrV = 1;
        }

        if (inputManager.isActivated("sails_inc")){
            pV = 1;
        }else if (inputManager.isActivated("sails_dec")){
            pV = -1;
        }


        let aimingCannons = inputManager.isActivated("aiming_cannon");
        let firingCannons = false;
        let cannonX = null;
        let cannonY = null;
        // If aiming cannon find out where
        if (aimingCannons){
            let game = this.getShip().getGame();
            let middleOfScreenX = game.getFocusedTickX();
            let middleOfScreenY = game.getFocusedTickY();

            let approximateCanvasMiddleX = getScreenWidth()/2;
            let approximateCanvasMiddleY = getScreenHeight()/2;

            // Get a pretty good estimate of cannon x and y
            cannonX = GC.getGMouseX() - approximateCanvasMiddleX + middleOfScreenX;
            cannonY = approximateCanvasMiddleY - GC.getGMouseY() + middleOfScreenY;
            
            firingCannons = inputManager.isActivated("fire_cannons");
        }


        return {"orientation_direction_change": lrV, "sail_strength_change": pV, "aiming_cannons": aimingCannons, "aiming_cannons_position_x": cannonX, "aiming_cannons_position_y": cannonY, "fire_cannons": firingCannons}
    }

    display(){
        let ship = this.getShip();
        this.radar.display();
    }
}