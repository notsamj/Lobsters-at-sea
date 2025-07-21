const SD = {
    "generic_ship": {
        "ship_width": 128,
        "ship_height": 128,
        "image_width": 512,
        "image_height": 512,
        "size_metric": 1000, // used for ship movement resistance calculations. No unit
        "turning_radius_degrees": 90, // degrees per thousand pixels moved
        "will_power_acceleration": 12, // how much acceleration the ship can muster in it's desired direction in pixels/second
        "cannons": [
            // Front cannon
            {
                "x": 250,
                "y": 107,
                "range_cw": [135, 45]
            }
        ]
        /*"cannons": [
            // right side
            {
                "x": 283,
                "y": 141,
                "range_cw": [45, 315]
            },
            {
                "x": 292,
                "y": 180,
                "range_cw": [45, 315]
            },
            {
                "x": 297,
                "y": 206,
                "range_cw": [45, 315]
            },
            {
                "x": 304,
                "y": 238,
                "range_cw": [45, 315]
            },
            {
                "x": 305,
                "y": 267,
                "range_cw": [45, 315]
            },
            {
                "x": 304,
                "y": 292,
                "range_cw": [45, 315]
            },
            {
                "x": 307,
                "y": 314,
                "range_cw": [45, 315]
            },
            {
                "x": 306,
                "y": 314,
                "range_cw": [45, 315]
            },
            // left side
            {
                "x": 221,
                "y": 138,
                "range_cw": [225, 135]
            },
            {
                "x": 214,
                "y": 181,
                "range_cw": [225, 135]
            },
            {
                "x": 212,
                "y": 205,
                "range_cw": [225, 135]
            },
            {
                "x": 207,
                "y": 235,
                "range_cw": [225, 135]
            },
            {
                "x": 200,
                "y": 265,
                "range_cw": [225, 135]
            },
            {
                "x": 197,
                "y": 293,
                "range_cw": [225, 135]
            },
            {
                "x": 195,
                "y": 316,
                "range_cw": [225, 135]
            },
            {
                "x": 202,
                "y": 350,
                "range_cw": [225, 135]
            },
            // front
            {
                "x": 250,
                "y": 107,
                "range_cw": [135, 45]
            },
            // back
            {
                "x": 229,
                "y": 398,
                "range_cw": [315, 225]
            },
            {
                "x": 282,
                "y": 399,
                "range_cw": [315, 225]
            }
        ]*/
    }
}