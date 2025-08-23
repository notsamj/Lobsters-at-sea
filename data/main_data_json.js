const MD = {
    "game_properties": {
        "tick_rate": 40, // ticks per secnd
        "ms_between_ticks_floor": 0, // calculated
        "ms_between_ticks_ceil": 0, // calculated
        "ms_between_ticks": 0, // calculated
        "approximate_zoom_peek_time_ms": 500, // ms
        "expected_canvas_width": 1920,
        "expected_canvas_height": 927,
        "cursor_enabled": true,
        "frame_rate": 80,
        "ship_movement_resistance_coefficient": 0.00000525,
        "cannon_ball_air_resistance_coefficient": 0.00001525
    },

    "remote_data_settings": {
        "max_delay_ms": 1000, // server can be X ms slow before breaking
        "max_delay_ticks": undefined // calculated
    },

    "default_folder_settings": {
        "default_folders": [
            {   
                "folder_name": "tick_data", 
                "max_size": undefined, // calculated
            },
            {   
                "folder_name": "position_data", 
                "max_size": undefined, // calculated
            }
        ]
    },

    "camera_settings": {
        "left_right_cooldown_ms": 250,
        "move_speed_px_sec": 500
    },

    "wind_settings": {
        "wind_initial_magnitude": 20,
        "wind_magnitude_change_amount_per_second": 8,
        "wind_direction_change_amount_per_second_deg": 40 
    },

    "sound_data": {
        "sounds": [
        ],
        "url": "./sounds",
        "file_type": ".mp3",
        "last_played_delay_ms": 100, // Extra time to wait before preparing to pause a sound
        "extra_display_time_ms": 1000, // Min time to display a sound
        "active_sound_display": {
            "enabled": false, // off by default,
            "num_slots": 2, // Will show information for $num_slots sounds and an indicator if more sounds are active
            "slot_x_size": 100,
            "slot_y_size": 30,
            "background_colour": "#000000",
            "text_colour": "#ffffff"
        }
    },

    "loading_screen_data": {
        "far_away_multiplier": 2,
        "mesh_width": 8192/8,
        "mesh_height": 8192/8,
        "tile_width": 512,
        "tile_height": 512,
        "min_x_velocity": 1,
        "min_y_velocity": 1,
        "max_x_velocity": 2,
        "max_y_velocity": 2,
        "origin_x_range_size": 2500,
        "origin_y_range_size": 2500
    },

    "las_sea_data": {
        "far_away_multiplier": 2,
        "mesh_width": 8192/8,
        "mesh_height": 8192/8,
        "tile_width": 512,
        "tile_height": 512
    },

    "default_key_binds": {
        "scroll_left_ticked": 37, // left arrow
        "scroll_right_ticked": 39, // right arrow
        "left_click_ticked": 1, // left click
        "help_access_ticked": 72, // h
        "escape_ticked": 27, // esc
        "zoom_1/8": 101, // num 5
        "zoom_1/4": 100, // num 4
        "zoom_1/2": 99, // num 3
        "zoom_1": 98, // num 2
        "zoom_2": 97, // num 1
        "fire_cannons": 1, // left click
        "aiming_cannon": 3, // right click
        "sails_inc": 82, // R
        "sails_dec": 70, // F
        "ship_left": 65, // A
        "ship_right": 68, // D
        "camera_move_left": 37, // left arrow
        "camera_move_right": 39, // right arrow
        "camera_move_up": 38, // up arrow
        "camera_move_down": 40, // down arrow
        "camera_snap_follow_toggle": 70, // F
        "message_feed_up": 33, // pgup
        "message_feed_down": 34 // pgdown
    },

    "hud": {
        "text_size": 20,
        "key_colour": "#ff6700",
        "value_colour": "#9966ff",
        "extra_time_ms": 1000,
        "display_x_offset": 10,
        "priorities": {
            "fps": 1
        }
    },

    "cannon_settings": {
        "reload_ms": 1000, // 1s for now
        "shot_speed": 500,
        "reload_ticks": null // calculated
    },

    "cannon_ball_settings": {
        "image_width": 32,
        "image_height": 32,
        "cannon_ball_height": 8,
        "cannon_ball_width": 8,
        "ticks_until_hit_water": null, // calculated
        "ms_until_hit_water": 1500
    },

    "visual_effect_settings": {
        "cannon_ball_hit": {
            "life_length_ms": 2000,
            "life_length_ticks": undefined, // calculated
            "color_code": "#e8b164",
            "min_debris": 2,
            "max_debris": 5,
            "start_offset": 10,
            "min_velocity": 5,
            "max_velocity": 10,
            "min_size": 2,
            "max_size": 5
        },
        "cannon_smoke": {
            "life_length_ms": 3000,
            "life_length_ticks": undefined, // calculated
            "color_code": "#ccc6c6",
            "min_smoke_bubbles": 3,
            "max_smoke_bubbles": 7,
            "start_offset": 5,
            "wind_coefficient": 2.51102525,
            "offset_min_velocity": 1,
            "offset_max_velocity": 2,
            "min_size": 4,
            "max_size": 8
        },
        "cannon_ball_splash": {
            "life_length_ms": 1500,
            "life_length_ticks": undefined, // calculated
            "color_code": "#363b75",
            "min_water_splashes": 5,
            "max_water_splashes": 10,
            "start_offset": 4,
            "min_velocity": 5,
            "max_velocity": 8,
            "min_size": 2,
            "max_size": 4
        },
        "ship_splash": {
            "life_length_ms": 4000,
            "life_length_ticks": undefined, // calculated
            "color_code": "#020954",
            "min_water_splashes": 10,
            "max_water_splashes": 20,
            "start_offset": 50,
            "min_velocity": 15,
            "max_velocity": 30,
            "min_size": 20,
            "max_size": 30
        }
    }
}

// Perform data calculations
MD["game_properties"]["ms_between_ticks"] = 1000 / MD["game_properties"]["tick_rate"];
MD["game_properties"]["ms_between_ticks_floor"] = Math.floor(MD["game_properties"]["ms_between_ticks"]);
MD["game_properties"]["ms_between_ticks_ceil"] = Math.ceil(MD["game_properties"]["ms_between_ticks"]);
MD["cannon_settings"]["reload_ticks"] = MD["cannon_settings"]["reload_ms"] / 1000 * MD["game_properties"]["tick_rate"];
MD["cannon_ball_settings"]["ticks_until_hit_water"] = MD["cannon_ball_settings"]["ms_until_hit_water"] / 1000 * MD["game_properties"]["tick_rate"];

MD["remote_data_settings"]["max_delay_ticks"] = Math.ceil(MD["remote_data_settings"]["max_delay_ms"] / MD["game_properties"]["ms_between_ticks"]);

MD["visual_effect_settings"]["cannon_ball_hit"]["life_length_ticks"] = MD["visual_effect_settings"]["cannon_ball_hit"]["life_length_ms"] / 1000 * MD["game_properties"]["tick_rate"];
MD["visual_effect_settings"]["cannon_smoke"]["life_length_ticks"] = MD["visual_effect_settings"]["cannon_smoke"]["life_length_ms"] / 1000 * MD["game_properties"]["tick_rate"];
MD["visual_effect_settings"]["cannon_ball_splash"]["life_length_ticks"] = MD["visual_effect_settings"]["cannon_ball_splash"]["life_length_ms"] / 1000 * MD["game_properties"]["tick_rate"];
MD["visual_effect_settings"]["ship_splash"]["life_length_ticks"] = MD["visual_effect_settings"]["ship_splash"]["life_length_ms"] / 1000 * MD["game_properties"]["tick_rate"];

// Set tick data storage size
MD["default_folder_settings"]["default_folders"][0]["max_size"] = MD["remote_data_settings"]["max_delay_ticks"];
// Set position launch data storage size
MD["default_folder_settings"]["default_folders"][1]["max_size"] = MD["remote_data_settings"]["max_delay_ticks"];

// If NodeJS -> Exports
if (typeof window === "undefined"){
    module.exports = { MD }
}