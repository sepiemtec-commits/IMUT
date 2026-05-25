import { Worker } from "bullmq";
import Redis from "ioredis";
import { QUEUES, JOBS } from "@imut/shared";
import { processReading } from "../jobs/process-reading.js";
import { evaluateAnomaly } from "../jobs/evaluate-anomaly.js";
import { dispatchAlert } from "../jobs/dispatch-alert.js";
import { sendAlertEmailJob } from "../jobs/send-alert-email.js";
import { weeklyReport } from "../jobs/weekly-report.js";
import { analyzeEnvironment } from "../jobs/analyze-environment.js";

function connection() {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
}

export function createWorkers() {
  const conn = connection();

  const telemetry = new Worker(
    QUEUES.TELEMETRY,
    async (job) => {
      if (job.name === JOBS.PROCESS_READING) {
        await processReading(job.data);
      }
    },
    { connection: conn, concurrency: 10 },
  );

  const alerts = new Worker(
    QUEUES.ALERTS,
    async (job) => {
      if (job.name === JOBS.EVALUATE_ANOMALY) {
        await evaluateAnomaly(job.data);
      }
    },
    { connection: conn },
  );

  const notifications = new Worker(
    QUEUES.NOTIFICATIONS,
    async (job) => {
      if (job.name === JOBS.DISPATCH_ALERT) {
        await dispatchAlert(job.data);
      } else if (job.name === JOBS.SEND_ALERT_EMAIL) {
        await sendAlertEmailJob(job.data);
      }
    },
    { connection: conn, concurrency: 5 },
  );

  const reports = new Worker(
    QUEUES.REPORTS,
    async (job) => {
      if (job.name === JOBS.WEEKLY_REPORT) {
        await weeklyReport(job.data);
      }
    },
    { connection: conn },
  );

  const ai = new Worker(
    QUEUES.AI,
    async (job) => {
      if (job.name === JOBS.ANALYZE_ENVIRONMENT) {
        await analyzeEnvironment(job.data);
      }
    },
    { connection: conn },
  );

  return [telemetry, alerts, notifications, reports, ai];
}
