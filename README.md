# Play the game
https://notsamj.github.io/Lobsters-at-sea/

# Description
A naval compat game that runs in a browser (keyboard + mouse). For information about how to play, one can open the game and press 'H' on any menu/game or watch the demo.

# Demo Video
https://www.youtube.com/watch?v=Jnje2aNqE-s

# Instructions for running
Option 1 - Play online (no steps) \
Option 2 - Download
1. Download REPO as ZIP
2. unzip
3. open las.html in a browser (Firefox rec)

# Server instructions (must be downloaded)
To set up
1. ensure npm is installed and nodejs 
2. open a command prompt / terminal
3. navigate to /sever/
4. run npm install
##
To run the server
1. edit server/lobby_settings.js (instructions in file)
2. edit server/server_data.js and set port and ws/wss
3. edit data/server_data.js and set port, address
4. run run_server.bat or in cmd "npm start"
## Permanently keep replays
1. Rename replay_backup.replay in /server/ to keep it from being overwritten
2. Rename it to local_replay_storage.js and put in /data/ to add as a local replay
## WS vs WSS instructions
If one knows how to get the required certificates, one can use the server with WSS. \
To use WSS
1. put cert.pem and key.pem in the server folder
2. edit server/server_data.js ("web_socket_secure": true)
3. edit data/server_data.js ("web_socket_secure": true)