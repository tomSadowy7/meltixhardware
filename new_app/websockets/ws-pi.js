// routes/ws-pi.js
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

export const piSockets = new Map(); // homebaseId -> ws


export function notifyPiOfSprinklerCmd(homebaseId, payload) {
  const ws = piSockets.get(homebaseId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "sprinklerCmd", ...payload }));
  } else {
    console.warn(`[WS-PI] No live socket for HB ${homebaseId}`);
  }
}

export function createPiWebSocketServer(port = 8081) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    // Parse token from query string (?token=...)
    const url = new URL(req.url, `ws://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      ws.close();
      return;
    }
    // Validate JWT
    let userId = null;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      userId = payload.userId;
    } catch {
      ws.close();
      return;
    }

    ws.once('message', (msg) => {
      let data;
      try { data = JSON.parse(msg); } catch { ws.close(); return; }
      if (data.type === 'register' && data.homebaseId) {
        piSockets.set(data.homebaseId, ws);
        ws._homebaseId = data.homebaseId;
        ws._userId = userId;
        console.log(`[WebSocket] Homebase connected: ${data.homebaseId}`);

        ws.on('close', (code, reason) => {
                  piSockets.delete(data.homebaseId);
                  console.log(
                    `[WS-PI] 🔌 closed homebase ${data.homebaseId} ` +
                    `(code ${code}${reason ? `, reason: ${reason}` : ''})`
                  );
                });
        ws.on('error', (err) => {
                  piSockets.delete(data.homebaseId);
                  console.error(`[WS-PI] ⚠️  error on ${data.homebaseId}:`, err.message);
                });
        // You can handle further messages here as needed
      } else {
        ws.close();
      }
    });
  });

  wss.on('listening', () => {
    console.log(`[WS] Pi WebSocket server listening on ws://localhost:${port}/`);
  });
}
