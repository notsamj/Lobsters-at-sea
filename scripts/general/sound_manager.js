/*
    Class Name: SoundManager
    Description: A class for managing the playing of sounds.
*/
class SoundManager {
    /*
        Method Name: constructor
        Method Parameters:
            soundDataJSON:
                JSON with sound data information
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(soundDataJSON){
        this.soundDataJSON = soundDataJSON;
        this.soundQueue = new NotSamLinkedList();
        this.sounds = [];
        this.mainVolume = getLocalStorage("main volume", 0);
        this.audioContext = undefined; 
    }

    getAudioContext(){
        // Note: Assume if this is called then user has made an action so it's safe
        if (this.audioContext === undefined){
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    /*
        Method Name: loadSounds
        Method Parameters: None
        Method Description: Loads all the sounds that are identified in the file data
        Method Return: void
    */
    async loadSounds(){
        for (let soundData of this.soundDataJSON["sounds"]){
            let audioDataString = soundData["audio_data"];
            let audioBuffer = await this.createAudioArrayBuffer(audioDataString);
            this.sounds.push(new Sound(this, soundData["name"], audioBuffer, this.mainVolume));
        }
    }

    async createAudioArrayBuffer(audioString){
        return await (await fetch(audioString)).arrayBuffer();
    }

    /*
        Method Name: loadSounds
        Method Parameters:
            soundName:
                The name of the sound to play
            xOffset:
                X offset from center
            yOffset:
                Y offset from center
        Method Description: Prepares to play a sound when playAll is next called
        Method Return: void
    */
    play(soundName, xOffset, yOffset){
        if (!this.hasSound(soundName)){
            throw new Error("Failed to find sound: " + soundName);
        }
        this.findSound(soundName).play(xOffset, yOffset);
    }

    /*
        Method Name: loadSounds
        Method Parameters:
            soundName:
                The name of the sound to find
        Method Description: Finds a sound and returns it
        Method Return: Sound
    */
    findSound(soundName){
        for (let sound of this.sounds){
            if (sound.getName() == soundName){
                return sound;
            }
        }
        return null;
    }

    /*
        Method Name: hasSound
        Method Parameters:
            soundName:
                The name of the sound to find
        Method Description: Determines if a sound is present
        Method Return: Boolean, true -> sound is present, false -> sound is not present.
    */
    hasSound(soundName){
        return this.findSound(soundName) != null;
    }

    /*
        Method Name: updateVolume
        Method Parameters:
            soundName:
                Name of sound whose volume is being updated
            newVolume:
                The new volume for the sound
        Method Description: Updates the volume of a sound
        Method Return: void
    */
    updateVolume(soundName, newVolume){
        setLocalStorage(soundName, newVolume);
        if (soundName === "main volume"){
            this.mainVolume = newVolume;
            for (let sound of this.sounds){
                sound.adjustByMainVolume(this.mainVolume);
            }
            return;
        }

        // Error if not found
        if (!this.hasSound(soundName)){ throw new Error("Sound: " + soundName + " not found."); }

        let sound = this.findSound(soundName);
        sound.updateVolume(newVolume, this.mainVolume);
    }

    /*
        Method Name: getVolume
        Method Parameters:
            soundName:
                Name of sound whose volume is being updated
        Method Description: Determines the volume of a sound
        Method Return: int
    */
    getVolume(soundName){
        if (soundName === "main volume"){
            return this.mainVolume;
        }
        if (!this.hasSound(soundName)){ return 0; }
        let sound = this.findSound(soundName);
        return sound.getVolume();
    }
}

/*
    Class Name: Sound
    Description: A class to handle a sound.
*/
class Sound {
    /*
        Method Name: constructor
        Method Parameters: 
            soundManager:
                SoundManager reference
            soundName:
                The name of the sound
            audioArrayBuffer:
                Array buffer of audio data
            mainVolume:
                The main volume of program
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(soundManager, soundName, audioArrayBuffer, mainVolume){
        this.soundManager = soundManager;
        this.name = soundName;

        this.audioArrayBuffer = audioArrayBuffer;
        this.audioDataBuffer = undefined;

        this.volume = getLocalStorage(soundName, 0);
        this.audioObjVolume = undefined; // Declare

        this.hasBeenLoaded = false;
        this.loadingLock = new Lock();
        
        this.adjustByMainVolume(mainVolume);
    }

    /*
        Method Name: getName
        Method Parameters: None
        Method Description: Getter
        Method Return: void
    */
    getName(){
        return this.name;
    }

    async load(){
        // Indicate loading has started
        this.loadingLock.lock();

        // Load data
        this.audioDataBuffer = await this.soundManager.getAudioContext().decodeAudioData(this.audioArrayBuffer);

        // Mark loaded
        this.hasBeenLoaded = true;

        // Indicate loading has completed
        this.loadingLock.unlock();
    }

    /*
        Method Name: play
        Method Parameters:
            xOffset:
                X offset from center
            yOffset:
                Y offset from center
        Method Description: Plays the sound at location
        Method Return: void
    */
    async play(xOffset, yOffset){
        // If not loaded AND loading has not been started -> start loading
        if (!this.hasBeenLoaded && this.loadingLock.isUnlocked()){
            await this.load();
        }
        // If not loaded BUT currently loading -> wait
        else if (!this.hasBeenLoaded){
            await this.loadingLock.awaitUnlock();
        }
        let audioContext = this.soundManager.getAudioContext();
        let bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = this.audioDataBuffer;

        let audioListener = audioContext.listener;

        let audioPanner = audioContext.createPanner();
        audioPanner.panningModel = "HRTF";
        audioPanner.distanceModel = "inverse";
        audioPanner.refDistance = 1;
        audioPanner.maxDistance = 1000; // TODO: Set this up in settings
        audioPanner.rolloffFactor = 1;
        audioPanner.coneInnerAngle = 360;
        audioPanner.coneOuterAngle = 0;
        audioPanner.coneOuterGain = 0;

        let zOffset = 0;
        audioPanner.setOrientation(xOffset, yOffset, zOffset);

        // Play
        bufferSource.connect(audioPanner).connect(audioContext.destination);
        bufferSource.start();
    }

    /*
        Method Name: adjustByMainVolume
        Method Parameters:
            mainVolume:
                The main volume of the program
        Method Description: Adjusts the volume of a sound based on the main program volume
        Method Return: void
    */
    adjustByMainVolume(mainVolume){
        this.updateVolume(this.volume, mainVolume);
    }

    /*
        Method Name: updateVolume
        Method Parameters:
            newVolume:
                The new volume value of a sound
            mainVolume:
                The main volume of the program
        Method Description: Adjusts the volume of a sound based on the main program volume and its own volume value.
        Method Return: void
    */
    updateVolume(newVolume, mainVolume){
        this.volume = newVolume;
        this.audioObjVolume = (newVolume / 100) * (mainVolume / 100);
    }

    /*
        Method Name: getVolume
        Method Parameters: None
        Method Description: Getter
        Method Return: void
    */
    getVolume(){
        return this.volume;
    }
}