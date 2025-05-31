import { WebSocketServer } from 'ws';

const PORT = process.env.WS_PORT || 3010;
const wss = new WebSocketServer({ port: PORT });

let state = { position: { x: 0, y: 0 }, gridPos: { row: 0, col: 0 }, mode: 'scatter' };

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', payload: state }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'update') {
        state = msg.payload;
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: 'state', payload: state }));
          }
        });
      }
    } catch {
      /* ignore */
    }
  });
});

console.log(`WebSocket server running on port ${PORT}`);

