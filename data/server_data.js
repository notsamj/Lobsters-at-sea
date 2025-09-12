const SCD = {
    "address": "localhost",
    "port": 8080,
    "web_socket_secure": false,
    "protocol": undefined // computed, "ws" or "wss" (normal or secure)
}

// Computation
if (SCD["web_socket_secure"]){
    SCD["protocol"] = "wss";
}else{
    SCD["protocol"] = "ws";
}