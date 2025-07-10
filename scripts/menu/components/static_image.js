/*
    Class Name: StaticImage
    Description: A subclass of Component. An image that does not move.
*/
class StaticImage extends Component {
    /*
        Method Name: constructor
        Method Parameters:
            image:
                An image
            x:
                The x location of the top left corner
            y:
                The y location of the top left corner
            maxWidth:
                The maximum width of the image
            maxHeight:
                The maximum height of the image
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(image, x, y, maxWidth=null, maxHeight=null){
        super();
        this.image = image;
        this.x = x;
        this.y = y;
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this.onClick = null;
    }

    /*
        Method Name: getMaxWidth
        Method Parameters: None
        Method Description: Gets the max width if it exists, otherwise gets current width
        Method Return: int
    */
    getMaxWidth(){
        if (this.maxWidth === null){
            return this.getWidth();
        }else if (typeof this.maxWidth === "function"){
            return this.maxWidth(getScreenWidth());
        }
        return this.maxWidth;
    }

    /*
        Method Name: getMaxHeight
        Method Parameters: None
        Method Description: Gets the max height if it exists, otherwise gets current height
        Method Return: int
    */
    getMaxHeight(){
        if (this.maxWidth === null){
            return this.getHeight();
        }else if (typeof this.maxWidth === "function"){
            return this.maxHeight(getScreenHeight());
        }
        return this.maxHeight;
    }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Determines the x value of this component. Depends on whether it is set as a function of the screen dimensions or static.
        Method Return: int
    */
    getX(){
        if (typeof this.x === "function"){
            return this.x(getScreenWidth(), this.getMaxWidth());
        }else{
            return this.x;
        }
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Determines the y value of this component. Depends on whether it is set as a function of the screen dimensions or static.
        Method Return: int
    */
    getY(){
        if (typeof this.y === "function"){
            return this.y(getScreenHeight(), this.getMaxHeight());
        }else{
            return this.y;
        }
    }

    /*
        Method Name: getWidth
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getWidth(){
        return this.image.width;
    }

    /*
        Method Name: getHeight
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getHeight(){
        return this.image.height;
    }

    /*
        Method Name: setImage
        Method Parameters:
            image:
                An image
        Method Description: Setter
        Method Return: void
    */
    setImage(image){
        this.image = image;
    }

    /*
        Method Name: setX
        Method Parameters:
            x:
                The x location of the top left corner
        Method Description: Setter
        Method Return: void
    */
    setX(x){
        this.x = x;
    }

    /*
        Method Name: setY
        Method Parameters:
            y:
                The y location of the top left corner
        Method Description: Setter
        Method Return: void
    */
    setY(y){
        this.y = y;
    }

     /*
        Method Name: getImage
        Method Parameters: None
        Method Description: Getter
        Method Return: Image
    */
    getImage(){
        return this.image;
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Display the image on the screen
        Method Return: void
    */
    display(){
        if (!this.isDisplayEnabled()){ return; }
        let screenY = GC.getMenuManager().changeToScreenY(this.getY());
        let image = this.getImage();
        let translateX = this.getX() + this.getMaxWidth()/2;
        let translateY = screenY + this.getMaxHeight()/2;

        // Translate
        translate(translateX, translateY);

        // Scale
        scale(this.getMaxWidth() / this.getWidth(), this.getMaxHeight() / this.getHeight());

        // Display image
        displayImage(image, 0 - image.width/2, 0 - image.height/2);

        // Undo Scale
        scale(this.getWidth() / this.getMaxWidth(), this.getHeight() / this.getMaxHeight());

        // Undo translate
        translate(-1 * translateX, -1 * translateY);
    }

    /*
        Method Name: covers
        Method Parameters:
            x:
                Screen coordinate x
            y:
                Screen coordinate y
        Method Description: Determines whether the image covers a point on the screen
        Method Return: boolean, true -> covers, false -> does not cover
    */
    covers(x, y){
        return x >= this.getX() && x <= this.getX() + this.getMaxWidth() && y <= this.getY() && y >= this.getY() - this.getMaxHeight();
    }

    /*
        Method Name: setOnClick
        Method Parameters:
            func:
                the function to call when clicked
        Method Description: Setter
        Method Return: void
    */
    setOnClick(func){
        this.onClick = func;
    }

    /*
        Method Name: clicked
        Method Parameters: None
        Method Description: Calls the onClick handler function
        Method Return: void
    */
    clicked(){
        if (this.onClick === null){ return; }
        this.onClick();
    }
}