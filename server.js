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
      ws.room = d.room;

      if (!rooms[d.room]) rooms[d.room] = [];
      
      // Godot'taki my_id mantığına (Host=1, Join=2) sadık kalmak için odaya giriş sırasına göre ID veriyoruz
      if (rooms[d.room].length === 0) {
        ws.customId = 1;
      } else {
        ws.customId = 2;
      }

      rooms[d.room].push(ws);
      broadcastState(d.room);
      return;
    }

    if (d.type === "move") {
      const r = ws.room;
      if (!rooms[r]) return;

      rooms[r].forEach((c) => {
        if (c !== ws && c.readyState === WebSocket.OPEN) {
          c.send(JSON.stringify(d));
        }
      });
    }
  });

  ws.on("close", () => {
    const r = ws.room;
    if (!rooms[r]) return;
    rooms[r] = rooms[r].filter((x) => x !== ws);
    broadcastState(r);
  });
});

function broadcastState(room) {
  if (!rooms[room]) return;

  const list = rooms[room].map((ws) => ws.customId);

  rooms[room].forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "state",
          players: list,
        })
      );
    }
  });
}

server.listen(3000, () => {
  console.log("WebSocket sunucusu port 3000 üzerinde aktif.");
});
