import { buildWeeklyAnalysis, type WeeklyAlertItem } from "@imut/ai-analysis";
import { AiInsightType } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const WORKER_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
import { prisma } from "../lib/prisma.js";
import { mapReadings } from "../lib/mappers.js";
import { env } from "../config/env.js";
import { generateAndSaveWeeklyPdf } from "./pdf-report.service.js";
import { sendWeeklyReportEmail } from "../lib/weekly-email.js";
import pino from "pino";

const logger = pino({ name: "weekly-analysis" });

function weekPeriod(): { periodStart: Date; periodEnd: Date } {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);
  periodStart.setUTCHours(0, 0, 0, 0);
  return { periodStart, periodEnd };
}

async function collectRecipients(companyId: string): Promise<string[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      owner: { select: { email: true } },
      responsibles: {
        where: { isActive: true },
        select: { email: true },
      },
    },
  });

  if (!company) return [];

  const emails = new Set<string>();
  if (company.owner?.email) emails.add(company.owner.email);
  for (const r of company.responsibles) {
    emails.add(r.email);
  }
  return [...emails];
}

export async function runWeeklyAnalysisForCompany(
  companyId: string,
): Promise<string | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });
  if (!company) return null;

  const { periodStart, periodEnd } = weekPeriod();

  const readings = await prisma.sensorReading.findMany({
    where: {
      companyId,
      recordedAt: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { recordedAt: "asc" },
  });

  if (readings.length === 0) {
    logger.info({ companyId }, "Sem leituras na semana — relatório omitido");
    return null;
  }

  const alertsRaw = await prisma.alert.findMany({
    where: {
      companyId,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { createdAt: "desc" },
    select: {
      environment: true,
      title: true,
      message: true,
      severity: true,
      status: true,
      createdAt: true,
    },
  });

  const alerts: WeeklyAlertItem[] = alertsRaw.map((a) => ({
    environment: a.environment,
    title: a.title,
    message: a.message,
    severity: a.severity,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  const analysis = await buildWeeklyAnalysis({
    companyName: company.name,
    periodStart,
    periodEnd,
    readings: mapReadings(readings),
    alertCount: alerts.length,
    alerts,
  });

  const report = await prisma.weeklyReport.upsert({
    where: {
      companyId_periodStart: { companyId, periodStart },
    },
    create: {
      companyId,
      periodStart,
      periodEnd,
      summary: analysis.summary,
      metrics: analysis.metrics,
    },
    update: {
      periodEnd,
      summary: analysis.summary,
      metrics: analysis.metrics,
    },
  });

  const storageRoot = join(
    WORKER_ROOT,
    env.REPORTS_STORAGE_PATH,
    companyId,
  );

  const { pdfPath, buffer } = await generateAndSaveWeeklyPdf(
    {
      companyName: company.name,
      reportId: report.id,
      analysis,
    },
    storageRoot,
  );

  const recipients = await collectRecipients(companyId);
  const periodLabel = `${periodStart.toLocaleDateString("pt-BR")} — ${periodEnd.toLocaleDateString("pt-BR")}`;
  const emailed = await sendWeeklyReportEmail({
    recipients,
    companyName: company.name,
    periodLabel,
    summary: analysis.summary,
    pdfBuffer: buffer,
    pdfFilename: `IMUT-relatorio-${periodStart.toISOString().slice(0, 10)}.pdf`,
  });

  await prisma.weeklyReport.update({
    where: { id: report.id },
    data: {
      pdfPath,
      emailedAt: emailed ? new Date() : undefined,
      metrics: {
        ...analysis.metrics,
        pdfPath,
        emailedTo: recipients,
      },
    },
  });

  await prisma.aiInsight.create({
    data: {
      companyId,
      environment: "—",
      type: AiInsightType.WEEKLY_SUMMARY,
      narrative: analysis.summary,
      payload: {
        reportId: report.id,
        insights: analysis.insights,
        metrics: analysis.metrics,
        pdfPath,
      },
    },
  });

  logger.info(
    { companyId, reportId: report.id, pdfPath, emailed, recipients },
    "Relatório semanal gerado (PDF + e-mail)",
  );

  return report.id;
}
