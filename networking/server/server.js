const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const AUTH_KEY = '123456';
let piSocket = null;

// WebSocket handler
wss.on('connection', (ws) => {
  console.log('📡 WebSocket client connected');

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.key === AUTH_KEY) {
        console.log('✅ Authenticated Pi');
        piSocket = ws;
      } else {
        console.warn('🚫 Invalid key');
        ws.close();
      }
    } catch {
      console.warn('❌ Invalid JSON');
      ws.close();
    }
  });

  ws.on('close', () => {
    if (ws === piSocket) {
      console.log('⚠️ Pi disconnected');
      piSocket = null;
    }
  });
});

// HTTP API
app.post('/turnOn', (req, res) => {
  const { number, key } = req.body;
  if (![1, 2, 3, 4].includes(number) || key !== AUTH_KEY) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  if (piSocket) piSocket.send(JSON.stringify({ command: 'turnOn', number, key }));
  res.json({ status: 'Sent turnOn' });
});

app.post('/turnOff', (req, res) => {
  const { number, key } = req.body;
  if (![1, 2, 3, 4].includes(number) || key !== AUTH_KEY) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  if (piSocket) piSocket.send(JSON.stringify({ command: 'turnOff', number, key }));
  res.json({ status: 'Sent turnOff' });
});

// Start server on port 80 (Render default)
server.listen(80, () => {
  console.log('🚀 Server listening on port 80');
});
