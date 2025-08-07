class FakeWebSocket {
    constructor(address){
        this.address = address;
        this.eventHandler = new NSEventHandler();

        this.test();
    }

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

    addEventListener(key, func){
        this.eventHandler.addHandler(key, func);
    }

    emit(eventJSON){
        this.eventHandler.emit(eventJSON);
    }


}