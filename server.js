const WebSocket = require("ws");
const http = require("http");

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WebRTC Server Running\n");
});

const wss = new WebSocket.Server({ server });

let rooms = {};


wss.on("connection", (ws) => {

    ws.send(JSON.stringify({ type: "sistem_hazir" }));


    ws.on("message", (message) => {

        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return;
        }

        // ---------------- JOIN ----------------
        if (data.type === "join") {

            const room = data.room;
            ws.room = room;

            if (!rooms[room]) rooms[room] = [];

            rooms[room].push(ws);

            console.log("JOIN ROOM:", room);

            // 🔥 herkes birbirini görsün (CRITICAL FIX)
            broadcast(room, {
                type: "spawn_all",
                count: rooms[room].length
            });

            return;
        }

        // ---------------- PEER SIGNAL ----------------
        if (data.type === "peer_message") {

            const room = ws.room;
            if (!room || !rooms[room]) return;

            rooms[room].forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        }
    });


    ws.on("close", () => {

        if (!ws.room) return;

        const room = ws.room;

        if (!rooms[room]) return;

        rooms[room] = rooms[room].filter(c => c !== ws);

        // update room
        broadcast(room, {
            type: "room_update",
            count: rooms[room].length
        });
    });
});


function broadcast(room, msg) {

    if (!rooms[room]) return;

    rooms[room].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
        }
    });
}


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
