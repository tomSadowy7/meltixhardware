const express = require('express');
const bodyParser = require('body-parser');
const net = require('net');

const app = express();
app.use(bodyParser.json());

const AUTH_KEY = '123456';
let piSocket = null;
let buffer = "";

// Create socket server for Raspberry Pi
const socketServer = net.createServer((socket) => {
  console.log('🔔 Incoming socket connection');
  let authBuffer = '';

  const onAuthData = (data) => {
    authBuffer += data.toString();
    if (authBuffer.includes('\n')) {
      const [raw] = authBuffer.split('\n');
      try {
        const msg = JSON.parse(raw.trim());
        if (msg.key === AUTH_KEY) {
          console.log('✅ Raspberry Pi authenticated');
          piSocket = socket;
          buffer = "";

          socket.off('data', onAuthData);

          socket.on('data', (data) => {
            buffer += data.toString();
            const parts = buffer.split('\n');
            buffer = parts.pop();
            for (const msg of parts) {
              console.log('📩 From Pi:', msg.trim());
            }
          });

          socket.on('end', () => {
            console.log('⚠️ Raspberry Pi disconnected');
            piSocket = null;
          });

          socket.on('error', (err) => {
            console.error('❌ Socket error:', err.message);
            piSocket = null;
          });
        } else {
          console.log('🚫 Invalid auth key — closing connection');
          socket.destroy();
        }
      } catch (e) {
        console.log('❌ Invalid JSON — closing connection');
        socket.destroy();
      }
    }
  };

  socket.on('data', onAuthData);
});

socketServer.listen(9000, () => {
  console.log('🔌 Socket server listening on port 9000');
});

// Send command to Pi
function sendCommandToPi(command, number, key) {
  if (!piSocket) return console.error('⚠️ Raspberry Pi not connected'
