const WebSocket = require('ws');
const taskUpdates = new WebSocket.Server({ port: 8000 });

taskUpdates.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('Received:', message);
    ws.send(`Acknowledged: ${message}`);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

exports.notifyUpdate = (task) => {
  taskUpdates.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(task));
    }
  });
};
