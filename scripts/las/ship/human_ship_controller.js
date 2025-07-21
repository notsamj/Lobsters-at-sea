class HumanShipController {
    constructor(ship){
        this.ship = ship;
    }

    getShip(){
        return this.ship;
    }

    getDecisionJSON(){
        let lrV = 0;
        let pV = 0;
        if (GC.getGameUserInputManager().isActivated("ship_left")){
            lrV = -1;
        }else if (GC.getGameUserInputManager().isActivated("ship_right")){
            lrV = 1;
        }

        if (GC.getGameUserInputManager().isActivated("sails_inc")){
            pV = 1;
        }else if (GC.getGameUserInputManager().isActivated("sails_dec")){
            pV = -1;
        }

        return {"orientation_direction_change": lrV, "sail_strength_change": pV}
    }

    display(){
        
    }
}