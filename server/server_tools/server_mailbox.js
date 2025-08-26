const Lock = require("../../scripts/general/lock.js").Lock;
const NotSamLinkedList = require("../../scripts/general/notsam_linked_list.js").NotSamLinkedList;

class ServerMailBox {
    constructor(defaultFolderSettingsJSON){
        this.folders = new NotSamLinkedList();
        this.setupDefaults(defaultFolderSettingsJSON);
        this.accessLock = new Lock();
    }

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

    setupDefaults(defaultFolderSettingsJSON){
        //debugger;
        for (let defaultFolderJSON of defaultFolderSettingsJSON["default_folders"]){
            this.folders.push({"folder_name": defaultFolderJSON["folder_name"], "list": new NotSamLinkedList(), "max_size": defaultFolderJSON["max_size"]})
        }
    }

    getFolder(folderName){
        // See if you can find it
        for (let [folderObj, fIndex] of this.folders){
            if (folderObj["folder_name"] === folderName){
                return folderObj;
            }
        }

        throw new Error("Requested folder: " + folderName + " not found.");
    }

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