const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 });

let clients = [];

server.on("connection", (ws) => {

  clients.push(ws);

  ws.on("message", (msg) => {

    let d;
    try { d = JSON.parse(msg); } catch { return; }

    if (d.type === "join") {

      ws.id = clients.indexOf(ws) + 1;

      console.log("JOIN:", ws.id);

      broadcastState();
      return;
    }

    if (d.type === "move") {
      broadcast(msg, ws);
    }
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
    broadcastState();
  });
});

function broadcastState() {

  const ids = clients.map((_, i) => i + 1);

  for (const c of clients) {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify({
        type: "state",
        players: ids
      }));
    }
  }
}

function broadcast(msg, sender) {
  for (const c of clients) {
    if (c !== sender && c.readyState === WebSocket.OPEN) {
      c.send(msg);
    }
  }
}

console.log("SERVER RUNNING");
