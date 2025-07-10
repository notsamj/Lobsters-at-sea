/*
    Class Name: LoadingScreenComponent
    Description: A component that displays a loading screen
*/
class LoadingScreenComponent extends Component {
    /*
        Method Name: constructor
        Method Parameters: 
            allowMovement:
                Boolean specifying if movement is allowed
        Method Description: constructor
        Method Return: constructor
    */
    constructor(allowMovement=true){
        super();
        this.allowMovement = allowMovement;
    }
    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the loading screen
        Method Return: void
    */
    display(){
        GC.getLoadingScreen().display(this.allowMovement);
    }
}