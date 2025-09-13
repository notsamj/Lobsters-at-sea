/*
    Class Name: TickScheduler
    Class Description: A tool for scheduling ticks
*/
class TickScheduler {
    /*
        Method Name: constructor
        Method Parameters:
            tickRate:
                The number of ticks in a second
            startTime:
                The time of program start
        Method Description: constructor
        Method Return: constructor
    */
    constructor(tickRate, startTime=performance.now()){
        this.startTime = startTime;
        this.tickRate = tickRate;
        this.tickGapMS = 1000 / tickRate; // float likely
        this.tickLock = new Lock();
        this.numTicks = 0;
        this.paused = false;
        this.pauseStartTime = null;
        this.timeDebt = 0;
        this.latestTimeDebt = 0;
        this.lastTickTime = performance.now();
    }

    /*
        Method Name: getLatestTimeDebt
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getLatestTimeDebt(){
        return this.latestTimeDebt;
    }

    /*
        Method Name: pause
        Method Parameters: None
        Method Description: Pauses the tick scheduler
        Method Return: void
    */
    pause(){
        this.paused = true;
        this.pauseStartTime = performance.now();
    }

    /*
        Method Name: unpause
        Method Parameters: None
        Method Description: Unpauses the tick scheduler
        Method Return: void
    */
    unpause(){
        this.paused = false;
        this.addTimeDebt(performance.now() - this.pauseStartTime);
    }

    /*
        Method Name: addTimeDebt
        Method Parameters: 
            ms:
                The time to add
        Method Description: Adds a time debt 
        Method Return: void
    */
    addTimeDebt(ms){
        this.latestTimeDebt = ms;
        this.timeDebt += ms;
    }

    /*
        Method Name: isPaused
        Method Parameters: None
        Method Description: Checks if paused
        Method Return: boolean
    */
    isPaused(){
        return this.paused;
    }

    /*
        Method Name: getTickLock
        Method Parameters: None
        Method Description: Getter
        Method Return: Lock
    */
    getTickLock(){
        return this.tickLock;
    }

    /*
        Method Name: setStartTime
        Method Parameters:
            time:
                The new start time
        Method Description: Setter
        Method Return: void
    */
    setStartTime(time=performance.now()){
        this.startTime = time;
    }

    /*
        Method Name: getExpectedNumberOfTicksPassedFloat
        Method Parameters:
            time:
                The current time since epoch in ms
        Method Description: Calculates the number of ticks expected to have passed 
        Method Return: float
    */
    getExpectedNumberOfTicksPassedFloat(time=performance.now()){
        return (time - (this.startTime + this.timeDebt)) / this.tickGapMS;
    }

    /*
        Method Name: getExpectedNumberOfTicksPassed
        Method Parameters: 
            time:
                The current time since epoch in ms
        Method Description: Calculates the number of ticks expected to have passed
        Method Return: int
    */
    getExpectedNumberOfTicksPassed(time=performance.now()){
        return Math.floor(this.getExpectedNumberOfTicksPassedFloat(time));
    }

    /*
        Method Name: getNumTicks
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getNumTicks(){
        return this.numTicks;
    }

    /*
        Method Name: countTick
        Method Parameters: None
        Method Description: Counts a tick
        Method Return: void
    */
    countTick(){
        this.numTicks++;
        this.lastTickTime = performance.now();
    }

    /*
        Method Name: getLastTickTime
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getLastTickTime(){
        return this.lastTickTime;
    }

    /*
        Method Name: getDisplayMSSinceLastTick
        Method Parameters: None
        Method Description: Gets the time in miliseconds since last tick (for display purposes)
        Method Return: int (ms)
    */
    getDisplayMSSinceLastTick(){
        // If the game is paused -> return the time between tick and display at the start of the pause
        if (this.isPaused()){
            return this.pauseStartTime - this.lastTickTime;
        }
        // No longer paused but the tick was before pause start
        else if (!this.isPaused() && this.lastTickTime < this.pauseStartTime){
            return this.pauseStartTime - this.lastTickTime;
        }
        // Game is not paused, return the time between the time of the current frame and the last tick time
        return GC.getFrameCounter().getLastFrameTime() - this.lastTickTime;
    }
}