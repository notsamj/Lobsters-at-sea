/*
    Class Name: LASSeaDisplay
    Description: A sea
*/
class LASSeaDisplay {
    /*
        Method Name: constructor
        Method Parameters: None
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(){
        this.meshes = new NotSamLinkedList();
        this.lasSeaDisplayJSON = MD["las_sea_data"];
    }

    getlasSeaDisplayJSON(){
        return this.lasSeaDisplayJSON;
    }

    /*
        Method Name: display
        Method Parameters:
            xCenter:
                Center of the screen x
            yCenter:
                Center of the screen y
        Method Description: Displays the sea
        Method Return: void
    */
    display(xCenter, yCenter){
        let lX = Math.floor(xCenter - getZoomedScreenWidth() / 2);
        let bY = Math.floor(yCenter - getZoomedScreenWidth() / 2);
        this.displayLASSeaMeshes(lX, bY);
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
    displayLASSeaMeshes(lX, bY){
        let rX = lX + getZoomedScreenWidth() - 1;
        let tY = bY + getZoomedScreenHeight() - 1;

        let leftLASSeaMeshX = Math.floor(lX / this.lasSeaDisplayJSON["mesh_width"]);
        let rightLASSeaMeshX = Math.floor(rX / this.lasSeaDisplayJSON["mesh_width"]);
        let bottomLASSeaMeshY = Math.floor(bY / this.lasSeaDisplayJSON["mesh_height"]);
        let topLASSeaMeshY = Math.floor(tY / this.lasSeaDisplayJSON["mesh_height"]);

        // Loop though all meshs and display
        for (let meshX = leftLASSeaMeshX; meshX <= rightLASSeaMeshX; meshX++){
            for (let meshY = bottomLASSeaMeshY; meshY <= topLASSeaMeshY; meshY++){
                this.getLASSeaMesh(meshX, meshY).display(lX, bY);
            }
        }
        // Save space by deleting far away mesh meshs
        this.deleteFarLASSeaMeshes(lX, bY);
    }

    /*
        Method Name: getLASSeaMesh
        Method Parameters: 
    
        Method Description: Finds a mesh mesh with the given identifiers and return it
        Method Return: LASSeaMesh
    */
    getLASSeaMesh(meshX, meshY){
        let foundLASSeaMesh = null;
        // Find the Tile Cluster if it exists
        for (let [mesh, meshIndex] of this.meshes){
            if (mesh.getQuadrantX() == meshX && mesh.getQuadrantY() == meshY){
                foundLASSeaMesh = mesh;
                break;
            }
        }
        // If Tile Cluster do not exist, create it
        if (foundLASSeaMesh == null){
            foundLASSeaMesh = new LASSeaMesh(meshX, meshY, this);
            this.meshes.append(foundLASSeaMesh);
        }
        return foundLASSeaMesh;
    }

    /*
        Method Name: deleteFarLASSeaMeshes
        Method Parameters:
            lX:
                The bottom left x displayed on the canvas relative to the focused entity
            bY:
                The bottom left y displayed on the canvas relative to the focused entity
        Method Description: Deletes all meshs that are a sufficient distance from the area currently being shown on screen
        Method Return: void
    */
    deleteFarLASSeaMeshes(lX, bY){
        let cX = lX + 0.5 * getZoomedScreenWidth();
        let cY = bY + 0.5 * getZoomedScreenHeight();
        for (let i = this.meshes.getLength() - 1; i >= 0; i--){
            let mesh = this.meshes.get(i);
            let distance = Math.sqrt(Math.pow(mesh.getQuadrantX() * this.lasSeaDisplayJSON["mesh_width"] - cX, 2) + Math.pow(mesh.getQuadrantY() * this.lasSeaDisplayJSON["mesh_height"] - cY, 2));
            // Delete meshs more than 2 times max(width, height) away from the center of the screen
            if (distance > this.lasSeaDisplayJSON["far_away_multiplier"] * Math.max(this.lasSeaDisplayJSON["mesh_width"], this.lasSeaDisplayJSON["mesh_height"])){
                this.meshes.remove(i);
            }
        }
    }


}

/*
    Class Name: LASSeaMesh
    Description: A collection of mesh objects in a x, y region
*/
class LASSeaMesh {
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
        let lasSeaDisplayJSON = this.backgroundManager.getlasSeaDisplayJSON();
        let meshWidth = lasSeaDisplayJSON["mesh_width"];
        let meshHeight = lasSeaDisplayJSON["mesh_height"];
        let tileWidth = lasSeaDisplayJSON["tile_width"];
        let tileHeight = lasSeaDisplayJSON["tile_height"];
        let leftX = this.meshX * meshWidth;
        let bottomY = this.meshY * meshHeight;
        
        let topLeftLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX - 1, this.meshY + 1);
        let topLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX, this.meshY + 1);
        let topRightLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX + 1, this.meshY + 1);

        let middleLeftLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX - 1, this.meshY);
        let middleLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX, this.meshY);
        let middleRightLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX + 1, this.meshY);

        let bottomLeftLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX - 1, this.meshY - 1);
        let bottomLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX, this.meshY - 1);
        let bottomRightLASSeaMeshColour = this.getColourOfLASSeaMesh(this.meshX + 1, this.meshY - 1);

        let colours = [
            [topLeftLASSeaMeshColour, topLASSeaMeshColour, topRightLASSeaMeshColour],
            [middleLeftLASSeaMeshColour, middleLASSeaMeshColour, middleRightLASSeaMeshColour],
            [bottomLeftLASSeaMeshColour, bottomLASSeaMeshColour, bottomRightLASSeaMeshColour]
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
                this.tiles.push(new LASSeaMeshTile(x, y+tileHeight, tileWidth, tileHeight, colour));
            }
        }
    }

    /*
        Method Name: getColourOfLASSeaMesh
        Method Parameters: 
            meshX:
                LASSeaMesh x coordinate
            meshY:
                LASSeaMesh y coordinate
        Method Description: Gets the color of a mesh with a given coordinate set
        Method Return: Colour
    */
    getColourOfLASSeaMesh(meshX, meshY){
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
    Class Name: LASSeaMeshTile
    Description: A tile
*/
class LASSeaMeshTile {
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