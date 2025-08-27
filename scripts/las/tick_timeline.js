class TickTimeline {
    constructor(){
        this.timeline = new NotSamLinkedList();
    }

    reset(){
        this.timeline.clear();
    }

    addToTimeline(obj){
        this.timeline.push(obj);
    }


    getEvents(){
        return this.timeline;
    }

    getEventsOfType(eventType){
        let outputList = new NotSamLinkedList();
        for (let [obj, index] of this.timeline){
            if (obj["event_type"] === eventType){
                outputList.push(obj);
            }
        }
        return outputList;
    }
}

// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { TickTimeline }
}