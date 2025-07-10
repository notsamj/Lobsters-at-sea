/*
    Class Name: SeededRandomizer
    Description: A random number generator that generates based on a seed.
*/
class SeededRandomizer {
    static MAXIMUM_FOR_A_BIG_NUMBER = 1e13;
    static SPICE_1 = 20499874;
    static SPICE_2 = 198245;
    static SPICE_3 = 2017561;
    static FLOAT_LENGTH = 7;

    /*
        Method Name: constructor
        Method Parameters:
            seed:
                The seed to base generation on
        Method Description: Constructor
        Method Return: Constructor
    */
    constructor(seed){
        this.seed = seed;
        this.lastNumber = seed;
    }

    /*
        Method Name: getLastNumber
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getLastNumber(){
        return this.lastNumber;
    }

    /*
        Method Name: reset
        Method Parameters: None
        Method Description: Resets to the initial value
        Method Return: int
    */
    reset(){
        this.lastNumber = this.seed;
    }

    /*
        Method Name: getBigNumber
        Method Parameters: None
        Method Description: This method generates a big random number and updates the "seed"
        Method Return: int (long?)
        Note:
        I was aware of this method: seed = (seed * constant1 + constant2) % constant3, randomFloat = seed / constant3 from a function
        used in an example in one of my classes back in University. I did not come up with this formula for generating "random" numbers. I imagine
        it can be found somewhere online but I wanted to make my generation method as unique as I could while still making it manageable so didn't do
        any research other than consulting my memory. I did come up with the three constants by randomly typing numbers and testing the distribution.
    */
    getBigNumber(){
        // Go to the next number
        this.lastNumber = (this.lastNumber * SeededRandomizer.SPICE_1 + SeededRandomizer.SPICE_2) % SeededRandomizer.SPICE_3;
        return Math.abs(Math.floor(this.lastNumber / SeededRandomizer.SPICE_3 * SeededRandomizer.MAXIMUM_FOR_A_BIG_NUMBER));
    }

    /*
        Method Name: getIntInRangeInclusive
        Method Parameters:
            start:
                The first number in the range
            end:
                The last number in the range
        Method Description: Generates a random integer in a range (inclusive)
        Method Return: Integer
    */
    getIntInRangeInclusive(start, end){
        let value = this.getBigNumber() % (end - start + 1) + start;
        return value;
    }

    /*
        Method Name: getIntInRangeExclusive
        Method Parameters:
            start:
                The first number in the range
            end:
                The last number in the range
        Method Description: Generates a random integer in a range (last number is excluded)
        Method Return: Integer
    */
    getIntInRangeExclusive(start, end){
        return this.getIntInRangeInclusive(start, end-1);
    }

    /*
        Method Name: getRandomFloat
        Method Parameters: None
        Method Description: Generates a random float
        Method Return: float
    */
    getRandomFloat(){
        let str = "0.";
        for (let i = 0; i < SeededRandomizer.FLOAT_LENGTH; i++){
            str += this.getIntInRangeInclusive(0,9).toString();
        }
        return parseFloat(str);
    }

    /*
        Method Name: getFloatInRange
        Method Parameters:
            start:
                The first number in the range
            end:
                The last number in the range
        Method Description: Generates a float integer in a range
        Method Return: Integer
    */
    getFloatInRange(start, end){
        return this.getRandomFloat() * (end-start) + start;
    }

    /*
        Method Name: getBoolean
        Method Parameters: None
        Method Description: Generates a random boolean
        Method Return: boolean
    */
    getBoolean(){
        return this.getIntInRangeInclusive(0, 1) === 0;
    }
}

// If using Node JS Export the class
if (typeof window === "undefined"){
    module.exports = SeededRandomizer;
}
