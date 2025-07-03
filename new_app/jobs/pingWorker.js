// jobs/pingWorker.js
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";

// ⬇️  bring in both helpers from the websocket module
import { sendToPi, pendingPings, PING_TIMEOUT_MS } from "../websockets/ws-pi.js";

const prisma = new PrismaClient();

cron.schedule("*/1 * * * *", async () => {
  const now = new Date();
  console.log(`[PING-ESP] 🔁 Tick — ${now.toISOString()}`);

  // 1) Fetch all devices that have a lanName (skip nulls)
  const devices = await prisma.device.findMany({
  where : { lanName: { not: "" } },
  select: { id: true, lanName: true, homeBaseId: true }
});

  console.log(`[PING-ESP] 📦 Found ${devices.length} devices with lanName`);

  // 2) Group per HomeBase
  const perHB = devices.reduce((acc, d) => {
    (acc[d.homeBaseId] ??= []).push(d);
    return acc;
  }, {});

  // 3) Send ping request for each device
  for (const [hbId, devs] of Object.entries(perHB)) {
    console.log(`[PING-ESP] 🧃 Homebase ${hbId} → ${devs.length} devices`);
    devs.forEach(d => {
      const msgId = uuid();
      console.log(`[PING-ESP] 🛰️  Sending ping to ${d.lanName} (device ${d.id}) with msgId ${msgId}`);

      // Register pending ping
      pendingPings.set(msgId, {
        deviceId : d.id,
        expiresAt: Date.now() + PING_TIMEOUT_MS
      });

      const sent = sendToPi(hbId, {
        type   : "pingEsp",
        lanName: d.lanName,
        msgId
      });

      if (!sent) {
        console.warn(`[PING-ESP] ❌ Failed to send ping to homebase ${hbId} (socket not open)`);
        pendingPings.delete(msgId);
      }
    });
  }

  console.log("[PING-ESP] ✅ Ping dispatch complete\n");
});
