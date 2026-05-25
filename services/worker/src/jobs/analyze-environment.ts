import { weeklyReport } from "./weekly-report.js";

/** Alias: análise por ambiente roda no agregado semanal da empresa */
export async function analyzeEnvironment(data: {
  companyId: string;
}): Promise<void> {
  await weeklyReport({ companyId: data.companyId });
}
