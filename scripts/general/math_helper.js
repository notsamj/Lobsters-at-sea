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

/*
    Method Name: displacementToRadians
    Method Parameters:
        dX:
            The displacement in x
        dY:
            The displacement in y
    Method Description: Converts displacement in x, y to an angle in radians
    Method Return: float
*/
function displacementToRadians(dX, dY){
    // Handle incredibly small displacements
    if (Math.abs(dY) < 1){
        return (dX >= 0) ? toRadians(0) : toRadians(180);
    }else if (Math.abs(dX) < 1){
        return (dY >= 0) ? toRadians(90) : toRadians(270);
    }

    // Convert angle to positive positive
    let angleRAD = Math.atan(Math.abs(dY) / Math.abs(dX));

    // If -,- (x,y)
    if (dX < 0 && dY < 0){
        angleRAD = Math.PI + angleRAD;
    // If -,+ (x,y)
    }else if (dX < 0 && dY > 0){
        angleRAD = Math.PI - angleRAD;
    // If +,- (x,y)
    }else if (dX > 0 && dY < 0){
        angleRAD = 2 * Math.PI - angleRAD;
    }
    // +,+ Needs no modification
    return angleRAD;
}

function rectangleCollidesWithRectangle(lXr1, rXr1, tYr1, bYr1, lXr2, rXr2, tYr2, bYr2){
    let cXr1 = (lXr1 + rXr1)/2;
    let cXr2 = (lXr2 + rXr2)/2;
    let cYr1 = (bYr1 + tYr1)/2;
    let cYr2 = (bYr2 + tYr2)/2;

    // If rectangle1's top left corner is within rectangle2
    if (pointInRectangle(lXr1, tYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle1's bottom left corner is within rectangle2
    if (pointInRectangle(lXr1, bYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle1's top right corner is within rectangle2
    if (pointInRectangle(rXr1, tYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle1's bottom right corner is within rectangle2
    if (pointInRectangle(rXr1, bYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle1's center is within rectangle2
    if (pointInRectangle(cXr1, cYr1, lXr2, rXr2, tYr2, bYr2)){
        return true;
    }

    // If rectangle2's center is within rectangle1
    if (pointInRectangle(cXr2, cYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // If rectangle2's top left corner is within rectangle1
    if (pointInRectangle(lXr2, tYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // If rectangle2's bottom left corner is within rectangle1
    if (pointInRectangle(lXr2, bYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // If rectangle2's top right corner is within rectangle1
    if (pointInRectangle(rXr2, tYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // If rectangle2's bottom right corner is within rectangle21
    if (pointInRectangle(rXr2, bYr2, lXr1, rXr1, tYr1, bYr1)){
        return true;
    }

    // Else not overlapping
    return false;
}

/*
    Method Name: pointInRectangle
    Method Parameters:
        x:
            x value of a point
        y:
            y value of a point
        lX:
            lX value of a rectangle
        rX:
            rX value of a rectangle
        tY:
            tY value of a rectangle
        bY:
            bY value of a rectangle

    Method Description: Determine if a point is inside a rectangle
    Method Return: Boolean, true -> point is inside, false -> not inside
*/
function pointInRectangle(x, y, lX, rX, tY, bY){
    if (x > lX && x < rX && y < tY && y > bY){ return true; }
    if (x == lX && x < rX && y < tY && y > bY){ return true; }
    if (x > lX && x == rX && y < tY && y > bY){ return true; }
    if (x > lX && x < rX && y == tY && y > bY){ return true; }
    if (x > lX && x < rX && y < tY && y == bY){ return true; }
    return false;
}

/*
    Method Name: safeDivide
    Method Parameters:
        numerator:
            The numerator of a division
        denominator:
            The denominator of a division 
        closeToZeroAmount:
            Amount between [0,INF], if denominator < closeToZeroAmount then return valueIfCloseToZero
        valueIfCloseToZero:
            Value to return if the denominator is close to zero
    Method Description: Divides two numbers, returning a special result if the denominator is close to zero
    Method Return: float (or special value)
*/
function safeDivide(numerator, denominator, closeToZeroAmount, valueIfCloseToZero){
    if (Math.abs(denominator) < closeToZeroAmount){ return valueIfCloseToZero; }
    return numerator / denominator;
}

/*function getIntervalOverlapDetails(h1, b1, h2, b2){
    // Check if interval 1 has points within interval 2
    if (h1 >= b2 && h1 <= h2){
        return true;
    }
    if (b1 >= b2 && b1 <= h2){
        return true;
    }

    // Check if interval 1 has points within interval 2
    if (h2 >= b1 && h2 <= h1){
        return true;
    }
    if (b2 >= b1 && b2 <= h1){
        return true;
    }

    // No overlap
    return {"overlap": false};
}*/

function getIntervalOverlapDetails(h1, b1, h2, b2){
    // If 1 inside 2
    if (h1 >= b2 && h1 <= h2 && b1 >= b2 && b1 <= h2){
        return {"overlap": true, "overlap_center": (h1+b1)/2}
    }

    // If 2 inside 1
    if (h1 >= b1 && h2 <= h1 && b2 >= b1 && b2 <= h1){
        return {"overlap": true, "overlap_center": (h2+b2)/2}
    }

    // Partial overlap
    if (h1 >= b2 && h1 <= h2){
        return {"overlap": true, "overlap_center": (h1+b2)/2}
    }else if (h2 >= b1 && h2 <= h1){
        return {"overlap": true, "overlap_center": (h2+b1)/2}
    }

    // No overlap
    return {"overlap": false};
}

/*
    Method Name: calculateAngleDiffCWRAD
    Method Parameters:
        angle1:
            An angle in radians
        angle2:
            An angle in radians
    Method Description: Calculate the distance in radians from angle1 to angle2
    Method Return: Float
*/
function calculateAngleDiffCWRAD(angle1, angle2){
    if (angle2 > angle1){
        angle2 -= 2 * Math.PI;
    }
    let difference = (angle2 - angle1) / -1;
    return difference;
}

/*
    Method Name: calculateAngleDiffCCWRAD
    Method Parameters:
        angle1:
            An angle in radians
        angle2:
            An angle in radians
    Method Description: Calculate the distance in radians from angle1 to angle2
    Method Return: Float
*/
function calculateAngleDiffCCWRAD(angle1, angle2){
    if (angle2 < angle1){
        angle2 += 2 * Math.PI;
    }
    let difference = angle2 - angle1;
    return difference;
}

// If NodeJS -> Export
if (typeof window === "undefined"){
    module.exports = {
        angleBetweenCWRAD,
        calculateAngleDiffCWRAD,
        calculateAngleDiffCCWRAD,
        calculateEuclideanDistance,
        displacementToRadians,
        fixRadians,
        getIntervalOverlapDetails,
        rectangleCollidesWithRectangle,
        rotateCWRAD,
        rotateCCWRAD,
        safeDivide,
        toRadians
    }
}