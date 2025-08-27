// If using NodeJS then do imports
if (typeof window === "undefined"){
    copyObject = require("../general/helper_functions.js").copyObject;
    Ship = require("./ship/ship.js").Ship;
}
class GameRecorder {
    constructor(gameProperties){
        this.gameProperties = copyObject(gameProperties);
        this.timeline = new NotSamLinkedList();
    }

    reset(){
        this.timeline.clear();
    }

    addToTimeline(tick, obj){
        let tickList = this.getMakeTickList(tick);
        tickList.push(obj);
    }

    getMakeTickList(tick){
        for (let [obj, index] of this.timeline){
            if (obj["tick"] === tick){
                return obj["list"];
            }
        }
        let newList = new NotSamLinkedList();
        
        // Create
        this.timeline.push({"tick": tick, "list": newList})
        
        return newList;
    }

    getEventsOfTick(tick){
        return this.getMakeTickList(tick);
    }

    getEventsOfTickAndType(tick, eventType){
        let ticklist = this.getMakeTickList(tick);
        let outputList = new NotSamLinkedList();
        for (let [obj, index] of ticklist){
            if (obj["event_type"] === eventType){
                outputList.push(obj);
            }
        }
        return outputList;
    }

    getReplayString(game){
        let replayObject = {};

        // Grab the opening message
        replayObject["opening_message"] = copyObject(this.timeline.get(0)["list"].get(0));

        // Prepare the timeline
        replayObject["timeline"] = [];

        // Create the decision object
        let dynamicShipDecisions = {};

        let defaultShipDecisions = Ship.getDefaultDecisions();
        let decisionNames = Object.keys(defaultShipDecisions);

        // Set a baseline of decisions for these ships
        for (let ship of replayObject["opening_message"]["game_details"]["ships"]){
            dynamicShipDecisions[ship["id"]] = copyObject(defaultShipDecisions);
        }

        // Go through each tick
        for (let [tickObj, tickObjIndex] of this.timeline){
            let tickNumber = tickObj["tick"];
            let tickListOfEvents = tickObj["list"];
            let updatesThisTick = [];

            // Go through all events
            for (let [eventObj, eventObjIndex] of tickListOfEvents){
                // Skip events that aren't being looked for
                if (eventObj["event_type"] != "ship_decisions_recording"){
                    continue;
                }

                // Loop through each ship decision recording
                for (let shipDecisionRecording of eventObj["ship_decisions"]){
                    let shipID = shipDecisionRecording["ship_id"];
                    let shipEstablishedDecisions = shipDecisionRecording["established_decisions"];
                    //console.log(shipDecisionRecording)
                    let updatedDecisions = {}
                    let decisionUpdateCount = 0;

                    // Search each decision
                    for (let decisionName of decisionNames){
                        // If it doesn't line up with the current value
                        if (shipEstablishedDecisions[decisionName] != dynamicShipDecisions[shipID][decisionName]){
                            // Update stored value
                            dynamicShipDecisions[shipID][decisionName] = shipEstablishedDecisions[decisionName];

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
            }

            // If we have updates this tick
            if (updatesThisTick.length > 0){
                replayObject["timeline"].push({"tick": tickNumber, "update_list": updatesThisTick});
            }
        }

        // Turn into a string
        return JSON.stringify(replayObject);
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { GameRecorder }
}