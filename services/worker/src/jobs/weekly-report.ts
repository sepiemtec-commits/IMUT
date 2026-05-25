import { runWeeklyAnalysisForCompany } from "../services/weekly-analysis.service.js";

export interface WeeklyReportJobData {
  companyId: string;
}

export async function weeklyReport(data: WeeklyReportJobData): Promise<void> {
  await runWeeklyAnalysisForCompany(data.companyId);
}
