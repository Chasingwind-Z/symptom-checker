import type { CaseHistoryItem } from './healthData';
import { getPendingFollowUpRecords } from './followUpRecords';
import { getMedicineBox } from './familyMedicineBox';

const WEEKLY_REPORT_KEY = 'last_weekly_report_date';

export interface WeeklyReportData {
  weekRange: string;
  consultationCount: number;
  mainSymptoms: string[];
  medicationUsed: string[];
  pendingAppointments: number;
  riskLevelBreakdown: Record<string, number>;
  highlights: string[];
}

export function shouldGenerateWeeklyReport(): boolean {
  try {
    const last = localStorage.getItem(WEEKLY_REPORT_KEY);
    if (!last) return true;
    const lastDate = new Date(last).getTime();
    return Date.now() - lastDate > 7 * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export function markWeeklyReportGenerated(): void {
  localStorage.setItem(WEEKLY_REPORT_KEY, new Date().toISOString());
}

export function generateWeeklyReport(recentCases: CaseHistoryItem[]): WeeklyReportData {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekRange = `${weekAgo.getMonth() + 1}/${weekAgo.getDate()} - ${now.getMonth() + 1}/${now.getDate()}`;

  // Filter this week's cases
  const thisWeekCases = recentCases.filter(c => {
    return new Date(c.createdAt).getTime() > weekAgo.getTime();
  });

  const consultationCount = thisWeekCases.length;

  // Extract symptoms from chief complaints
  const mainSymptoms = [...new Set(
    thisWeekCases.map(c => c.chiefComplaint.slice(0, 20))
  )].slice(0, 5);

  // Risk level breakdown
  const riskLevelBreakdown: Record<string, number> = {};
  for (const c of thisWeekCases) {
    riskLevelBreakdown[c.triageLevel] = (riskLevelBreakdown[c.triageLevel] || 0) + 1;
  }

  // Medicine box
  const meds = getMedicineBox();
  const medicationUsed = meds.map(m => m.name).slice(0, 5);

  // Pending follow-ups (appointments)
  const pendingAppointments = getPendingFollowUpRecords().length;

  // Generate highlights
  const highlights: string[] = [];
  if (consultationCount === 0) highlights.push('本周未进行问诊，保持健康 🎉');
  if (consultationCount > 3) highlights.push(`本周问诊${consultationCount}次，请注意休息`);
  if (riskLevelBreakdown['orange'] || riskLevelBreakdown['red']) {
    highlights.push('本周有较高风险问诊记录，请确认已就医');
  }
  if (pendingAppointments > 0) highlights.push(`有${pendingAppointments}个待处理的复诊提醒`);
  if (highlights.length === 0) highlights.push('本周健康状况平稳');

  return {
    weekRange,
    consultationCount,
    mainSymptoms,
    medicationUsed,
    pendingAppointments,
    riskLevelBreakdown,
    highlights,
  };
}
