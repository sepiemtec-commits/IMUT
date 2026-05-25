import PDFDocument from "pdfkit";
import type { WeeklyAnalysisResult } from "@imut/ai-analysis";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface PdfReportInput {
  companyName: string;
  reportId: string;
  analysis: WeeklyAnalysisResult;
}

function trendPt(t: string): string {
  if (t === "rising") return "Em alta";
  if (t === "falling") return "Em queda";
  return "Estável";
}

function renderPdfToBuffer(input: PdfReportInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { companyName, analysis } = input;
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const from = analysis.periodStart.toLocaleDateString("pt-BR");
    const to = analysis.periodEnd.toLocaleDateString("pt-BR");

    doc
      .fontSize(22)
      .fillColor("#0ea5e9")
      .text("IMUT — Relatório Semanal", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor("#0f172a").text(companyName, { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor("#64748b")
      .text(`Período: ${from} a ${to}`, { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor("#0f172a").text("Resumo executivo");
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#334155").text(analysis.summary, {
      align: "justify",
      lineGap: 4,
    });
    doc.moveDown(1);

    doc.fontSize(14).text("Indicadores gerais");
    doc.moveDown(0.4);
    const m = analysis.metrics;
    doc.fontSize(10).fillColor("#334155");
    doc.text(`Leituras analisadas: ${m.totalReadings}`);
    doc.text(
      `Temperatura média global: ${m.globalAvgTemperature.toFixed(1)} °C`,
    );
    doc.text(`Umidade média global: ${m.globalAvgHumidity.toFixed(0)} %`);
    doc.text(`Total de alertas no período: ${m.totalAlerts}`);
    if (m.predictedNextTemperature != null) {
      doc.text(
        `Projeção temperatura (próximo ciclo): ~${m.predictedNextTemperature.toFixed(1)} °C`,
      );
    }
    doc.moveDown(1);

    doc.fontSize(14).fillColor("#0f172a").text("Análise por ambiente");
    doc.moveDown(0.5);

    for (const env of m.environments) {
      doc.fontSize(11).fillColor("#0ea5e9").text(env.environment);
      doc.fontSize(10).fillColor("#334155");
      doc.text(
        `Temperatura: média ${env.avgTemperature.toFixed(1)} °C | min ${env.minTemperature.toFixed(1)} | máx ${env.maxTemperature.toFixed(1)} | tendência: ${trendPt(env.temperatureTrend)}`,
      );
      doc.text(
        `Umidade: média ${env.avgHumidity.toFixed(0)} % | min ${env.minHumidity.toFixed(0)} | máx ${env.maxHumidity.toFixed(0)} | tendência: ${trendPt(env.humidityTrend)}`,
      );
      doc.text(`Leituras: ${env.readingCount} | Alertas no ambiente: ${env.alertCount}`);
      doc.moveDown(0.6);
    }

    if (analysis.insights.length > 0) {
      doc.addPage();
      doc.fontSize(14).fillColor("#0f172a").text("Insights e recomendações");
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#334155");
      for (const line of analysis.insights) {
        doc.text(`• ${line}`, { lineGap: 3 });
      }
      doc.moveDown(1);
    }

    doc.fontSize(14).fillColor("#0f172a").text("Alertas do período");
    doc.moveDown(0.5);

    if (m.alerts.length === 0) {
      doc.fontSize(10).fillColor("#334155").text("Nenhum alerta registrado.");
    } else {
      for (const alert of m.alerts.slice(0, 50)) {
        if (doc.y > 700) doc.addPage();
        doc
          .fontSize(10)
          .fillColor("#0ea5e9")
          .text(
            `[${alert.severity}] ${alert.environment} — ${new Date(alert.createdAt).toLocaleString("pt-BR")}`,
          );
        doc.fontSize(9).fillColor("#334155").text(alert.title);
        doc.text(alert.message.slice(0, 200), { lineGap: 2 });
        doc.moveDown(0.4);
      }
      if (m.alerts.length > 50) {
        doc.text(`… e mais ${m.alerts.length - 50} alertas.`);
      }
    }

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        `Gerado automaticamente pelo IMUT em ${new Date().toLocaleString("pt-BR")} · ID ${input.reportId}`,
        { align: "center" },
      );

    doc.end();
  });
}

export async function generateAndSaveWeeklyPdf(
  input: PdfReportInput,
  storageRoot: string,
): Promise<{ pdfPath: string; buffer: Buffer }> {
  const buffer = await renderPdfToBuffer(input);
  const dir = join(storageRoot, input.analysis.periodStart.toISOString().slice(0, 10));
  await mkdir(dir, { recursive: true });
  const filename = `relatorio-${input.reportId}.pdf`;
  const pdfPath = join(dir, filename);
  await writeFile(pdfPath, buffer);
  return { pdfPath, buffer };
}
