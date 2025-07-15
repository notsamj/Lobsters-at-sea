/*
    Method Name: toRadians
    Method Parameters:
        degrees:
            The number of degrees to convert to radians
    Method Description: Converts degrees to radians
    Method Return: float
*/
function toRadians(degrees){
    return degrees * Math.PI / 180;
}

/*
    Method Name: toDegrees
    Method Parameters:
        radians:
            An amount of radians to convert to degrees
    Method Description: Converts an amount of radians to degrees
    Method Return: int
*/
function toDegrees(radians){
    return radians / (2 * Math.PI) * 360;
}

/*
    Method Name: angleBetweenCWRAD
    Method Parameters:
        angle:
            An angle in radians
        eAngle1:
            An angle on one edge of a range (radians)
        eAngle2:
            An angle on the other edge of a range (radians)
    Method Description: Determines if angle is between eAngle1 and eAngle2 in the clockwise direction
    Method Return: boolean, true -> angle is between, false -> angle is not between
*/
function angleBetweenCWRAD(angle, eAngle1, eAngle2){
    if (angle > eAngle1){
        angle -= 2 * Math.PI;
    }
    if (eAngle2 > eAngle1){
        eAngle2 -= 2 * Math.PI;
    }
    let distanceFromEAngle1ToAngleCW = (angle - eAngle1) / -1;
    let distanceFromEAngle1ToEAngle2CW = (eAngle2 - eAngle1) / -1;
    return distanceFromEAngle1ToAngleCW <= distanceFromEAngle1ToEAngle2CW;
}

/*
    Method Name: angleBetweenCCWRAD
    Method Parameters:
        angle:
            An angle in radians
        eAngle1:
            An angle on one edge of a range (radians)
        eAngle2:
            An angle on the other edge of a range (radians)
    Method Description: Determines if angle is between eAngle1 and eAngle2 in the counter clockwise direction
    Method Return: boolean, true -> angle is between, false -> angle is not between
*/
function angleBetweenCCWRAD(angle, eAngle1, eAngle2){
    if (angle < eAngle1){
        angle += 2 * Math.PI;
    }
    if (eAngle2 < eAngle1){
        eAngle2 += 2 * Math.PI;
    }
    let distanceFromEAngle1ToAngleCCW = angle - eAngle1;
    let distanceFromEAngle1ToEAngle2CCW = eAngle2 - eAngle1;
    return distanceFromEAngle1ToAngleCCW <= distanceFromEAngle1ToEAngle2CCW;
}

/*
    Method Name: rotateCWRAD
    Method Parameters:
        angle:
            Angle to rotate
        amount:
            Amount to rotate by
    Method Description: Rotates an angle clockwise by an amount
    Method Return: float
*/
function rotateCWRAD(angle, amount){
    return fixRadians(angle - amount);
}
/*
    Method Name: rotateCCWRAD
    Method Parameters:
        angle:
            Angle to rotate
        amount:
            Amount to rotate by
    Method Description: Rotates an angle counter clockwise by an amount
    Method Return: float
*/
function rotateCCWRAD(angle, amount){
    return fixRadians(angle + amount);
}

/*
    Method Name: fixRadians
    Method Parameters:
        angle:
            An angle to "fix"
    Method Description: Fixes an angle to the range [0,2*PI)
    Method Return: float
*/
function fixRadians(angle){
    while (angle < 0){
        angle += 2 * Math.PI;
    }
    while (angle >= 2 * Math.PI){
        angle -= 2 * Math.PI;
    }
    return angle;
}

/*
    Function Name: calculateEuclideanDistance
    Function Parameters: 
        x1:
            x coordinate
        y1:
            y coordinate
        x2:
            x coordinate
        y2:
            y coordinate
    Function Description: Calculates the euclidean distance
    Function Return: float
*/
function calculateEuclideanDistance(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
}