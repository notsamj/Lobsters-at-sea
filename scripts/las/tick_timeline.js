/*
    Class Name: TickTimeline
    Class Description: A timeline of events in a tick
*/
class TickTimeline {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: constructor
        Method Return: constructor
    */
    constructor(){
        this.timeline = new NotSamLinkedList();
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the timeline
        Method Return: void
    */
    reset(){
        this.timeline.clear();
    }

    /*
        Method Name: addToTimeline
        Method Parameters: 
            obj:
                A JSON object to add to a timeline
        Method Description: Adds an object to the timeline
        Method Return: void
        Method Note: Espects to be a JSON with an "event_type" key
    */
    addToTimeline(obj){
        this.timeline.push(obj);
    }


    /*
        Method Name: getEvents
        Method Parameters: None
        Method Description: Gets the timeline
        Method Return: LinkedList<JSON>
    */
    getEvents(){
        return this.timeline;
    }

    /*
        Method Name: getEventsOfType
        Method Parameters: 
            eventType:
                A type of event
        Method Description: Gets all events from the timeline with a given type
        Method Return: LinkedList<JSON>
    */
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