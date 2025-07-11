class Wind {
    constructor(){
        let initialWindMagnitude = 5;
        let initialWindDirection = toRadians(90);

        this.windMagntiude = initialWindMagnitude;
        this.windDirection = initialWindDirection;
    }

    update(){
        // TODO
    }

    getXA(){
        return Math.cos(this.windDirection) * this.windMagntiude;
    }

    getYA(){
        return Math.sin(this.windDirection) * this.windMagntiude;
    }
}