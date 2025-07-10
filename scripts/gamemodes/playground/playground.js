class Playground extends Gamemode {

    tick(){
        // TODO
    }

    getName(){ return "playground"; }

    getGame(){
        return GC.getGameInstance();
    }

    display(){
        // Display game
        this.getGame().display();


        // Display FPS
        let fps = GC.getFrameCounter().getFPS();
        let hud = GC.getHUD();
        hud.updateElement("fps", fps);
        hud.display();
    }
}