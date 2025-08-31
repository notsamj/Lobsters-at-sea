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
            pV = 0;
        }


        let aimingCannons = inputManager.isActivated("aiming_cannon");
        let firingCannons = false;
        let cannonX = null;
        let cannonY = null;
        // If aiming cannon find out where
        if (aimingCannons){
            let ship = this.getShip();
            let game = ship.getGame();
            let middleOfScreenX = game.getFocusedTickX();
            let middleOfScreenY = game.getFocusedTickY();

            let approximateCanvasMiddleX = getScreenWidth()/2;
            let approximateCanvasMiddleY = getScreenHeight()/2;

            // Get a pretty good estimate of cannon x and y
            cannonX = GC.getGMouseX() - approximateCanvasMiddleX + middleOfScreenX;
            cannonY = approximateCanvasMiddleY - GC.getGMouseY() + middleOfScreenY;

            // Make relative to the ship
            cannonX = cannonX - ship.getTickX();
            cannonY = cannonY - ship.getTickY();
                
            // Round
            cannonX = Math.round(cannonX);
            cannonY = Math.round(cannonY);

            firingCannons = inputManager.isActivated("fire_cannons");
        }

        let finalDecisionJSON = {
            "orientation_direction_change": lrV,
            "new_sail_strength": pV,
            "aiming_cannons": aimingCannons,
            "aiming_cannons_position_x": cannonX,
            "aiming_cannons_position_y": cannonY,
            "fire_cannons": firingCannons
        }
        return finalDecisionJSON;
    }

    display(){
        let ship = this.getShip();
        this.radar.display();
    }
}