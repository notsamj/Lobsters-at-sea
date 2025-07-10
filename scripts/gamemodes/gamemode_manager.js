/*
    Class Name: GamemodeManager
    Description: A tool for managing the current game mode and client
*/
class GamemodeManager {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.gamemode = null;
    }

    /*
        Method Name: getActiveGameName
        Method Parameters: None
        Method Description: Gets the active game game
        Method Return: String or null
    */
    getActiveGameName(){
        if (!this.hasActiveGamemode()){
            return null;
        }
        return this.gamemode.getName();
    }

    /*
        Method Name: handleUnpause
        Method Parameters: None
        Method Description: Tells game to handle the unpause
        Method Return: void
    */
    handleUnpause(){
        if (this.hasActiveGamemode()){
            this.gamemode.handleUnpause();
        }
    }

    /*
        Method Name: hasActiveGamemode
        Method Parameters: None
        Method Description: Checks if there is a gamemode running at the moment
        Method Return: Boolean
    */
    hasActiveGamemode(){
        return this.gamemode != null;
    }

    /*
        Method Name: getActiveGamemode
        Method Parameters: None
        Method Description: Getter
        Method Return: GamemodeClient
    */
    getActiveGamemode(){
        return this.gamemode;
    }

    /*
        Method Name: setActiveGamemode
        Method Parameters:
            gamemode:
                A new game mode client that is running a game
        Method Description: Setter
        Method Return: void
    */
    setActiveGamemode(gamemode){
        this.gamemode = gamemode;
    }

    /*
        Method Name: deleteActiveGamemode
        Method Parameters: None
        Method Description: Removes the active gamemode
        Method Return: void
    */
    deleteActiveGamemode(){
        this.gamemode = null;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Tells the current client to run a tick
        Method Return: void
    */
    async tick(){
        if (!this.hasActiveGamemode()){ return; }
        await this.gamemode.tick();
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Tells the gamemode client to display
        Method Return: void
    */
    display(){
        if (!this.hasActiveGamemode()){ return; }
        this.gamemode.display();
    }
}