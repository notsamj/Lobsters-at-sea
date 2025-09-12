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
        Method Description: Adds decisions to the timeline
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
        Method Name: getReplayString
        Method Parameters: None
        Method Description: Creates a string of the replay
        Method Return: String
    */
    getReplayString(game){

        // Turn into a string
        return JSON.stringify(this.replayObject);
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { GameRecorder }
}