import { Queue } from "bullmq";
import Redis from "ioredis";
import { QUEUES, JOBS } from "@imut/shared";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const alertsQueue = new Queue(QUEUES.ALERTS, { connection });

export async function enqueueAnomalyCheck(readingId: string): Promise<void> {
  await alertsQueue.add(
    JOBS.EVALUATE_ANOMALY,
    { readingId },
    {
      removeOnComplete: 500,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  );
}
