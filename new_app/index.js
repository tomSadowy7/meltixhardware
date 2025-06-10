import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import homebaseRoutes from './routes/homebase.js';
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/device.js';
import { createPiWebSocketServer } from './routes/websocket.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/homebase', homebaseRoutes);
app.use('/auth', authRoutes);
app.use('/device', deviceRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Start the WebSocket server (on 8081, or choose another port)
createPiWebSocketServer(8081);
