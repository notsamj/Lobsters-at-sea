// When this is opened in NodeJS, import the required files
if (typeof window === "undefined"){
    Lock = require("./lock.js").Lock;
}
/*
    Class Name: TickLock
    Description: Subclass of Lock, unlocks after a given number of ticks
*/
class TickLock extends Lock {
    /*
        Method Name: constructor
        Method Parameters:
            numTicks:
                The number of ticks between unlocks
            ready:
                Whether the lock is currently ready
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(numTicks, ready=true){
        super(ready);
        this.startingReady = ready;
        this.numTicks = numTicks;
        this.ticksLeft = 0;
        if (!ready){
            this.lock();
        }
    }

    /*
        Method Name: replace
        Method Parameters: 
            newNumTicks:
                New number of ticks
            ready:
                Whether or not the new lock is ready
        Method Description: Replaces the lock
        Method Return: void
    */
    replace(newNumTicks, ready=true){
        this.ready = ready;
        this.startingReady = ready;
        this.numTicks = newNumTicks;
        this.ticksLeft = 0;
        if (!ready){
            this.lock();
        }
    }

    /*
        Method Name: restoreDefault
        Method Parameters: None
        Method Description: Restores the default values
        Method Return: void
    */
    restoreDefault(){
        this.ticksLeft = 0;
    }
    
    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Locks the lock and sets the last locked time
        Method Return: void
    */
    tick(){
        if (!this.isReady()){
            this.ticksLeft--;
        }
    }

    /*
        Method Name: isReady
        Method Parameters: None
        Method Description: Determines if the lock is ready to be unlocked and returns the result
        Method Return: boolean, true -> ready, false -> not ready
    */
    isReady(){
        return this.ticksLeft <= 0;
    }

    /*
        Method Name: lock
        Method Parameters: None
        Method Description: Adds the lock time to the time left, locking the lock for some time
        Method Return: void
    */
    lock(){
        this.ticksLeft += this.numTicks;
    }

    /*
        Method Name: getTicksLeft
        Method Parameters: None
        Method Description: Getter
        Method Return: Number
    */
    getTicksLeft(){
        return this.ticksLeft;
    }

    /*
        Method Name: setTicksLeft
        Method Parameters:
            tickLeft:
                Number of ticks left
        Method Description: Setter
        Method Return: void
    */
    setTicksLeft(ticksLeft){
        this.ticksLeft = ticksLeft;
    }

    /*
        Method Name: addTime
        Method Parameters: 
            ticks:
                Number of ticks to add
        Method Description: Adds time to the tick lock
        Method Return: void
    */
    addTime(ticks){
        this.ticksLeft = Math.min(this.numTicks, this.ticksLeft + ticks);
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets the lock to max cooldown
        Method Return: void
    */
    reset(){
        this.ticksLeft = this.getCooldown();
    }

    /*
        Method Name: resetAndLock
        Method Parameters: None
        Method Description: Resets and locks
        Method Return: void
    */
    resetAndLock(){
        this.reset();
    }

    /*
        Method Name: getCooldown
        Method Parameters: None
        Method Description: Getter
        Method Return: long, the cooldown of the lock
    */
    getCooldown(){
        return this.numTicks;
    }
}
// When this is opened in NodeJS, export the class
if (typeof window === "undefined"){
    module.exports = { TickLock };
}