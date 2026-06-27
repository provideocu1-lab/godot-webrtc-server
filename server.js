const WebSocket = require("ws");
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
});

const wss = new WebSocket.Server({ server });

let rooms = {};
let idCounter = 0; // Her bağlanan oyuncuya benzersiz ID vermek için

wss.on("connection", (ws) => {
  // Sokete özel benzersiz ID tanımlıyoruz
  idCounter++;
  ws.clientId = idCounter;

  ws.send(JSON.stringify({ type: "ready" }));

  ws.on("message", (msg) => {
    let d;
    try { d = JSON.parse(msg); } catch { return; }

    if (d.type === "join") {
      ws.room = d.room;

      // Eğer butonlarda HOST seçildiyse ID'yi 1, JOIN seçildiyse 2 yapalım (Senin Godot mantığına sadık kalmak için)
      // Ancak daha fazla oyuncu için ws.clientId doğrudan kullanılabilir.
      if (!rooms[d.room]) {
        rooms[d.room] = [];
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

      rooms[r].forEach(c => {
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
    broadcastState(r);
  });
});

function broadcastState(room) {
  if (!rooms[room]) return;

  // Odadaki oyuncuların atanan ID'lerini listeliyoruz
  const list = rooms[room].map(ws => ws.customId);

  rooms[room].forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "state",
        players: list
      }));
    }
  });
}

server.listen(3000, () => {
  console.log("Sunucu 3000 portunda çalışıyor...");
});
