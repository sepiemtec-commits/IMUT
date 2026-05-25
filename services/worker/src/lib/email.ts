import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer/index.js";
import { env, isEmailConfigured } from "../config/env.js";
import pino from "pino";

const logger = pino({ name: "email" });

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE ?? false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface AlertEmailContent {
  to: string;
  subject: string;
  environment: string;
  title: string;
  message: string;
  severity: string;
  temperature?: number;
  humidity?: number;
}

export async function sendAlertEmail(
  content: AlertEmailContent,
): Promise<{ messageId: string } | null> {
  const transport = getTransporter();
  if (!transport) {
    logger.warn("SMTP não configurado — e-mail ignorado");
    return null;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#0ea5e9">IMUT — Alerta</h2>
      <p><strong>Ambiente afetado:</strong> ${escapeHtml(content.environment)}</p>
      <p><strong>${escapeHtml(content.title)}</strong></p>
      <p>${escapeHtml(content.message)}</p>
      ${
        content.temperature != null
          ? `<p>Temperatura: <strong>${content.temperature.toFixed(1)}°C</strong></p>`
          : ""
      }
      ${
        content.humidity != null
          ? `<p>Umidade: <strong>${content.humidity.toFixed(0)}%</strong></p>`
          : ""
      }
      <p style="color:#64748b;font-size:12px">Severidade: ${content.severity}</p>
    </div>
  `;

  const info = await transport.sendMail({
    from: env.EMAIL_FROM,
    to: content.to,
    subject: content.subject,
    text: `[IMUT] ${content.environment}\n\n${content.title}\n\n${content.message}`,
    html,
  });

  return { messageId: info.messageId };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
