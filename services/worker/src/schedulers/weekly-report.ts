import { Queue } from "bullmq";
import Redis from "ioredis";
import { QUEUES, JOBS } from "@imut/shared";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import pino from "pino";

const logger = pino({ name: "weekly-scheduler" });

const ACTIVE: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
];

export async function scheduleWeeklyReports(): Promise<void> {
  const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  const queue = new Queue(QUEUES.REPORTS, { connection });

  const companies = await prisma.company.findMany({
    where: { subscription: { status: { in: ACTIVE } } },
    select: { id: true, timezone: true },
  });

  for (const company of companies) {
    await queue.add(
      JOBS.WEEKLY_REPORT,
      { companyId: company.id },
      {
        repeat: {
          pattern: "0 8 * * 0",
          tz: company.timezone,
        },
        jobId: `weekly-${company.id}`,
      },
    );
  }

  logger.info({ count: companies.length }, "Agendamento semanal configurado");
}
