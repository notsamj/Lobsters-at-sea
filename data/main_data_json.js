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
        "air_resistance_coefficient": 0.00000125
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
        "scroll_left": 37, // left arrow
        "scroll_right": 39, // right arrow
        "left_click_ticked": 1, // left click
        "help_access_ticked": 72, // h
        "escape_ticked": 27, // esc
        "zoom_1/8": 101, // num 5
        "zoom_1/4": 100, // num 4
        "zoom_1/2": 99, // num 3
        "zoom_1": 98, // num 2
        "zoom_2": 97, // num 1
        "sails_inc": 82, // R
        "sails_dec": 70, // F
        "ship_left": 65, // A
        "ship_right": 68 // D
    },

    "hud": {
        "text_size": 20,
        "key_colour": "#ff6700",
        "value_colour": "#0066ff",
        "extra_time_ms": 1000,
        "display_x_offset": 10,
        "priorities": {
            "fps": 1
        }
    },
}

// Perform data calculations
MD["game_properties"]["ms_between_ticks"] = 1000 / MD["game_properties"]["tick_rate"];
MD["game_properties"]["ms_between_ticks_floor"] = Math.floor(MD["game_properties"]["ms_between_ticks"]);
MD["game_properties"]["ms_between_ticks_ceil"] = Math.ceil(MD["game_properties"]["ms_between_ticks"]);