class Wind {
    constructor(){
        let initialWindMagnitude = 5;
        let initialWindDirection = toRadians(90);

        this.windMagntiude = initialWindMagnitude;
        this.windDirectionRAD = initialWindDirection;
    }

    update(){
        // TODO
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