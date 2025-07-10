// When this is opened in NodeJS, import the required files
if (typeof window === "undefined"){
    Lock = require("./lock.js");
}
/*
    Class Name: CooldownLock
    Description: Subclass of Lock, unlocks after a given cooldown
    Note: Will not work properly with say a cooldown of 60 years because the starting assumption is that the lock was locked at 0ms from epoch 
*/
class CooldownLock extends Lock{
    /*
        Method Name: constructor
        Method Parameters:
            cooldown:
                The number of milliseconds that the lock is locked for
            ready:
                Whether the lock is currently ready
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(cooldown, ready=true){
        super(ready);
        this.cooldown = cooldown;
        this.lastLocked = 0;
    }
    
    /*
        Method Name: lock
        Method Parameters: None
        Method Description: Locks the lock and sets the last locked time
        Method Return: void
    */
    lock(){
        super.lock();
        this.lastLocked = Date.now();
    }

    /*
        Method Name: isReady
        Method Parameters: None
        Method Description: Determines if the lock is ready to be unlocked and returns the result
        Method Return: boolean, true -> ready, false -> not ready
    */
    isReady(){
        if (Date.now() > this.lastLocked + this.cooldown){
            this.unlock();
        }
        return this.ready;
    }

    /*
        Method Name: getCooldown
        Method Parameters: None
        Method Description: Getter
        Method Return: long, the cooldown of the lock
    */
    getCooldown(){
        return this.cooldown;
    }
}
// When this is opened in NodeJS, export the class
if (typeof window === "undefined"){
    module.exports = CooldownLock;
}