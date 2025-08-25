const MD = require("../data/main_data_json.js").MD;
const SD = require("../data/ship_data_json.js").SD;

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
    "random_seed": 5,
    "camera_settings": MD["camera_settings"],
    "cannon_settings": MD["cannon_settings"],
    "cannon_ball_settings": MD["cannon_ball_settings"],
    "max_delay_ms": MD["remote_data_settings"]["max_delay_ms"],
    "cannon_ball_air_resistance_coefficient": MD["game_properties"]["cannon_ball_air_resistance_coefficient"],
    "visual_effect_settings": MD["visual_effect_settings"], // Needed because this is received by the client
    "will_reduction_on_account_of_sail_strength_multiplier": MD["game_properties"]["will_reduction_on_account_of_sail_strength_multiplier"],
    "ship_air_resistance_coefficient": MD["game_properties"]["ship_air_resistance_coefficient"]
    "default_folder_settings": {
        "default_folders": [
            {   
                "folder_name": "pending_decisions", 
                "max_size": 100,
            }
        ]
    }
}