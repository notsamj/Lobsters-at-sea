/*
    Class Name: FakeWebSocket
    Class Description: A fake websocket (replacement for testing)
*/
class FakeWebSocket {
    /*
        Method Name: constructor
        Method Parameters: 
            address:
                String address to the server
        Method Description: constructor
        Method Return: constructor
    */
    constructor(address){
        this.address = address;
        this.eventHandler = new NSEventHandler();

        this.test();
    }

    /*
        Method Name: test
        Method Parameters: None
        Method Description: Test method
        Method Return: void
    */
    test(){
        let thisRef = this;
        
        let errorEventJSON = {
            "name": "error",
            "abc": "d"
        }
        let myFunc = () => {
            thisRef.emit(errorEventJSON);
        }

        setTimeout(myFunc, 2000);
    }

    /*
        Method Name: addEventListener
        Method Parameters: 
            key:
                A key 
            func:
                A function
        Method Description: Adds an event listener
        Method Return: void
    */
    addEventListener(key, func){
        this.eventHandler.addHandler(key, func);
    }

    /*
        Method Name: emit
        Method Parameters: 
            eventJSON:
                A JSON to send out
        Method Description: Sends out a JSON
        Method Return: void
    */
    emit(eventJSON){
        this.eventHandler.emit(eventJSON);
    }


}