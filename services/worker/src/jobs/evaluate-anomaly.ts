import { runAnomalyAnalysisForReading } from "../services/anomaly.service.js";

export interface EvaluateAnomalyJobData {
  readingId: string;
}

export async function evaluateAnomaly(
  data: EvaluateAnomalyJobData,
): Promise<void> {
  await runAnomalyAnalysisForReading(data.readingId);
}
