let gameProperties = {
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
    "ship_movement_resistance_coefficient": MD["game_properties"]["ship_movement_resistance_coefficient"],
    "ship_data": SD,
    "wind_settings": MD["wind_settings"],
    "random_seed": 5,
    "camera_settings": MD["camera_settings"],
    "cannon_settings": MD["cannon_settings"],
    "cannon_ball_settings": MD["cannon_ball_settings"],
    "cannon_ball_air_resistance_coefficient": MD["game_properties"]["cannon_ball_air_resistance_coefficient"],
    "visual_effect_settings": MD["visual_effect_settings"]
}

// Create container
const GC = new GameContainer(new LasLocalGame(gameProperties), new LasRemoteGame(gameProperties), gameProperties);
const SC = new ServerConnection(MD["default_folder_settings"]);
const DJ = {
    "count": 0,
    "stop": false
}

// Start Up
window.addEventListener("load", () => {
    registerMenus();
    GC.setup();
});

// Error handling
window.addEventListener("error", (errorEvent) => {
    stop();
})

// Helper
function launcherTickHandler(timeElapsedMS){
    GC.tick();
}

function registerMenus(){
    GC.getMenuManager().registerMenu(new MyProjectsMenu());
    GC.getMenuManager().registerMenu(new ServerConnectionMenu());
}

function stop(){
    GC.stop();
    SC.shutdownConnectionIfOn();
}