const SD = {
    "generic_ship": {
        "ship_width": 128,
        "ship_height": 128,
        "image_width": 512,
        "image_height": 512,
        "turning_radius_degrees": 120, // degrees per thousand pixels moved
        "max_self_propulsion_speed": 160, // max speed the ship can muster in it's desired direction in pixels/second (not counting wind)
        /*"cannons": [
            // right side
            {
                "x": 283,
                "y": 141,
                "range_cw": [55, 305]
            }
        ]*/
        "cannons": [
            // Front cannon
            {
                "x": 248,
                "y": 107,
                "range_cw": [135, 45]
            },
            // Front cannon
            {
                "x": 250,
                "y": 107,
                "range_cw": [135, 45]
            },
            // Front cannon
            {
                "x": 252,
                "y": 107,
                "range_cw": [135, 45]
            },
            // right side
            {
                "x": 283,
                "y": 141,
                "range_cw": [55, 305]
            },
            {
                "x": 292,
                "y": 180,
                "range_cw": [55, 305]
            },
            {
                "x": 297,
                "y": 206,
                "range_cw": [55, 305]
            },
            {
                "x": 304,
                "y": 238,
                "range_cw": [55, 305]
            },
            {
                "x": 305,
                "y": 267,
                "range_cw": [55, 305]
            },
            {
                "x": 304,
                "y": 292,
                "range_cw": [55, 305]
            },
            {
                "x": 307,
                "y": 314,
                "range_cw": [55, 305]
            },
            {
                "x": 306,
                "y": 314,
                "range_cw": [55, 305]
            },
            // left side
            {
                "x": 221,
                "y": 138,
                "range_cw": [235, 125]
            },
            {
                "x": 214,
                "y": 181,
                "range_cw": [235, 125]
            },
            {
                "x": 212,
                "y": 205,
                "range_cw": [235, 125]
            },
            {
                "x": 207,
                "y": 235,
                "range_cw": [235, 125]
            },
            {
                "x": 200,
                "y": 265,
                "range_cw": [235, 125]
            },
            {
                "x": 197,
                "y": 293,
                "range_cw": [235, 125]
            },
            {
                "x": 195,
                "y": 316,
                "range_cw": [235, 125]
            },
            {
                "x": 202,
                "y": 350,
                "range_cw": [235, 125]
            },
            // front
            {
                "x": 250,
                "y": 107,
                "range_cw": [135, 45]
            },
            /*
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
            */
        ]
    }
}

// Set up cannon indices
for (let shipName of Object.keys(SD)){
    let index = 0;
    for (let cannon of SD[shipName]["cannons"]){
        cannon["cannon_index"] = index++;
    }
}

// If NodeJS -> Exports
if (typeof window === "undefined"){
    module.exports = { SD }
}