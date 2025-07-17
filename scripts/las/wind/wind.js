class Wind {
    constructor(game){
        this.game = game;
        let initialWindMagnitude = this.game.getGameProperties()["wind_settings"]["wind_initial_magnitude"];
        let initialWindDirection = toRadians(this.game.getRandom().getFloatInRange(0, 2*Math.PI));

        this.windMagntiude = initialWindMagnitude;
        this.windDirectionRAD = initialWindDirection;
        this.windMagnitudeChangeAmountPerSecond = this.game.getGameProperties()["wind_settings"]["wind_magnitude_change_amount_per_second"];
        this.windDirectionChangeAmountPerSecondRAD = toRadians(this.game.getGameProperties()["wind_settings"]["wind_direction_change_amount_per_second_deg"]);
    }


    getGame(){
        return this.game;
    }

    tickUpdate(){
        let tickMS = this.getGame().getGameProperties()["ms_between_ticks"];
        let msProportionOfASecond = tickMS / 1000;

        let windChangeMagnitude = this.windMagnitudeChangeAmountPerSecond * msProportionOfASecond;
        let newWindMagntiude = this.windMagntiude + this.getGame().getRandom().getFloatInRange(windChangeMagnitude * -1, windChangeMagnitude);
        
        // Cannot be negative
        this.windMagntiude = Math.max(newWindMagntiude, 0);

        let maxDirectionChangeAmount = this.windDirectionChangeAmountPerSecondRAD * msProportionOfASecond;
        let newWindDirectionRAD = fixRadians(this.windDirectionRAD + this.getGame().getRandom().getFloatInRange(maxDirectionChangeAmount * -1, maxDirectionChangeAmount));
        this.windDirectionRAD = newWindDirectionRAD;
    }

    getXA(){
        return Math.cos(this.windDirectionRAD) * this.windMagntiude;
    }

    getYA(){
        return Math.sin(this.windDirectionRAD) * this.windMagntiude;
    }

    getWindDirectionRAD(){
        return this.windDirectionRAD;
    }

    getWindMagnitude(){
        return this.windMagntiude;
    }

    // Local only
    display(){
        let image = GC.getImage("wind_sock");
        let imageWidth = image.width;
        let imageHeight = image.height;

        let displayImageOrientation = this.getWindDirectionRAD();

        let rotateX = (getScreenWidth() - imageWidth) + (imageWidth-1)/2;
        let rotateY = 0 + (imageHeight-1)/2;

        // Prepare the display
        translate(rotateX, rotateY);
        rotate(-1 * displayImageOrientation);

        // Display Wind sock
        displayImage(image, 0 - (imageWidth-1) / 2, 0 - (imageHeight-1) / 2); 

        // Reset the rotation and translation
        rotate(displayImageOrientation);
        translate(-1 * rotateX, -1 * rotateY);
    }
}