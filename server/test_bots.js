// Custom classes
const LasTest1v1Game = require("./las/las_test_1v1_game.js").LasTest1v1Game;
const randomNumberInclusive = require("../scripts/general/helper_functions.js").randomNumberInclusive;
// Data
const GP = require("./game_properties.js");

function runTests(){
    let game = new LasTest1v1Game(GP);

    let numTests = 100;

    let bot1JSON = GP["saved_models"][1];
    let bot2JSON = GP["saved_models"][2];
    console.log("Model1", bot1JSON["model_name"])
    console.log("Model2", bot2JSON["model_name"])

    bot1JSON["ship_json"]["id"] = bot1JSON["model_name"] + "_0";
    bot2JSON["ship_json"]["id"] = bot2JSON["model_name"] + "_1";

    bot1JSON["ship_json"]["game_instance"] = game;
    bot2JSON["ship_json"]["game_instance"] = game;

    let winners = {}
    winners[bot1JSON["ship_json"]["id"]] = 0;
    winners[bot2JSON["ship_json"]["id"]] = 0;
    winners["tie"] = 0;

    let lastRecordedPercentage = 0;
    let percentageGap = 5;
    for (let i = 0; i < numTests; i++){
        let winnerID = runTest(game, bot1JSON, bot2JSON);

        let percentage = Math.floor(i/numTests * 100);
        if (percentage >= lastRecordedPercentage + percentageGap){
            lastRecordedPercentage = percentage;
            console.log(percentage.toString() + "% completed.");
        }
        winners[winnerID] += 1;
    }

    // Display winners
    console.log(winners);

    // Update to proportion
    winners[bot1JSON["ship_json"]["id"]] /= numTests;
    winners[bot2JSON["ship_json"]["id"]] /= numTests;
    winners["tie"] /= numTests;
    console.log(winners);
}

function runTest(game, bot1JSON, bot2JSON){
    game.reset();
    // Random seed
    game.getWind().resetWithNewSeed(randomNumberInclusive(1, 100000));
    game.start(bot1JSON, bot2JSON);

    let safe = 50000;
    let c = 0;

    let spread = 5000;

    // Randomize the starting details
    bot1JSON["ship_json"]["starting_x_pos"] = randomNumberInclusive(-1 * spread, spread);
    bot1JSON["ship_json"]["starting_y_pos"] = randomNumberInclusive(-1 * spread, spread);

    bot2JSON["ship_json"]["starting_x_pos"] = randomNumberInclusive(-1 * spread, spread);
    bot2JSON["ship_json"]["starting_y_pos"] = randomNumberInclusive(-1 * spread, spread);

    while (game.isRunning() && c < safe){
        game.tick();
        c++;
    }

    // If never finished
    if (game.isRunning()){
        console.log(game.getShips())
        throw new Error("Game never ended.");
    }

    return game.getWinnerID();
}

// Start up
runTests();