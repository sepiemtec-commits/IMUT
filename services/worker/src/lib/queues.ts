import { Queue } from "bullmq";
import Redis from "ioredis";
import { QUEUES } from "@imut/shared";

function connection() {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
}

export const alertsQueue = new Queue(QUEUES.ALERTS, { connection: connection() });
export const notificationsQueue = new Queue(QUEUES.NOTIFICATIONS, {
  connection: connection(),
});
export const reportsQueue = new Queue(QUEUES.REPORTS, { connection: connection() });
