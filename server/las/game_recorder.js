// If using NodeJS then do imports
if (typeof window === "undefined"){
    copyObject = require("../../scripts/general/helper_functions.js").copyObject;
    Ship = require("../../scripts/las/ship/ship.js").Ship;
}
class GameRecorder {
    constructor(){
        this.replayObject = {}
        this.dynamicShipDecisions = {}
        this.defaultShipDecisions = Ship.getDefaultDecisions();
        this.decisionNames = Object.keys(this.defaultShipDecisions);
    }

    setOpeningMessage(openingMessageJSON){
        this.replayObject["opening_message"] = copyObject(openingMessageJSON);
        this.replayObject["timeline"] = [];
        
        // Set a baseline of decisions for these ships
        for (let ship of this.replayObject["opening_message"]["game_details"]["ships"]){
            this.dynamicShipDecisions[ship["id"]] = copyObject(this.defaultShipDecisions);
        }
    }

    addDecisions(tickNumber, eventObj){
        let updatesThisTick = [];
        // Loop through each ship decision recording
        for (let shipDecisionRecording of eventObj["ship_decisions"]){
            let shipID = shipDecisionRecording["ship_id"];
            let shipEstablishedDecisions = shipDecisionRecording["established_decisions"];
            let updatedDecisions = {}
            let decisionUpdateCount = 0;

            // Search each decision
            for (let decisionName of this.decisionNames){
                // If it doesn't line up with the current value
                if (shipEstablishedDecisions[decisionName] != this.dynamicShipDecisions[shipID][decisionName]){
                    // Update stored value
                    this.dynamicShipDecisions[shipID][decisionName] = shipEstablishedDecisions[decisionName];

                    // Save as update
                    updatedDecisions[decisionName] = shipEstablishedDecisions[decisionName];
                    decisionUpdateCount++;
                }
            }

            // If there was an update
            if (decisionUpdateCount > 0){
                updatesThisTick.push({"ship_id": shipID, "decisions_updated": updatedDecisions});
            }
        }

        // If we have updates this tick
        if (updatesThisTick.length > 0){
            this.replayObject["timeline"].push({"tick": tickNumber, "update_list": updatesThisTick});
        }
    }

    reset(){
        this.replayObject = {}
        this.dynamicShipDecisions = {}
    }

    getReplayString(game){
        // Turn into a string
        return JSON.stringify(this.replayObject);
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { GameRecorder }
}