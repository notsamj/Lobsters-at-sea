/*
    Class Name: StaticImage
    Description: A subclass of Component. A box of text.
*/
class TextComponent extends Component {
    /*
        Method Name: constructor
        Method Parameters:
            textStr:
                String of text inside the rectangle
            textColourCode:
                The colour of the text inside the rectangle (code)
            x:
                The x location of the top left of the rectangle
            y:
                The y location of the top left of the rectangle
            width:
                The width of the rectangle
            height:
                The height of the rectangle
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(textStr, textColourCode, x, y, width, height, alignLR="left", alignTB="top"){
        super();
        this.textStr = textStr;
        this.textColourCode = textColourCode;
        this.x = x;
        this.y = y;
        this.alignLR = alignLR;
        this.alignTB = alignTB;
        this.width = width;
        this.height = height;
    }

    /*
        Method Name: getX
        Method Parameters: None
        Method Description: Either return x or if its a function, return its evaluation with the current screen width
        Method Return: Number
    */
    getX(){
        if (typeof this.x === "function"){
            return this.x(getScreenWidth());
        }else{
            return this.x;
        }
    }

    /*
        Method Name: getY
        Method Parameters: None
        Method Description: Either return y or if its a function, return its evaluation with the current screen height
        Method Return: Number
    */
    getY(){
        if (typeof this.y === "function"){
            return this.y(getScreenHeight());
        }else{
            return this.y;
        }
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the text on the screen
        Method Return: void
    */
    display(){
        if (!this.enabled){ return; }
        Menu.makeText(this.textStr, this.textColourCode, this.getX(), this.getY(), this.width, this.height, this.alignLR, this.alignTB);
    }

    /*
        Method Name: setText
        Method Parameters: None
        Method Description: Setter
        Method Return: void
    */
    setText(str){
        this.textStr = str;
    }
}