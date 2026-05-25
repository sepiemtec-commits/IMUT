import pino from "pino";
import { createWorkers } from "./workers/index.js";
import { scheduleWeeklyReports } from "./schedulers/weekly-report.js";
import { prisma } from "./lib/prisma.js";

const logger = pino({ name: "worker" });

async function main() {
  await prisma.$connect();
  const workers = createWorkers();

  scheduleWeeklyReports().catch((err) =>
    logger.error(err, "Failed to schedule weekly reports"),
  );

  logger.info(
    { queues: workers.map((w) => w.name) },
    "IMUT worker started",
  );

  process.on("SIGTERM", async () => {
    await Promise.all(workers.map((w) => w.close()));
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});
