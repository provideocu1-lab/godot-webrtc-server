const WebSocket = require('ws');
const http = require('http');

// Render'ın 404 vermemesi için sahte bir HTTP sunucusu açıyoruz
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Sinyallestirme Sunucusu Ayakta!\n');
});

const wss = new WebSocket.Server({ server });
let rooms = {};

wss.on('connection', ws => {
    // Bağlantı kurulduğunda hemen Godot'ya hazır olduğumuzu bildiren bir mesaj atıyoruz
    ws.send(JSON.stringify({ type: "sistem_hazir" }));

    ws.on('message', message => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return;
        }
        
        if (data.type === 'join') {
            const room = data.room;
            if (!rooms[room]) rooms[room] = [];
            if (!rooms[room].includes(ws)) rooms[room].push(ws);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif!`);
});
