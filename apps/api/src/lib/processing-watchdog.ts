import { db } from "./db.js";

const STUCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const CHECK_INTERVAL_MS = 5 * 60 * 1000;   // every 5 minutes

const failStuckImports = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);

  const { count } = await db.import.updateMany({
    where: { status: "processing", updatedAt: { lt: cutoff } },
    data: {
      status: "failed",
      failureReason: "Processing timed out. Try again.",
    },
  });

  if (count > 0) {
    console.log(`[watchdog] Marked ${count} stuck import(s) as failed.`);
  }
};

export const startProcessingWatchdog = async (): Promise<void> => {
  // On startup: immediately fail anything left in "processing" (from a previous crash/restart)
  const { count } = await db.import.updateMany({
    where: { status: "processing" },
    data: {
      status: "failed",
      failureReason: "Processing interrupted by server restart. Try again.",
    },
  });

  if (count > 0) {
    console.log(`[watchdog] Cleaned up ${count} import(s) stuck from previous run.`);
  }

  // Periodic check for future stuck imports
  setInterval(() => void failStuckImports(), CHECK_INTERVAL_MS);
};
