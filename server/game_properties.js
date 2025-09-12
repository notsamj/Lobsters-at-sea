const MD = require("../data/main_data_json.js").MD;
const SD = require("../data/ship_data_json.js").SD;
const randomNumberInclusive = require("../scripts/general/helper_functions.js").randomNumberInclusive;

let gameRecordingSettings = {
    "crosshair_display_around_shooting_ms": 500,
    "crosshair_display_around_shooting_ticks": undefined // calculated
}

// Calculate
gameRecordingSettings["crosshair_display_around_shooting_ticks"] = gameRecordingSettings["crosshair_display_around_shooting_ms"] / 1000 * MD["game_properties"]["tick_rate"];

module.exports = {
    "tick_rate": MD["game_properties"]["tick_rate"],
    "ms_between_ticks": MD["game_properties"]["ms_between_ticks"],
    "approximate_zoom_peek_time_ms": MD["game_properties"]["approximate_zoom_peek_time_ms"],
    "game_zoom": 1, // default
    "ms_between_ticks_floor": MD["game_properties"]["ms_between_ticks_floor"],
    "sound_data": MD["sound_data"],
    "loading_screen_data": MD["loading_screen_data"],
    "frame_rate": MD["game_properties"]["frame_rate"],
    "hud_json": MD["hud"],
    "tick_proportion_of_a_second": MD["game_properties"]["ms_between_ticks"] / 1000,
    "ship_data": SD,
    "wind_settings": MD["wind_settings"],
    "random_seed": randomNumberInclusive(1, 100000),
    "camera_settings": MD["camera_settings"],
    "cannon_settings": MD["cannon_settings"],
    "cannon_ball_settings": MD["cannon_ball_settings"],
    "max_delay_ms": MD["remote_data_settings"]["max_delay_ms"],
    "cannon_ball_wind_effect_coefficient": MD["game_properties"]["cannon_ball_wind_effect_coefficient"],
    "visual_effect_settings": MD["visual_effect_settings"], // Needed because this is received by the client
    "will_reduction_on_account_of_sail_strength_exponent": MD["game_properties"]["will_reduction_on_account_of_sail_strength_exponent"],
    "ship_air_affectedness_coefficient": MD["game_properties"]["ship_air_affectedness_coefficient"],
    "winning_screen_settings": MD["winning_screen_settings"],
    "ship_colours": MD["ship_colours"],
    "bot_settings": MD["bot_settings"],
    "game_recorder_settings": gameRecordingSettings,
    "saved_models": MD["saved_models"],
    "default_folder_settings": {
        "default_folders": [
            {   
                "folder_name": "pending_decisions", 
                "max_size": 1,
            },
            {   
                "folder_name": "desire_to_play_battle", 
                "max_size": 1,
            },
            {   
                "folder_name": "get_replay_list", 
                "max_size": 1,
            },
            {   
                "folder_name": "get_replay_data", 
                "max_size": 1,
            },
        ]
    }
}