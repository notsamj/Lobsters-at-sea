/*
    Function Name: getLocalStorage
    Function Parameters:
        key:
            Key of the item in local storage
        valueIfNotFound:
            Value to return if the item cannot be found
    Function Description: Finds a value from storage, returns valueIfNotFound if not found.
    Function Return: void
*/
function getLocalStorage(key, valueIfNotFound=null){
    // In node js, you can't access this storage
    if (typeof window === "undefined"){ return valueIfNotFound; }
    let value = localStorage.getItem(key);
    if (value === null || value === "undefined"){
        return valueIfNotFound;
    }
    return value;
}

/*
    Function Name: getIndexOfElementInArray
    Function Parameters: 
        array:
            An Array
        value:
            A value to search for
    Function Description: Finds the index of an element in an array
    Function Return: int
*/
function getIndexOfElementInArray(array, value){
    for (let i = 0; i < array.length; i++){
        if (array[i] === value){
            return i;
        }
    }
    return -1;
}

/*
    Function Name: setLocalStorage
    Function Parameters:
        key:
            Key of the item in local storage
        value:
            Value to put in local storage
    Function Description: Assignes a key to a value in local storage. Errors are not *really* handled.
    Function Return: void
*/
function setLocalStorage(key, value){
    // In node js, you can't access this storage
    if (typeof window === "undefined"){ return; }
    try {
        localStorage.setItem(key, value);
    }catch(e){}
}

/*
    Function Name: randomFloatBetween
    Function Parameters:
        lowerBound:
            Lower bound float value
        upperBound:
            Upper bound float value
    Function Description: Finds a random float between two ends
    Function Return: float
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
    Function Name: randomNumberInclusive
    Function Parameters:
        min:
            Minimum value (inclusive)
        maxInclusive:
            Maximum value (inclusive)
    Function Description: Come up with a number in a given range [min, maxInclusive]
    Function Return: int
*/
function randomNumberInclusive(min, maxInclusive){
    return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
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
    Function Name: XYToSeed
    Function Parameters: 
        x:
            An x coordinate
        y:
            A y coordinate
    Function Description: Takes an x and y coordinate and converts them to a more-or-less unique seed
    Function Return: int
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
    Function Name: sleep
    Function Parameters:
        ms:
            A number of ms to sleep for
    Function Description: Sleeps for a given amount of time
    Function Return: Promise
*/
async function sleep(ms){
    return new Promise((resolve, reject) => { setTimeout(resolve, ms); })
}

/*
    Function Name: copyObject
    Function Parameters:
        obj:
            Object to copy
    Function Description: Creates a copy of an object (to some extent)
    Function Return: JSON Object
    Note: If you give it and instance of a class it will produce a reference not a copy
*/
function copyObject(obj){
    // Deep copy, copy inner objects aswell
    let newObject = {};
    for (let key of Object.keys(obj)){
        if (obj[key] === null){
            newObject[key] = null;
        }else if (Array.isArray(obj[key])){
            newObject[key] = copyArray(obj[key]);
        }else if (isJSON(obj[key])){
            newObject[key] = copyObject(obj[key]);
        }else{
            newObject[key] = obj[key];
        }
    }
    return newObject;
}

/*
    Function Name: copyOverObject
    Function Parameters:
        sourceObj:
            Source JSON
        destinationObject:
            Destination JSON
    Function Description: Copies info from one JSON to another (shallow)
    Function Return: void
*/
function copyOverObject(sourceObj, destinationObject){
    for (let key of Object.keys(sourceObj)){
        destinationObject[key] = sourceObj[key];
    }
}


/*
    Function Name: copyArray
    Function Parameters:
        array:
            An array to copy
        limit:
            Index limit for copying
    Function Description: Creates a copy of an array
    Function Return: void
*/
function copyArray(array, limit=array.length){
    let newArray = [];
    for (let i = 0; i < Math.min(array.length, limit); i++){
        if (array[i] === null){
            newArray.push(null);
        }else if (Array.isArray(array[i])){
            newArray.push(copyArray(array[i]));
        }else if (isJSON(array[i])){
            newArray.push(copyObject(array[i]));
        }else{
            newArray.push(array[i]);
        }
    }
    return newArray;
}

/*
    Function Name: isJSON
    Function Parameters: 
        e:
            A value
    Function Description: Checks if a value is JSON or not
    Function Return: boolean
*/
function isJSON(e){
    return e != null && e.constructor === ({}).constructor;
}

/*
    Function Name: getPrettyTime
    Function Parameters: None
    Function Description: Gets the time in a readable format
    Function Return: String
*/
function getPrettyTime(){
    return new Date().toLocaleTimeString("en-US");
}

// If using NodeJS then do an export
if (typeof window === "undefined"){
    module.exports = {
        copyArray,
        copyObject,
        objectHasKey,
        randomFloatBetween,
        randomNumberInclusive
    }
}