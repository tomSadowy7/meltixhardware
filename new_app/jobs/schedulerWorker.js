import cron from "node-cron";
import { PrismaClient, RunSource } from "@prisma/client";
import { notifyPiOfSprinklerCmd } from "../websockets/ws-pi.js";

const prisma = new PrismaClient();

// helper → create partial { zone1:val, … } object
const zonePatch = (mask, val) => ({
  ...(mask & 1 ? { zone1: val } : {}),
  ...(mask & 2 ? { zone2: val } : {}),
  ...(mask & 4 ? { zone3: val } : {}),
  ...(mask & 8 ? { zone4: val } : {}),
});

cron.schedule("*/5 * * * *", async () => {
  const now = new Date();
  const dow = now.getDay(); // 0–6
  const bucket = Math.floor((now.getHours() * 60 + now.getMinutes()) / 5);

  console.log(`[CRON] ${now.toISOString()} → dow=${dow}, bucket=${bucket}`);

  /* ---------- 1. ON phase ---------- */
  const onSlots = await prisma.$queryRaw`
    SELECT ss.*, s."deviceId", ss."scheduleId",
           d."homeBaseId", d."lanName"
    FROM   "ScheduleSlot" ss
    JOIN   "Schedule" s ON s.id = ss."scheduleId"
    JOIN   "Device"   d ON d.id = s."deviceId"
    WHERE  s.enabled         = true
      AND  ss.dow            = ${dow}
      AND  ss."startBucket"  <= ${bucket}
      AND  ss."startBucket" + ss."bucketCount" > ${bucket};
  `;

  console.log(`[CRON]   ON  slots: ${onSlots.length}`);

  for (const sl of onSlots) {
    await prisma.$transaction(async (tx) => {
      /* close any open overlap, then log new run */
      await tx.runHistory.updateMany({
        where: { deviceId: sl.deviceId, zoneMask: sl.zoneMask, endedAt: null },
        data: { endedAt: now },
      });
      await tx.runHistory.create({
        data: {
          deviceId: sl.deviceId,
          zoneMask: sl.zoneMask,
          startedAt: now,
          source: RunSource.SCHEDULE,
          scheduleId: sl.scheduleId,
        },
      });
      /* set zones ON in SprinklerState */
      await tx.sprinklerState.update({
        where: { deviceId: sl.deviceId },
        data: zonePatch(sl.zoneMask, true),
      });
    });

    /* send ON commands per zone */
    for (let z = 1; z <= 4; z++) {
      if (sl.zoneMask & (1 << (z - 1))) {
        notifyPiOfSprinklerCmd(sl.homeBaseId, {
          lanName: sl.lanName,
          zone: z,
          on: true,
          key: "123456",
        });
      }
    }
  }

  /* ---------- 2. OFF phase ---------- */
  const offSlots = await prisma.$queryRaw`
    SELECT ss.*, s."deviceId", ss."scheduleId",
           d."homeBaseId", d."lanName"
    FROM   "ScheduleSlot" ss
    JOIN   "Schedule" s ON s.id = ss."scheduleId"
    JOIN   "Device"   d ON d.id = s."deviceId"
    WHERE  s.enabled         = true
      AND  ss.dow            = ${dow}
      AND  ss."startBucket" + ss."bucketCount" = ${bucket};
  `;

  console.log(`[CRON]   OFF slots: ${offSlots.length}`);

  for (const sl of offSlots) {
    await prisma.$transaction(async (tx) => {
      /* close any open run rows */
      await tx.runHistory.updateMany({
        where: { deviceId: sl.deviceId, zoneMask: sl.zoneMask, endedAt: null },
        data: { endedAt: now },
      });
      /* set zones OFF in SprinklerState */
      await tx.sprinklerState.update({
        where: { deviceId: sl.deviceId },
        data: zonePatch(sl.zoneMask, false),
      });
    });

    /* send OFF commands per zone */
    for (let z = 1; z <= 4; z++) {
      if (sl.zoneMask & (1 << (z - 1))) {
        notifyPiOfSprinklerCmd(sl.homeBaseId, {
          lanName: sl.lanName,
          zone: z,
          on: false,
          key: "123456",
        });
      }
    }
  }

  console.log("[CRON]   pass complete\n");
});
