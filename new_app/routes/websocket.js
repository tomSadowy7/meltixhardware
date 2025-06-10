// websocket.js
import { WebSocketServer } from 'ws';

export const piSockets = new Map(); // homebaseId -> WebSocket

// Listen on a PORT (not attached to your Express server)
export function createPiWebSocketServer(port = 8081) {
  const wss = new WebSocketServer({ port, path: '/' });

  wss.on('connection', (ws, req) => {
    // Expect the Pi to send its homebaseId as the first message
    ws.once('message', (msg) => {
      try {
        const { homebaseId } = JSON.parse(msg);
        if (!homebaseId) {
          ws.close();
          return;
        }
        piSockets.set(homebaseId, ws);
        console.log(`[WebSocket] Pi connected: ${homebaseId}`);

        ws.on('close', () => {
          piSockets.delete(homebaseId);
          console.log(`[WebSocket] Pi disconnected: ${homebaseId}`);
        });
        ws.on('error', (err) => {
          piSockets.delete(homebaseId);
          console.error(`[WebSocket] Error for ${homebaseId}:`, err);
        });
      } catch {
        ws.close();
      }
    });
  });

  wss.on('listening', () => {
    console.log(`[WebSocket] Pi WebSocket server listening on ws://localhost:${port}/`);
  });

  return wss;
}
