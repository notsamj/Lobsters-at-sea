/*
    Class Name: LoadingScreen
    Description: A loading screen of squares
*/
class LoadingScreen {
    /*
        Method Name: constructor
        Method Parameters:
            loadingScreenJSON:
                JSON with information on the loading screen
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(loadingScreenJSON){
        this.meshes = new NotSamLinkedList();
        this.loadingScreenJSON = loadingScreenJSON;
        this.xVelocity = randomFloatBetween(this.loadingScreenJSON["min_x_velocity"], this.loadingScreenJSON["max_x_velocity"]) * (randomBoolean() ? 1 : -1);
        this.yVelocity = randomFloatBetween(this.loadingScreenJSON["min_y_velocity"], this.loadingScreenJSON["max_y_velocity"]) * (randomBoolean() ? 1 : -1);
        this.x = randomFloatBetween(this.loadingScreenJSON["origin_x_range_size"] * -1, this.loadingScreenJSON["origin_x_range_size"]);
        this.y = randomFloatBetween(this.loadingScreenJSON["origin_y_range_size"] * -1, this.loadingScreenJSON["origin_y_range_size"]);

    }

    /*
        Method Name: getLoadingScreenJSON
        Method Parameters: None
        Method Description: Getter
        Method Return: JSON
    */
    getLoadingScreenJSON(){
        return this.loadingScreenJSON;
    }

    /*
        Method Name: display
        Method Parameters: 
            allowMovement:
                Allows the movement of squares
        Method Description: Displays squares
        Method Return: void
    */
    display(allowMovement=true){
        if (allowMovement){
            this.x += this.xVelocity / gameZoom;
            this.y += this.yVelocity / gameZoom;
        }
        this.displayMeshes(this.x, this.y);
    }

    /*
        Method Name: display
        Method Parameters:
            lX:
                The bottom left x displayed on the canvas relative to the focused entity
            bY:
                The bottom left y displayed on the canvas relative to the focused entity
        Method Description: Displays meshs
        Method Return: void
    */
    displayMeshes(lX, bY){
        let rX = lX + getZoomedScreenWidth() - 1;
        let tY = bY + getZoomedScreenHeight() - 1;

        let leftMeshX = Math.floor(lX / this.loadingScreenJSON["mesh_width"]);
        let rightMeshX = Math.floor(rX / this.loadingScreenJSON["mesh_width"]);
        let bottomMeshY = Math.floor(bY / this.loadingScreenJSON["mesh_height"]);
        let topMeshY = Math.floor(tY / this.loadingScreenJSON["mesh_height"]);

        // Loop though all meshs and display
        for (let meshX = leftMeshX; meshX <= rightMeshX; meshX++){
            for (let meshY = bottomMeshY; meshY <= topMeshY; meshY++){
                this.getMesh(meshX, meshY).display(lX, bY);
            }
        }
        // Save space by deleting far away mesh meshs
        this.deleteFarMeshes(lX, bY);
    }

    /*
        Method Name: getMesh
        Method Parameters: 
    
        Method Description: Finds a mesh mesh with the given identifiers and return it
        Method Return: Mesh
    */
    getMesh(meshX, meshY){
        let foundMesh = null;
        // Find the Tile Cluster if it exists
        for (let [mesh, meshIndex] of this.meshes){
            if (mesh.getQuadrantX() == meshX && mesh.getQuadrantY() == meshY){
                foundMesh = mesh;
                break;
            }
        }
        // If Tile Cluster do not exist, create it
        if (foundMesh == null){
            foundMesh = new Mesh(meshX, meshY, this);
            this.meshes.append(foundMesh);
        }
        return foundMesh;
    }

    /*
        Method Name: deleteFarMeshes
        Method Parameters:
            lX:
                The bottom left x displayed on the canvas relative to the focused entity
            bY:
                The bottom left y displayed on the canvas relative to the focused entity
        Method Description: Deletes all meshs that are a sufficient distance from the area currently being shown on screen
        Method Return: void
    */
    deleteFarMeshes(lX, bY){
        let cX = lX + 0.5 * getZoomedScreenWidth();
        let cY = bY + 0.5 * getZoomedScreenHeight();
        for (let i = this.meshes.getLength() - 1; i >= 0; i--){
            let mesh = this.meshes.get(i);
            let distance = Math.sqrt(Math.pow(mesh.getQuadrantX() * this.loadingScreenJSON["mesh_width"] - cX, 2) + Math.pow(mesh.getQuadrantY() * this.loadingScreenJSON["mesh_height"] - cY, 2));
            // Delete meshs more than 2 times max(width, height) away from the center of the screen
            if (distance > this.loadingScreenJSON["far_away_multiplier"] * Math.max(this.loadingScreenJSON["mesh_width"], this.loadingScreenJSON["mesh_height"])){
                this.meshes.remove(i);
            }
        }
    }


}

/*
    Class Name: Mesh
    Description: A collection of mesh objects in a x, y region
*/
class Mesh {
    /*
        Method Name: constructor
        Method Parameters: 
            meshX:
                The x coordinate of the mesh
            meshY:
                The y coordinate of the mesh
            backgroundManager:
                The loading screen instance
        Method Description: constructor
        Method Return: constructor
    */
    constructor(meshX, meshY, backgroundManager){
        this.backgroundManager = backgroundManager;
        this.meshX = meshX;
        this.meshY = meshY;
        this.tiles = [];
        this.createTiles();
    }

    /*
        Method Name: getQuadrantX
        Method Parameters: None
        Method Description: Getter
        Method Return: Integer
    */
    getQuadrantX(){
        return this.meshX;
    }

    /*
        Method Name: getQuadrantY
        Method Parameters: None
        Method Description: Getter
        Method Return: Integer
    */
    getQuadrantY(){
        return this.meshY;
    }

    /*
        Method Name: createTiles
        Method Parameters: None
        Method Description: Creates many mesh objects
        Method Return: void
    */
    createTiles(){
        let loadingScreenJSON = this.backgroundManager.getLoadingScreenJSON();
        let meshWidth = loadingScreenJSON["mesh_width"];
        let meshHeight = loadingScreenJSON["mesh_height"];
        let tileWidth = loadingScreenJSON["tile_width"];
        let tileHeight = loadingScreenJSON["tile_height"];
        let leftX = this.meshX * meshWidth;
        let bottomY = this.meshY * meshHeight;
        
        let topLeftMeshColour = this.getColourOfMesh(this.meshX - 1, this.meshY + 1);
        let topMeshColour = this.getColourOfMesh(this.meshX, this.meshY + 1);
        let topRightMeshColour = this.getColourOfMesh(this.meshX + 1, this.meshY + 1);

        let middleLeftMeshColour = this.getColourOfMesh(this.meshX - 1, this.meshY);
        let middleMeshColour = this.getColourOfMesh(this.meshX, this.meshY);
        let middleRightMeshColour = this.getColourOfMesh(this.meshX + 1, this.meshY);

        let bottomLeftMeshColour = this.getColourOfMesh(this.meshX - 1, this.meshY - 1);
        let bottomMeshColour = this.getColourOfMesh(this.meshX, this.meshY - 1);
        let bottomRightMeshColour = this.getColourOfMesh(this.meshX + 1, this.meshY - 1);

        let colours = [
            [topLeftMeshColour, topMeshColour, topRightMeshColour],
            [middleLeftMeshColour, middleMeshColour, middleRightMeshColour],
            [bottomLeftMeshColour, bottomMeshColour, bottomRightMeshColour]
        ]

        // Blend with colours of other meshes

        // Create Tiles
        let middleX = leftX + meshWidth/2;
        let middleY = bottomY + meshHeight/2;
        for (let x = leftX; x < leftX + meshWidth; x += tileWidth){
            for (let y = bottomY; y < bottomY + meshHeight; y += tileHeight){
                let colourY = ((y - middleY) / meshHeight) + 1;
                let colourYFloor = Math.floor(colourY);
                let colourYFloorProportion = colourY - colourYFloor;
                let colourYCeil = Math.ceil(colourY);
                let colourYCeilProportion = 1 - colourYFloorProportion;

                let colourX = ((x - middleX) / meshWidth) + 1;
                let colourXFloor = Math.floor(colourX);
                let colourXFloorProportion = colourX - colourXFloor;
                let colourXCeil = Math.ceil(colourX);
                let colourXCeilProportion = 1 - colourXFloorProportion;
                let red = colours[colourYCeil][colourXCeil].getRed() * colourYCeilProportion * colourXCeilProportion + colours[colourYCeil][colourXFloor].getRed() * colourYCeilProportion * colourXFloorProportion + colours[colourYFloor][colourXCeil].getRed() * colourYFloorProportion * colourXCeilProportion + colours[colourYFloor][colourXFloor].getRed() * colourYFloorProportion * colourXFloorProportion;
                let green = colours[colourYCeil][colourXCeil].getGreen() * colourYCeilProportion * colourXCeilProportion + colours[colourYCeil][colourXFloor].getGreen() * colourYCeilProportion * colourXFloorProportion + colours[colourYFloor][colourXCeil].getGreen() * colourYFloorProportion * colourXCeilProportion + colours[colourYFloor][colourXFloor].getGreen() * colourYFloorProportion * colourXFloorProportion;
                let blue = colours[colourYCeil][colourXCeil].getBlue() * colourYCeilProportion * colourXCeilProportion + colours[colourYCeil][colourXFloor].getBlue() * colourYCeilProportion * colourXFloorProportion + colours[colourYFloor][colourXCeil].getBlue() * colourYFloorProportion * colourXCeilProportion + colours[colourYFloor][colourXFloor].getBlue() * colourYFloorProportion * colourXFloorProportion;
                let colour = new Colour(Math.floor(red), Math.floor(green), Math.floor(blue), 1);
                this.tiles.push(new LSTile(x, y+tileHeight, tileWidth, tileHeight, colour));
            }
        }
    }

    /*
        Method Name: getColourOfMesh
        Method Parameters: 
            meshX:
                Mesh x coordinate
            meshY:
                Mesh y coordinate
        Method Description: Gets the color of a mesh with a given coordinate set
        Method Return: Colour
    */
    getColourOfMesh(meshX, meshY){
        let seed = XYToSeed(meshX, meshY);
        let random = new SeededRandomizer(seed);
        let minB = 140;
        let maxB = 220;
        let maxMultiplier = 0.1;
        let b = random.getIntInRangeInclusive(minB, maxB);
        let r = random.getIntInRangeInclusive(0, Math.floor(b * maxMultiplier));
        let g = random.getIntInRangeInclusive(0, Math.floor(b * maxMultiplier));
        let colour = new Colour(r, g, b, 1);
        return colour;
    }

    /*
        Method Name: display
        Method Parameters:
            lX:
                The bottom left x displayed on the canvas relative to the focused entity
            bY:
                The bottom left y displayed on the canvas relative to the focused entity
        Method Description: Displays all the meshs in the mesh
        Method Return: void
    */
    display(lX, bY){
        for (let tile of this.tiles){
            tile.display(lX, bY);
        }
    }
}

/*
    Class Name: LSTile
    Description: A collection of circles.
*/
class LSTile {
    /*
        Method Name: constructor
        Method Parameters: 
            x:
                x coordinate
            y:
                y coordinate
            tileWidth:
                The tile width
            tileHeight:
                The tile height
            colour:
                The colour of the tile
        Method Description: constructor
        Method Return: constructor
    */
    constructor(x, y, tileWidth, tileHeight, colour){
        this.x = x;
        this.y = y;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.colour = colour;
    }

    /*
        Method Name: display
        Method Parameters:
            lX:
                The bottom left x displayed on the canvas relative to the focused entity
            bY:
                The bottom left y displayed on the canvas relative to the focused entity
        Method Description: Displays all the circles in the mesh.
        Method Return: void
    */
    display(lX, bY){
        let screenX = Math.floor(this.getDisplayX(this.x, lX));
        let screenY = Math.floor(this.getDisplayY(this.y, bY));
        // Display the circle
        noStrokeRectangle(this.colour, screenX, screenY, this.tileWidth*gameZoom, this.tileHeight*gameZoom);
    }

    /*
        Method Name: getDisplayX
        Method Parameters: 
            centerX:
                The center x
            lX:
                The x of the left of the screen
        Method Description: Gets the display x
        Method Return: float
    */
    getDisplayX(centerX, lX){
        return (centerX - lX) * gameZoom;
    }

    /*
        Method Name: getDisplayY
        Method Parameters: 
            centerY:
                The center y
            bY:
                The y of the bottom of the screen
            centerX:
        Method Description: Gets the display y
        Method Return: float
    */
    getDisplayY(centerY, bY){
        return getCanvasHeight() - (centerY - bY) * gameZoom;
    }
}