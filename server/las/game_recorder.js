// If using NodeJS then do imports
if (typeof window === "undefined"){
    copyObject = require("../../scripts/general/helper_functions.js").copyObject;
    objectHasKey = require("../../scripts/general/helper_functions.js").objectHasKey;
    Ship = require("../../scripts/las/ship/ship.js").Ship;
}
/*
    Class Name: GameRecorder
    Description: Records a game
*/
class GameRecorder {
    /*
        Method Name: constructor
        Method Parameters:
            gameRecorderSettingsJSON:
                JSON with game recorder settings
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(gameRecorderSettingsJSON){
        this.gameRecorderSettingsJSON = gameRecorderSettingsJSON;
        this.replayObject = {}
        this.dynamicShipDecisions = {}
        this.defaultShipDecisions = Ship.getDefaultDecisions();
        this.decisionNames = Object.keys(this.defaultShipDecisions);
    }

    /*
        Method Name: setLastTick
        Method Parameters:
            lastTick:
                The last tick of the recording
        Method Description: Stores the last tick of the recording
        Method Return: void
    */
    setLastTick(lastTick){
        this.replayObject["last_tick"] = lastTick;
    }

    /*
        Method Name: setOpeningMessage
        Method Parameters:
            openingMessageJSON:
                JSON with opening game message information
        Method Description: Stores the opening message
        Method Return: void
    */
    setOpeningMessage(openingMessageJSON){
        this.replayObject["opening_message"] = copyObject(openingMessageJSON);
        this.replayObject["timeline"] = [];
        
        // Set a baseline of decisions for these ships
        for (let ship of this.replayObject["opening_message"]["game_details"]["ships"]){
            this.dynamicShipDecisions[ship["id"]] = copyObject(this.defaultShipDecisions);
        }
    }

    /*
        Method Name: addDecisions
        Method Parameters:
            tickNumber:
                Relevant tick for the recisions
            eventObj:
                Event info JSON
        Method Description: Adds decisions
        Method Return: void
    */
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
                if (shipEstablishedDecisions[decisionName] != this.dynamicShipDecisions[shipID][decisionName] && shipEstablishedDecisions[decisionName] != undefined){
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

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the class data
        Method Return: void
    */
    reset(){
        this.replayObject = {}
        this.dynamicShipDecisions = {}
    }

    /*
        Method Name: reduceCrosshairShowing
        Method Parameters: None
        Method Description: Reduces crosshair data to make the recording much lighter
        Method Return: void
    */
    reduceCrosshairShowing(){
        let ticksOfShowingOnEachSide = this.gameRecorderSettingsJSON["ms_crosshair_display_around_shooting_ticks"];

        let shipDisplayCrosshairIntervals = {};

        let getCreateIntervalTimelineObject = (shipID) => {
            // Create if not present
            if (!objectHasKey(shipDisplayCrosshairIntervals, shipID)){
                shipDisplayCrosshairIntervals[shipID] = new NotSamLinkedList();
            }
            return shipDisplayCrosshairIntervals[shipID];
        }

        let isInInterval = (shipID, tick) =>{
            // If not intervals exist
            if (!objectHasKey(shipDisplayCrosshairIntervals, shipID)){
                return false;
            }

            // Find any intervals it may be in
            for (let interval of shipDisplayCrosshairIntervals[shipID]){
                if (interval[0] <= tick && interval[1] >= tick){
                    return true;
                }
            }

            // Not found in an interval
            return false;
        }

        // Create intervals
        for (let tickObj of this.replayObject["timeline"]){
            // Go through update list
            for (let updatedDecisionsObject of tickObj["update_list"]){
                // If we found a fire cannon decision, add an interval
                if (objectHasKey(updatedDecisionsObject["decisions_updated"], "fire_cannons") && updatedDecisionsObject["decisions_updated"]["fire_cannons"] === true){
                    let timelineObject = getCreateIntervalTimelineObject(updatedDecisionsObject["ship_id"]);
                    timelineObject.push([tickObj["tick"]-ticksOfShowingOnEachSide, tickObj["tick"]+ticksOfShowingOnEachSide]);
                }
            }
        }

        // Merge overlapping intervals
        for (let shipID of Object.keys(shipDisplayCrosshairIntervals)){
            let intervalList = shipDisplayCrosshairIntervals[shipID];
            // Loop from n-1 to 1 (last to 2nd element)
            for (let i = intervalList.getLength() - 1; i > 0; i--){
                let listBelow = intervalList.get(i-1);
                let myList = intervalList.get(i);
                let belowEnd = listBelow[1];
                let myStart = myList[0];
                // Attach interval
                if (belowEnd >= myStart){
                    let myEnd = myList[1];
                    listBelow[1] = myEnd;
                    // Remove this interval
                    intervalList.pop(i);
                }
            }
        }

        // Clean
        for (let i = this.replayObject["timeline"].length - 1; i >= 0; i--){
            let tickObj = this.replayObject["timeline"][i];
            // Go through update list
            for (let j = tickObj["update_list"].length - 1; j >= 0; j--){
                let updatedDecisionsObject = tickObj["update_list"][j];
                // If we found an aiming decision, confirm it's in an interval
                if (objectHasKey(updatedDecisionsObject["decisions_updated"], "aiming_cannons")){
                    // If not in an interval then cleanse the decision object
                    if (!isInInterval(updatedDecisionsObject["ship_id"], tickObj["tick"])){
                        updatedDecisionsObject["decisions_updated"]["aiming_cannons_position_x"] = undefined;
                        updatedDecisionsObject["decisions_updated"]["aiming_cannons_position_y"] = undefined;
                    }
                }

                let hasAnythingUseful = false;
                // Check if any useable keys now
                for (let key of Object.keys(updatedDecisionsObject["decisions_updated"])){
                    // If not undefined, it's useful
                    if (updatedDecisionsObject["decisions_updated"][key] != undefined){
                        hasAnythingUseful = true;
                        break;
                    }
                }
                // If nothing useful, delete this one
                if (!hasAnythingUseful){
                    tickObj["update_list"].splice(j, 1);
                }
            }

            // If update list has been emptied -> Remove this tick from timeline
            if (tickObj["update_list"].length === 0){
                this.replayObject["timeline"].splice(i, 1);
            }
        }
    }

    /*
        Method Name: reduceRecording
        Method Parameters: None
        Method Description: Reduces recording data to reduce size
        Method Return: void
    */
    reduceRecording(){
        // Apply reductions
        //this.reduceCrosshairShowing();
    }

    /*
        Method Name: getReplayString
        Method Parameters: None
        Method Description: Creates a string of the replay
        Method Return: String
    */
    getReplayString(game){
        // Reduce the size
        this.reduceRecording();

        // Turn into a string
        return JSON.stringify(this.replayObject);
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { GameRecorder }
}