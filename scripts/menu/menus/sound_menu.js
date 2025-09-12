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
        // Background
        this.components.push(new LoadingScreenComponent());

        let menuData = MSD["sound_menu"];

        // Back Button
        let menuDataBackButton = menuData["back_button"];
        let backButtonY = (innerHeight) => { return innerHeight-menuDataBackButton["y_offset"]; }
        let backButtonXSize = menuDataBackButton["x_size"];
        let backButtonYSize = menuDataBackButton["y_size"];
        this.components.push(new RectangleButton(menuDataBackButton["text"], menuDataBackButton["colour_code"], menuDataBackButton["text_colour_code"], menuDataBackButton["x"], backButtonY, backButtonXSize, backButtonYSize, (instance) => {
            GC.getMenuManager().switchTo("main_menu");
        }));

        // Interface for sound amounts
        let i = 0;

        // Create main volume
        this.createSoundSettings("main volume", i++);

        for (let soundData of GC.getLocalGameProperties()["sound_data"]["sounds"]){
            this.createSoundSettings(soundData["name"], i++);
        }
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
        let menuData = MSD["sound_menu"];
        let saData = menuData["sound_area"];
        let width = saData["width"];
        let height = saData["height"];
        let sectionYSize = saData["section_y_size"];
        let sectionYStart = sectionYSize * offSetIndex;


        let soundLabelXSize = saData["sound_label_x_size"];
        let soundLabelX = saData["sound_label_x"];
        let soundLabelYSize = saData["sound_label_y_size"];
        let topBufferY = saData["top_buffer_y"];

        let textHeight = height/2;
        let sliderHeight = height/2;

        let soundLabelY = (innerHeight) => { return innerHeight - topBufferY - sectionYStart - textHeight - sliderHeight/2 + 1; }

        let soundScaleX = soundLabelX + soundLabelXSize;
        let soundScaleY = (innerHeight) => { return innerHeight - topBufferY - sectionYStart; }

        let themeColourCode = saData["theme_colour_code"];
        let backgroundColourCode = saData["background_colour_code"];

        // Components

        // Sound Name
        this.components.push(new TextComponent(soundName, themeColourCode, soundLabelX, soundLabelY, soundLabelXSize, soundLabelYSize, "center", "middle"));

        let getValueFunction = () => {
            return GC.getSoundManager().getVolume(soundName);
        }

        let setValueFunction = (newVolume) => {
            GC.getSoundManager().updateVolume(soundName, newVolume);
        }

        let quantitySlider = new QuantitySlider(soundScaleX, soundScaleY, width, sliderHeight, textHeight, saData["cursor_width_px"], getValueFunction, setValueFunction, saData["min_volume"], saData["max_volume"], false, backgroundColourCode, themeColourCode, themeColourCode);
        this.components.push(quantitySlider);
    }
}