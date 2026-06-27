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

      // duplicate fix
      if (!rooms[room].includes(ws))
        rooms[room].push(ws);

      sendState(room);

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

    sendState(r);
  });
});

function sendState(room) {
  if (!rooms[room]) return;

  // 🔥 CRITICAL FIX: ID LIST
  const list = [];

  for (let i = 0; i < rooms[room].length; i++) {
    list.push(i + 1);
  }

  rooms[room].forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "room_state",
        players: list
      }));
    }
  });
}

server.listen(3000);
