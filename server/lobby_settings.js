module.exports = {
    // Note: numBots + numPlayers <= 8 (number of colors)
    "expected_players_data": {
        "player_role": 1, // 0 -> spectator, 1 -> participant
        "player_count": 1 // >= 1
    },
    "bot_data": {
        "bot_count": 1,
        "bot_model_name": "The Krill"
    },
    "gamemode_data": {
        "spread": 3000 // participants spread an average of X pixels apart
    }
}