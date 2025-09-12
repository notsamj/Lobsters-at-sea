const Lock = require("../../scripts/general/lock.js").Lock;
const NotSamLinkedList = require("../../scripts/general/notsam_linked_list.js").NotSamLinkedList;

/*
    Class Name: ServerMailBox
    Class Description: A mailbox for the server to receive messages
*/
class ServerMailBox {
    /*
        Method Name: constructor
        Method Parameters: 
            defaultFolderSettingsJSON:
                JSON with settings for the mailbox
        Method Description: constructor
        Method Return: constructor
    */
    constructor(defaultFolderSettingsJSON){
        this.folders = new NotSamLinkedList();
        this.setupDefaults(defaultFolderSettingsJSON);
        this.accessLock = new Lock();
    }

    /*
        Method Name: clear
        Method Parameters: None
        Method Description: Clears the mailbox
        Method Return: void
    */
    clear(){
        // Clear all
        for (let [folder, folderIndex] of this.folders){
            let oldLength = folder["list"].getLength();
            folder["list"].clear();
        }
    }

    /*
        Method Name: requestAccess
        Method Parameters: None
        Method Description: Awaits access to be granted
        Method Return: Promise (implicit)
    */
    async requestAccess(){
        return this.accessLock.awaitUnlock(true);
    }

    /*
        Method Name: relinquishAccess
        Method Parameters: None
        Method Description: Removes access
        Method Return: void
    */
    relinquishAccess(){
        this.accessLock.unlock();
    }

    /*
        Method Name: setupDefaults
        Method Parameters: 
            defaultFolderSettingsJSON:
                Mailbox settings
        Method Description: Sets up default mailboxes
        Method Return: void
    */
    setupDefaults(defaultFolderSettingsJSON){
        for (let defaultFolderJSON of defaultFolderSettingsJSON["default_folders"]){
            this.folders.push({"folder_name": defaultFolderJSON["folder_name"], "list": new NotSamLinkedList(), "max_size": defaultFolderJSON["max_size"]})
        }
    }

    /*
        Method Name: getFolder
        Method Parameters: 
            folderName:
                Folder name (String)
        Method Description: Gets a folder with a given name
        Method Return: void
    */
    getFolder(folderName){
        // See if you can find it
        for (let [folderObj, fIndex] of this.folders){
            if (folderObj["folder_name"] === folderName){
                return folderObj;
            }
        }

        throw new Error("Requested folder: " + folderName + " not found.");
    }

    /*
        Method Name: getCreateFolder
        Method Parameters: 
            folderName:
                Name of the folder (string)
        Method Description: Gets or gets and creates a folder
        Method Return: JSON
    */
    getCreateFolder(folderName){
        let foundFounderObj = null;

        // See if you can find it
        for (let [folderObj, fIndex] of this.folders){
            if (folderObj["folder_name"] === folderName){
                foundFounderObj = folderObj;
                break;
            }
        }

        // Else, create it
        if (foundFounderObj === null){
            let newFounderObj = {"folder_name": folderName, "list": new NotSamLinkedList(), "max_size": null}
            this.folders.push(newFounderObj);
            foundFounderObj = newFounderObj;
        }

        return foundFounderObj;
    }

    /*
        Method Name: deliver
        Method Parameters:
            dataJSON:
                JSON to deliver
            folderName:
                Folder to deliver the message to
        Method Description: Delivers a json to a folder
        Method Return: void
    */
    deliver(dataJSON, folderName="general"){
        let folderObj = this.getCreateFolder(folderName);
        folderObj["list"].push({"read": false, "data_json": dataJSON});

        // If over-sized, delete element 0
        if (folderObj["max_size"] != null && folderObj["max_size"] < folderObj["list"].getLength()){
            folderObj["list"].pop(0);
        }
    }


}

module.exports = { ServerMailBox }