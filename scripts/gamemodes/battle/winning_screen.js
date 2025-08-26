class WinningScreen {
    constructor(){
        this.active = false;
        this.text = undefined;
        this.textColour = undefined;
    }

    setUp(text, textColourCode){
        this.text = text;
        this.textColour = Colour.fromCode(textColourCode);

        // Set active
        this.setActive(true);
    }

    setActive(value){
        this.active = value;
    }
    
    isActive(){
        return this.active;
    }
    
    display(){
        Menu.makeText(this.text, this.textColour, Math.floor(getScreenWidth()/2), Math.floor(getScreenHeight() * 0.9), Math.floor(getScreenWidth()*0.70), Math.floor(getScreenHeight()/4), "center", "hanging");
    }
}