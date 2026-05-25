import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer/index.js";
import { env, isEmailConfigured } from "../config/env.js";
import pino from "pino";

const logger = pino({ name: "weekly-email" });

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE ?? false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export interface WeeklyEmailInput {
  recipients: string[];
  companyName: string;
  periodLabel: string;
  summary: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}

export async function sendWeeklyReportEmail(
  input: WeeklyEmailInput,
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport || input.recipients.length === 0) {
    logger.warn("E-mail semanal ignorado (SMTP ou destinatários)");
    return false;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#0ea5e9">IMUT — Relatório Semanal</h2>
      <p><strong>${input.companyName}</strong></p>
      <p>Período: ${input.periodLabel}</p>
      <pre style="background:#f1f5f9;padding:12px;border-radius:8px;font-size:13px;white-space:pre-wrap">${escapeHtml(input.summary)}</pre>
      <p>O relatório completo em PDF está em anexo.</p>
      <p style="color:#64748b;font-size:12px">Enviado automaticamente pelo IMUT.</p>
    </div>
  `;

  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: input.recipients.join(", "),
    subject: `[IMUT] Relatório semanal — ${input.companyName}`,
    text: input.summary,
    html,
    attachments: [
      {
        filename: input.pdfFilename,
        content: input.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  logger.info({ recipients: input.recipients }, "Relatório semanal enviado");
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
