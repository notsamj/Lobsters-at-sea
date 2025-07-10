/*
    Method Name: getLocalStorage
    Method Parameters:
        key:
            Key of the item in local storage
        valueIfNotFound:
            Value to return if the item cannot be found
    Method Description: Finds a value from storage, returns valueIfNotFound if not found.
    Method Return: void
*/
function getLocalStorage(key, valueIfNotFound=null){
    // In node js, you can't access this storage
    if (typeof window === "undefined"){ return valueIfNotFound; }
    let value = localStorage.getItem(key);
    if (value == null){
        return valueIfNotFound;
    }
    return value;
}

/*
    Method Name: setLocalStorage
    Method Parameters:
        key:
            Key of the item in local storage
        value:
            Value to put in local storage
    Method Description: Assignes a key to a value in local storage. Errors are not *really* handled.
    Method Return: void
*/
function setLocalStorage(key, value){
    // In node js, you can't access this storage
    if (typeof window === "undefined"){ return; }
    try {
        localStorage.setItem(key, value);
    }catch(e){}
}

/*
    Method Name: randomFloatBetween
    Method Parameters:
        lowerBound:
            Lower bound float value
        upperBound:
            Upper bound float value
    Method Description: Finds a random float between two ends
    Method Return: float
*/
function randomFloatBetween(lowerBound, upperBound){
    return Math.random() * (upperBound - lowerBound) + lowerBound;
}

/*
    Function Name: randomBoolean
    Function Parameters: None
    Function Description: Creates a random boolean
    Function Return: boolean
*/
function randomBoolean(){
    return Math.random() < 0.5;
}

/*
    Function Name: loadLocalImage
    Function Parameters: 
        url:
            URL to the image
    Function Description: Loads a local image
    Function Return: Promise (implicit)
*/
async function loadLocalImage(url){
    let newImage = null;
    let wait = new Promise(function(resolve, reject){
        newImage = new Image();
        newImage.onload = function(){
            resolve();
        }
        newImage.onerror = function(error){
            console.error("Error loading image at url:", url, "error:", error);
            reject();
        }
        newImage.src = url;
    });
    await wait;
    return newImage;
}

/*
    Function Name: objectHasKey
    Function Parameters: 
        obj:
            A json object
        key:
            The key to look for
    Function Description: Checks if a JSON object contains a key
    Function Return: boolean
*/
function objectHasKey(obj, key){
    for (let foundKey of Object.keys(obj)){
        if (foundKey == key){ return true; }
    }
    return false;
}

/*
    Method Name: XYToSeed
    Method Parameters: 
        x:
            An x coordinate
        y:
            A y coordinate
    Method Description: Takes an x and y coordinate and converts them to a more-or-less unique seed
    Method Return: int
*/
function XYToSeed(x, y){
    let sqrtExtreme = Math.floor(Math.sqrt(Number.MAX_SAFE_INTEGER));
    let halfSquareRootExtreme = Math.floor(sqrtExtreme/2);
    let modifiedX = x;
    while (Math.abs(modifiedX) < halfSquareRootExtreme){
        modifiedX = -1 * (halfSquareRootExtreme - modifiedX);
    }
    let modifiedY = y;
    while (Math.abs(modifiedY) < halfSquareRootExtreme){
        modifiedY = -1 * (halfSquareRootExtreme - modifiedY);
    }
    let seed = halfSquareRootExtreme * modifiedY + modifiedX;
    return seed;
}

/*
    Method Name: sleep
    Method Parameters:
        ms:
            A number of ms to sleep for
    Method Description: Sleeps for a given amount of time
    Method Return: Promise
*/
async function sleep(ms){
    return new Promise((resolve, reject) => { setTimeout(resolve, ms); })
}