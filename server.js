const WebSocket = require("ws");
const http = require("http");

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("OK");
});

const wss = new WebSocket.Server({ server });

let rooms = {};

wss.on("connection", (ws) => {

    ws.send(JSON.stringify({ type: "ready" }));

    ws.on("message", (msg) => {

        let d;
        try { d = JSON.parse(msg); } catch { return; }

        if (d.type === "join") {

            const room = d.room;
            ws.room = room;

            if (!rooms[room]) rooms[room] = [];
            rooms[room].push(ws);

            console.log("JOIN:", room);

            broadcast(room, {
                type: "spawn",
                count: rooms[room].length
            });

            return;
        }

        if (d.type === "peer_message") {

            const room = ws.room;
            if (!rooms[room]) return;

            rooms[room].forEach(c => {
                if (c !== ws && c.readyState === WebSocket.OPEN) {
                    c.send(JSON.stringify(d));
                }
            });
        }
    });

    ws.on("close", () => {

        const r = ws.room;
        if (!rooms[r]) return;

        rooms[r] = rooms[r].filter(x => x !== ws);

        broadcast(r, {
            type: "spawn",
            count: rooms[r].length
        });
    });
});

function broadcast(room, msg) {
    if (!rooms[room]) return;

    rooms[room].forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
            c.send(JSON.stringify(msg));
        }
    });
}

server.listen(3000);
