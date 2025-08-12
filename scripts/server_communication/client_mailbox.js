class ClientMailbox {
    constructor(defaultFolderSettingsJSON){
        this.folders = new NotSamLinkedList();
        this.setupDefaults(defaultFolderSettingsJSON);
    }

    setupDefaults(defaultFolderSettingsJSON){
        //debugger;
        for (let defaultFolderJSON of defaultFolderSettingsJSON["default_folders"]){
            this.folders.push({"folder_name": defaultFolderJSON["folder_name"], "list": new NotSamLinkedList(), "max_size": defaultFolderJSON["max_size"]})
        }
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
        //console.log("Delvering", JSON.stringify(dataJSON))
        let folderObj = this.getCreateFolder(folderName);
        folderObj["list"].push({"read": false, "data_json": dataJSON});

        // If over-sized, delete element 0
        if (folderObj["max_size"] != null && folderObj["max_size"] < folderObj["list"].getLength()){
            folderObj["list"].pop(0);
        }
    }


}