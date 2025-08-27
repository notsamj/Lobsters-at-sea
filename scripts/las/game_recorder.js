// If using NodeJS then do imports
if (typeof window === "undefined"){
    copyObject = require("../general/helper_functions.js").copyObject;
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

    getReplayString(){
        let replayObject = {};
        replayObject["opening_message"] = copyObject()
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { GameRecorder }
}