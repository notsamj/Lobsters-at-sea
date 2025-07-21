/*  
    Class Name: SpectatorCamera
    Class Description: A camera to be operated when spectating ships
*/
class SpectatorCamera {
    /*
        Method Name: constructor
        Method Parameters: 
            game:
                Game instance
            cameraJSON:
                JSON with camera info
        Method Description: constructor
        Method Return: constructor
    */
    constructor(game, cameraJSON){
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.leftRightLock = new TickLock(cameraJSON["left_right_cooldown_ms"] / this.game.getGameProperties()["ms_between_ticks"]);
        this.moveSpeed = cameraJSON["move_speed_px_sec"];
        this.xVelocity = 0;
        this.yVelocity = 0;
        this.xLock = new TickLock(0);
        this.yLock = new TickLock(0);
        this.followedShip = null;
        this.scrollLock = new Lock();
        this.snapLock = new Lock();
    }

    getGame(){
        return this.game;
    }

    /*
        Method Name: setPosition
        Method Parameters: 
            x:
                x coordinate
            y:
                y coordinate
        Method Description: Changes the position of the camera
        Method Return: void
    */
    setPosition(x, y){
        this.x = x;
        this.y = y;
    }

    /*
        Method Name: checkMoveX
        Method Parameters: None
        Method Description: Checks if the user wants to move the camera left or right
        Method Return: void
    */
    checkMoveX(){
        let leftKey = GC.getGameUserInputManager().isActivated("camera_move_left");
        let rightKey = GC.getGameUserInputManager().isActivated("camera_move_right");
        let numKeysDown = 0;
        numKeysDown += leftKey ? 1 : 0;
        numKeysDown += rightKey ? 1 : 0;
        if (numKeysDown == 0 || numKeysDown == 2 || this.isFollowingAShip()){
            this.xVelocity = 0;
            return;
        }else if (!this.xLock.isReady()){ return; }
        this.xLock.lock();

        // Else 1 key down and ready to move
        this.xVelocity = this.moveSpeed / gameZoom;
        this.xVelocity *= leftKey ? -1 : 1;
    }

    /*
        Method Name: checkMoveY
        Method Parameters: None
        Method Description: Checks if the user wants to move the camera up or down
        Method Return: void
    */
    checkMoveY(){
        let upKey = GC.getGameUserInputManager().isActivated("camera_move_up");
        let downKey = GC.getGameUserInputManager().isActivated("camera_move_down");
        let numKeysDown = 0;
        numKeysDown += upKey ? 1 : 0;
        numKeysDown += downKey ? 1 : 0;
        if (numKeysDown == 0 || numKeysDown == 2 || this.isFollowingAShip()){
            this.yVelocity = 0;
            return;
        }else if (!this.yLock.isReady()){ return; }
        this.yLock.lock();

        // Else 1 key down and ready to move
        this.yVelocity = this.moveSpeed / gameZoom;
        this.yVelocity *= downKey ? -1 : 1; 
    }

    /*
        Method Name: getFreeCamFrameX
        Method Parameters: None
        Method Description: Gets the current x of the camera for display purposes (in free-cam mode)
        Method Return: float
    */
    getFreeCamFrameX(){
        return this.x + this.xVelocity * (GC.getGameTickScheduler().getDisplayMSSinceLastTick()) / 1000;
    }

    /*
        Method Name: getFreeCamFrameY
        Method Parameters: None
        Method Description: Gets the current y of the camera for display purposes (in free-cam mode)
        Method Return: float
    */
    getFreeCamFrameY(){
        return this.y + this.yVelocity * (GC.getGameTickScheduler().getDisplayMSSinceLastTick()) / 1000;
    }

    getFreeCamTickX(){
        return this.x;
    }

    getTickX(){
        if (this.isFollowingAShip()){
            return this.followedShip.getTickX();
        }
        return this.getFreeCamTickX();
    }

    getFreeCamTickXV(){
        return this.xVelocity;
    }

    getTickXV(){
        if (this.isFollowingAShip()){
            return this.followedShip.getTickXV();
        }
        return this.getFreeCamTickXV();
    }

    getFreeCamTickY(){
        return this.x;
    }

    getTickY(){
        if (this.isFollowingAShip()){
            return this.followedShip.getTickY();
        }
        return this.getFreeCamTickY();
    }

    getFreeCamTickYV(){
        return this.yVelocity;
    }

    getTickYV(){
        if (this.isFollowingAShip()){
            return this.followedShip.getTickYV();
        }
        return this.getFreeCamTickYV();
    }

    getTickOrientation(){
        if (this.isFollowingAShip()){
            return this.followedShip.getTickOrientation();
        }
        return 0;
    }

    getTickSailStrength(){
        if (this.isFollowingAShip()){
            return this.followedShip.getTickSailStrength();
        }
        return 0;
    }

    /*
        Method Name: getFrameX
        Method Parameters: None
        Method Description: Gets the current x of the camera for display purposes
        Method Return: float
    */
    getFrameX(){
        if (this.isFollowingAShip()){
            return this.getFollowedShip().getFrameX();
        }else{
            return this.getFreeCamFrameX();
        }
    }

    /*
        Method Name: getFrameY
        Method Parameters: None
        Method Description: Gets the current y of the camera for display purposes
        Method Return: float
    */
    getFrameY(){
        if (this.isFollowingAShip()){
            return this.getFollowedShip().getFrameY();
        }else{
            return this.getFreeCamFrameY();
        }
    }

    /*
        Method Name: checkSnap
        Method Parameters: None
        Method Description: Checks if the user is trying to snap the camera
        Method Return: void
    */
    checkSnap(){
        let wantsToSnap = GC.getGameUserInputManager().isActivated("camera_snap_follow_toggle");
        if (wantsToSnap && this.snapLock.isUnlocked()){
            this.snapLock.lock();
            if (this.isFollowingAShip()){
                this.stopFollowing();
            }else{
                this.snapToClosestEntity();
            }
        }
        this.snapLock.unlockIfLocked();
    }

    /*
        Method Name: snapToClosestEntity
        Method Parameters: None
        Method Description: Snaps the camera to the closest entity
        Method Return: void
    */
    snapToClosestEntity(){
        let ships = this.getGame().getShips();

        if (ships.length === 0){
            throw new Error("No ships supplied");
        }

        let bestS;
        let bestD = undefined;

        let myX = this.getTickX();
        let myY = this.getTickY();

        for (let [ship, shipIndex] of ships){
            let distanceToShip = calculateEuclideanDistance(myX, myY, ship.getTickX(), ship.getTickY());
            if (bestD === undefined || distanceToShip < bestD){
                bestD = distanceToShip;
                bestS = ship;
            }
        }

        this.followedShip = bestS;
    }

    /*
        Method Name: scrollShips
        Method Parameters: 
            direction:
                Direction to scroll
        Method Description: Scrolls through ships
        Method Return: void
    */
    scrollShips(direction){
        let ships = this.getGame().getShips();

        if (ships.getLength() === 0){
            throw new Error("No ships supplied.");
        }
        // Don't scroll if there is only 1 ship
        else if (ships.getLength() === 1){
            return;
        }

        if (!this.isFollowingAShip()){
            throw new Error("Trying to scroll but not following.");
        }

        let currentShipID = this.getFollowedShip().getID();
        let currentShipIndex = -1;

        // Find current ship index
        for (let [ship, shipIndex] of ships){
            if (ship.getID() === currentShipID){
                currentShipIndex = shipIndex;
                break;
            }
        }

        if (currentShipIndex === -1){
            throw new Error("Current ship not found.");
        }

        // Get index of next one in direction

        let nextIndex = currentShipIndex + direction;

        if (nextIndex >= ships.getLength()){
            nextIndex = 0;
        }else if (nextIndex < 0){
            nextIndex = ships.getLength() - 1;
        }

        // Change to new entity
        this.followedShip = ships.get(nextIndex);
    }

    /*
        Method Name: checkScrollShips
        Method Parameters: None
        Method Description: Checks if the user is trying to scroll troops
        Method Return: void
    */
    checkScrollShips(){
        if (!this.isFollowingAShip()){
            return;
        }
        let wantsToScrollLeft = GC.getGameUserInputManager().isActivated("scroll_left_ticked_game");
        let wantsToScrollRight = GC.getGameUserInputManager().isActivated("scroll_right_ticked_game");

        if (this.scrollLock.isLocked()){
            this.scrollLock.unlock();
            return;
        }

        // If they don't want to scroll either way
        if (!(wantsToScrollLeft || wantsToScrollRight)){
            return;
        }

        this.scrollLock.lock();

        if (wantsToScrollLeft){
            this.scrollShips(-1);
        }else if(wantsToScrollRight){
            this.scrollShips(1);
        }
    }

    /*
        Method Name: isFollowingAShip
        Method Parameters: None
        Method Description: Checks if the camera is currently following an entity
        Method Return: boolean
    */
    isFollowingAShip(){
        return this.getFollowedShip() != null;
    }

    /*
        Method Name: getFollowedShip
        Method Parameters: None
        Method Description: Getter
        Method Return: Entity
    */
    getFollowedShip(){
        return this.followedShip;
    }

    /*
        Method Name: stopFollowing
        Method Parameters: None
        Method Description: Stops following the current entity
        Method Return: void
    */
    stopFollowing(){
        this.x = this.followedShip.getTickX();
        this.y = this.followedShip.getTickY();
        this.followedShip = null;
    }

    /*
        Method Name: tick
        Method Parameters: None
        Method Description: Runs processes during a tick
        Method Return: void
    */
    tick(){
        // Update tick locks
        this.xLock.tick();
        this.yLock.tick();
        this.leftRightLock.tick();
        this.x += this.xVelocity / this.getTickRate();
        this.y += this.yVelocity / this.getTickRate();
        this.checkMoveX();
        this.checkMoveY();
        this.checkSnap();
        this.checkScrollShips();
    }

    getTickRate(){
        return this.getGame().getGameProperties()["tick_rate"];
    }

    /*
        Method Name: display
        Method Parameters: None
        Method Description: Displays the focused entity or hud info
        Method Return: void
    */
    display(){
        if (this.isFollowingAShip()){
            this.followedShip.displayWhenFocused();
        }
    }
}