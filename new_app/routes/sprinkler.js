import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../authMiddleware.js";
import { notifyPiOfSprinklerCmd } from "../websockets/ws-pi.js";

const prisma = new PrismaClient();
const router = express.Router();

/* ---------- GET current state ---------- */
router.get("/:deviceId", authenticateToken, async (req, res) => {
  const state = await prisma.sprinklerState.findUnique({
    where: { deviceId: req.params.deviceId }
  });
  if (!state) return res.status(404).json({ error: "No state" });
  res.json({
    zone1: state.zone1,
    zone2: state.zone2,
    zone3: state.zone3,
    zone4: state.zone4
  });
});

/* ---------- POST zone toggle ---------- */
router.post("/:deviceId/zone/:zone", authenticateToken, async (req, res) => {
  const zone = Number(req.params.zone);          // 1‥4
  if (![1, 2, 3, 4].includes(zone)) {
    return res.status(400).json({ error: "Bad zone" });
  }
  const on = !!req.body.on;

  /* 1️⃣ update DB */
  const fields = { [`zone${zone}`]: on };
  await prisma.sprinklerState.update({
    where: { deviceId: req.params.deviceId },
    data:  fields
  });

  /* 2️⃣ forward to the Pi that owns this HomeBase */
  // Here we need the device row to know lanName & homeBaseId
  const dev = await prisma.device.findUnique({ where:{ id:req.params.deviceId } });
  notifyPiOfSprinklerCmd(dev.homeBaseId, {
    lanName : dev.lanName,        // "esp32-frontyard.local"
    zone,
    on,
    key     : "123456"   // "123456"
  });

  /* 3️⃣ (optional) push new state to other apps */

  res.json({ success:true });
});

export default router;
