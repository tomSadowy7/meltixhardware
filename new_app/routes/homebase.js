import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../authMiddleware.js';
import { piSockets } from '../websockets/ws-pi.js'; // Or wherever it's exported

const router = express.Router();
const prisma = new PrismaClient();

// Claim a HomeBase (user must be authenticated)
// Claim or register a HomeBase
router.post('/claim', authenticateToken, async (req, res) => {
  const { homebaseId, name, online } = req.body;

  console.log('req.body:', req.body)

  console.log('Hit /claim endpoint');
  if (!homebaseId) {
    return res.status(400).json({ error: 'Missing homebaseId' });
  }

  try {
    let homebase = await prisma.homeBase.findUnique({ where: { id: homebaseId } });

    if (!homebase) {
      // Create and assign to user
      console.log('Creating HomeBase for userId:', req.userId, "status:", online);
      homebase = await prisma.homeBase.create({
        data: {
          id: homebaseId,
          name: name || `HomeBase ${homebaseId.slice(-4)}`,
          userId: req.userId,
          online: online
        },
      });
    } else {
      // Update ownership if needed
      homebase = await prisma.homeBase.update({
        where: { id: homebaseId },
        data: { userId: req.userId },
      });
    }


    res.json({ success: true, homeBase: homebase });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to claim or register HomeBase' });
  }
});
router.get('/getname', authenticateToken, async (req, res) => {
    console.log('\n=== HomeBase Name Request ===');
    console.log('Authenticated User ID:', req.userId);
    
    try {
        const homeBase = await prisma.homeBase.findUnique({
            where: { userId: req.userId },
            select: { 
                name: true,
                id: true, // <-- ADD THIS
                online: true
            }
        });

        console.log('Database Query Result:', homeBase);

        if (!homeBase) {
            console.log('No HomeBase found for user');
            return res.status(404).json({ 
                success: false,
                message: "No HomeBase associated with this account"
            });
        }

        console.log('Returning HomeBase name:', homeBase.name);
        res.json({
            success: true,
            hasHomeBase: true,
            name: homeBase.name,
            id: homeBase.id,
            online: homeBase.online
        });
    } catch (error) {
        console.error('Error in /getname:', error);
        res.status(500).json({ 
            success: false,
            error: "Server error" 
        });
    }
});


// New route to trigger Pi provisioning mode
router.post('/start-device-provision', authenticateToken, async (req, res) => {
  try {
    // 1. Get the user's homebaseId from DB
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { homebase: true }
    });
    if (!user?.homebase) {
      return res.status(404).json({ error: 'No HomeBase for user' });
    }

    const homebaseId = user.homebase.id;

    // 2. Find WebSocket for this homebase
    const ws = piSockets.get(homebaseId);
    if (!ws || ws.readyState !== ws.OPEN) {
      return res.status(404).json({ error: 'HomeBase is offline' });
    }

    // 3. Send a message to the Pi
    ws.send(JSON.stringify({ type: "start_provisioning" }));

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to trigger provisioning" });
  }
});


// routes/homebase.js  (add after start-device-provision)
router.post('/cancel-device-provision', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { homebase: true }
    });
    if (!user?.homebase) {
      return res.status(404).json({ error: 'No HomeBase for user' });
    }

    const homebaseId = user.homebase.id;
    const ws = piSockets.get(homebaseId);
    if (!ws || ws.readyState !== ws.OPEN) {
      return res.status(404).json({ error: 'HomeBase is offline' });
    }

    ws.send(JSON.stringify({ type: 'stop_provisioning' }));
    console.log(`[WS] stop_provisioning sent to ${homebaseId}`);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to cancel provisioning' });
  }
});


export default router;
