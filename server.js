const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

let rooms = {};

wss.on('connection', ws => {
    ws.on('message', message => {
        const data = JSON.parse(message);
        if (data.type === 'join') {
            const room = data.room;
            if (!rooms[room]) rooms[room] = [];
            rooms[room].push(ws);
            ws.room = room;
            console.log(`Bir oyuncu ${room} odasına katıldı.`);
        }
        if (data.type === 'peer_message') {
            if (rooms[ws.room]) {
                rooms[ws.room].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
        }
    });
    ws.on('close', () => {
        if (ws.room && rooms[ws.room]) {
            rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);
        }
    });
});
console.log("Sinyalleşme sunucusu aktif!");
