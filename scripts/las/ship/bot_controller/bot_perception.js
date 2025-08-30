// If using NodeJS then do imports
if (typeof window === "undefined"){
    copyObject = require("../../../general/helper_functions.js").copyObject;
}
/*
    Class Name: BotPerception
    Class Description: A perception management tool
*/
class BotPerception {
    /*
        Method Name: constructor
        Method Parameters: 
            reactionTimeTicks:
                The bot's reaction time measured in ticks
        Method Description: constructor
        Method Return: constructor
    */
    constructor(reactionTimeTicks){
        this.reactionTimeTicks = reactionTimeTicks;
        
        this.data = {};
    }

    /*
        Method Name: clear
        Method Parameters: None
        Method Description: Clears all data
        Method Return: void
    */
    clear(){
        this.data = {};
    }

    /*
        Method Name: getReactionTimeTicks
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getReactionTimeTicks(){
        return this.reactionTimeTicks;
    }

    /*
        Method Name: inputData
        Method Parameters: 
            dataKey:
                Key to identify the data
            dataValue:
                Value to store
            tick:
                Tick of input
        Method Description: Stores information
        Method Return: void
    */
    inputData(dataKey, dataValue, tick){
        // Make a place for the data if no place yet exists
        if (!objectHasKey(this.data, dataKey)){
            this.data[dataKey] = [];
        }

        let dataList = this.data[dataKey];
        let newDataObject = {"value": dataValue, "tick": tick};

        // Replace old data if it exists
        let oldestDataIndex;
        let oldestDataTick = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < dataList.length; i++){
            let listObj = dataList[i];
            let oldTick = listObj["tick"];
            // If this tick is the oldest found so far
            if (oldestDataTick > oldTick){
                oldestDataTick = oldTick;
                oldestDataIndex = i;
            }
        }

        // If the oldest found tick is old enough to be useless (because there is more recent data older or as old as the reaction time)
        let newerDataExists = dataList.length > 1;
        if (oldestDataTick < tick - this.getReactionTimeTicks() && newerDataExists){
            dataList[oldestDataIndex] = newDataObject;
        }
        // Otherwise we can't get rid of any old data so append
        else{
            dataList.push(newDataObject);
        }
    }

    /*
        Method Name: hasDataToReactTo
        Method Parameters: 
            dataKey:
                Key to identify the data
            tick:
                Tick of attempted retrieval
        Method Description: Checks if there is available data given the current tick and data key
        Method Return: boolean
    */
    hasDataToReactTo(dataKey, tick){
        // Shouldn't be requesting data that hasn't been added yet
        if (!objectHasKey(this.data, dataKey)){
            return false;
        }
        return this.getDataToReactTo(dataKey, tick) != null;
    }

    /*
        Method Name: hasDataToReactToExact
        Method Parameters: 
            dataKey:
                Key to identify the data
            tick:
                Tick of attempted retrieval
        Method Description: Checks if there is available data given the current tick (matches the tick) and data key
        Method Return: boolean
    */
    hasDataToReactToExact(dataKey, tick){
        // Shouldn't be requesting data that hasn't been added yet
        if (!objectHasKey(this.data, dataKey)){
            return false;
        }
        return this.getDataToReactToExact(dataKey, tick) != null;
    }

    /*
        Method Name: getDataToReactToExact
        Method Parameters: 
            dataKey:
                Key to identify the data
            tick:
                Tick of attempted retrieval
        Method Description: Gets available data given the current tick (matches the tick) and data key
        Method Return: Variable or null
    */
    getDataToReactToExact(dataKey, tick){
        // Shouldn't be requesting data that hasn't been added yet
        if (!objectHasKey(this.data, dataKey)){
            throw new Error("Requesting data that has not been received: " + dataKey);
        }

        let dataList = this.data[dataKey];

        // Search the data
        for (let i = 0; i < dataList.length; i++){
            let listObj = dataList[i];
            let oldTick = listObj["tick"];
            if (oldTick === tick){
                return listObj["value"];
            }
        }

        return null;
    }

    /*
        Method Name: getDataToReactTo
        Method Parameters: 
            dataKey:
                Key to identify the data
            tick:
                Tick of attempted retrieval
        Method Description: Gets is available data given the current tick and data key
        Method Return: Variable or null
    */
    getDataToReactTo(dataKey, tick){
        // Shouldn't be requesting data that hasn't been added yet
        if (!objectHasKey(this.data, dataKey)){
            throw new Error("Requesting data that has not been received: " + dataKey);
        }

        let bestTick = tick - this.getReactionTimeTicks();

        let dataList = this.data[dataKey];
        let newestAcceptableDataTick = -1;
        let newestAcceptableDataIndex = -1;

        // Search the data
        for (let i = 0; i < dataList.length; i++){
            let listObj = dataList[i];
            let oldTick = listObj["tick"];
            if (oldTick === bestTick){
                return listObj["value"];
            }
            // If the tick is the newest so far (and acceptable)
            else if (oldTick > newestAcceptableDataTick && oldTick < bestTick){
                newestAcceptableDataTick = oldTick;
                newestAcceptableDataIndex = i;
            }
        }


        // If nothing found, return null
        if (newestAcceptableDataIndex === -1){
            return null;
        }

        // Return the best value
        return dataList[newestAcceptableDataIndex]["value"];
    }
}


// If using NodeJS then do export
if (typeof window === "undefined"){
    module.exports = { BotPerception }
}
