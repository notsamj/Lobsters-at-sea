/*
    Class Name: ScrollingMessageDisplay
    Description: Records and displays messages
*/
class ScrollingMessageDisplay extends Component {
    /*
        Method Name: constructor
        Method Parameters:
            configJSON:
                JSON configuration for this component
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(configJSON){
        super();
        this.configJSON = configJSON;
        this.messages = [];
        this.messageFeedOffsetLock = new Lock();
        this.messageFeedOffset = 0;
        this.maxMessageRowsToDisplay = Math.floor(this.configJSON["y_size"] / this.configJSON["text_size"])
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays messages
        Method Return: void
    */
    display(){
        this.tick();

        // Display message feed
        this.displayMessageFeed();
    }

    addMessage(text, colorCode=null){
        if (colorCode === null){
            colorCode = this.configJSON["default_message_color_code"];
        }
        this.messages.push({"text": text, "color_code": colorCode})
    }

    /*
        Method Name: displayKillFeed
        Method Parameters: None
        Method Description: Displays the kill feed
        Method Return: void
    */
    displayMessageFeed(){
        let lastToDisplayIndex = this.messages.length - 1 - this.messageFeedOffset;
        let firstToDisplayIndex = Math.max(0, lastToDisplayIndex - this.maxMessageRowsToDisplay);
        let textSize = this.configJSON["text_size"];
        updateFontSize(textSize);

        let messageFeedXSize = this.configJSON["x_size"];
        let messageFeedYSize = this.configJSON["y_size"];

        let startY = Math.floor((getScreenHeight() - messageFeedYSize) / 2);
        let leftX = Math.floor((getScreenWidth() - messageFeedXSize) / 2);

        // Display background
        noStrokeRectangle(Colour.fromCode(this.configJSON["background_color_code"]), leftX, startY, messageFeedXSize, messageFeedYSize);

        // Display messages
        for (let i = firstToDisplayIndex; i <= lastToDisplayIndex; i++){
            let currentY = startY + (i - firstToDisplayIndex) * textSize;
            let messageText = this.messages[i]["text"];
            let color = Colour.fromCode(this.messages[i]["color_code"]);
            makeTextExplicit(messageText, textSize, color, leftX, currentY, "left", "top");
        }
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: handles tick logic
        Method Return: void
    */
    tick(){
        let messageFeedOffset = this.messageFeedOffset;
        let up = GC.getMenuUserInputManager().isActivated("message_feed_up");
        let down = GC.getMenuUserInputManager().isActivated("message_feed_down");
        // If both / neither button are pressed then do nothing
        if ((up && down) || (!up && !down)){
            this.messageFeedOffsetLock.unlock();
            return;
        }
        if (this.messageFeedOffsetLock.isLocked()){
            return;
        }
        this.messageFeedOffsetLock.lock();
        if (up){
            messageFeedOffset += 1;
        }else if (down){
            messageFeedOffset -= 1;
        }

        // Don't allow < 0
        if (messageFeedOffset < 0){
            return;
        }

        // Must be in range [0, this.messages.length - this.maxMessageRowsToDisplay]
        messageFeedOffset = Math.min(messageFeedOffset, Math.max(0, this.messages.length - this.maxMessageRowsToDisplay));
        this.messageFeedOffset = messageFeedOffset;
    }

}