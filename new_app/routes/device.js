// POST /api/device/register
import { PrismaClient } from "@prisma/client";
import express from "express";
const router = express.Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
  const { homeBaseId, deviceId, name, type } = req.body;
  if (!homeBaseId || !deviceId || !name || !type) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    // Upsert device
    const device = await prisma.device.upsert({
      where: { id: deviceId },
      update: { name, type, homeBaseId },
      create: {
        id: deviceId,
        name,
        type,
        homeBase: { connect: { id: homeBaseId } }
      }
    });
    res.json({ success: true, device });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to register device" });
  }
});

export default router;
