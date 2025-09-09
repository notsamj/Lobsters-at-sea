/*
    Class Name: RotatingStaticImage
    Description: The a static image that rotates between a set of images
*/
class RotatingStaticImage extends StaticImage {
    /*
        Method Name: constructor
        Method Parameters: 
            initialImageName:
                The name of initial image
            x:
                x location of the static image
            y:
                y location of the static image
            imageSelection:
                List of image names (string)
            maxWidth:
                Max width
            maxHeight:
                Max height
        Method Description: constructor
        Method Return: constructor
    */
    constructor(initialImageName, x, y, imageSelection, maxWidth=null, maxHeight=null){
        super(null, x, y, maxWidth, maxHeight);
        this.imageSelection = imageSelection;
        this.imageIndex = this.findImageIndex(initialImageName);
    }

    /*
        Method Name: getImageIndex
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getImageIndex(){
        return this.imageIndex;
    }

    /*
        Method Name: getImageName
        Method Parameters: None
        Method Description: Gets the current image name
        Method Return: String
    */
    getImageName(){
        return this.imageSelection[this.imageIndex];
    }

    getImage(){
        return GC.getImage(this.getImageName());
    }

    /*
        Method Name: findImageIndex
        Method Parameters: 
            imageName:
                The name of an image
        Method Description: Finds the index of the the image name
        Method Return: int
    */
    findImageIndex(imageName){
        for (let i = 0; i < this.imageSelection.length; i++){
            if (this.imageSelection[i] === imageName){
                return i;
            }
        }
        throw new Error("Failed to find image.");
    }

    /*
        Method Name: clicked
        Method Parameters: None
        Method Description: Rotates on click
        Method Return: void
    */
    clicked(){
        this.imageIndex = (this.imageIndex + 1) % this.imageSelection.length;
        super.clicked();
    }
}