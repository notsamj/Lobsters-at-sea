/*
    Class Name: SoundMenu
    Description: A subclass of Menu specific to setting the game volume
*/
class SoundMenu extends Menu {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        super("sound_menu");
    }

    /*
        Method Name: setup
        Method Parameters: None
        Method Description: Sets up the menu interface
        Method Return: void
    */
    setup(){
        let sectionYSize = 50;
        // Background
        this.components.push(new LoadingScreenComponent());

        // Back Button
        let backButtonX = () => { return 50; }
        let backButtonY = (innerHeight) => { return innerHeight-27; }
        let backButtonXSize = 200;
        let backButtonYSize = 76;
        this.components.push(new RectangleButton("Settings Menu", "#3bc44b", "#e6f5f4", backButtonX, backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            GC.getMenuManager().switchTo("settings_menu");
        }));

        // Interface for sound amounts
        let i = 0;
        this.createSoundSettings("main volume", i++);
        for (let soundData of GC.getLocalGameProperties()["sound_data"]["sounds"]){
            this.createSoundSettings(soundData["name"], i++);
        }

        // Information
        let infoY = 700;
        let infoXSize = 600;
        let infoYSize = 400;
        this.components.push(new TextComponent("Note: I must caution the use of sounds.\nI find them useful, however,\n these are of poor quality\nand may be loud and annoying.\nThis is why I have\n disabled them by default.", "#000000", 20, infoY, infoXSize, infoYSize));
        
    }

    /*
        Method Name: createSoundSettings
        Method Parameters:
            soundName:
                The name of the sound
            offSetIndex:
                The index of the sound relative to other sounds
        Method Description: Creates the settings menu elements for a given sound
        Method Return: void
    */
    createSoundSettings(soundName, offSetIndex){
        let width = 200;
        let height = 50;
        let sectionYSize = 100;
        let sectionYStart = sectionYSize * offSetIndex;

        let soundLabelXSize = 300;
        let soundLabelX = 600;
        let soundLabelYSize = 100;
        let soundLabelY = (innerHeight) => { return innerHeight - 27 - sectionYStart - sectionYSize/2 - height/2; }

        let soundScaleX = soundLabelX + soundLabelXSize;
        let soundScaleY = (innerHeight) => { return innerHeight - 27 - sectionYStart; }

        // Components

        // Sound Name
        this.components.push(new TextComponent(soundName, "#f5d442", soundLabelX, soundLabelY, soundLabelXSize, soundLabelYSize, "center", "middle"));

        let getValueFunction = () => {
            return GC.getSoundManager().getVolume(soundName);
        }

        let setValueFunction = (newVolume) => {
            GC.getSoundManager().updateVolume(soundName, newVolume);
        }

        let quantitySlider = new QuantitySlider(soundScaleX, soundScaleY, width, height/2, height/2, 30, getValueFunction, setValueFunction, 0, 100, false, "#000000", "#f5d442", "#f5d442");
        this.components.push(quantitySlider);
    }
}