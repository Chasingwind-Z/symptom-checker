import { getMedicineBox } from './familyMedicineBox';
import { getMetricsSummaryForAI } from './healthMetrics';

const MEMORY_KEY = 'user_long_term_memory';

export interface LongTermMemory {
  frequentSymptoms: string[];
  chronicConditions: string[];
  lastUpdated: string;
}

export function saveLongTermMemory(memory: LongTermMemory): void {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

export function getLongTermMemory(): LongTermMemory | null {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function buildFullMemoryContext(recentCases?: Array<{ chiefComplaint: string; triageLevel: string; departments: string[] }>): string {
  const parts: string[] = [];

  // Recent consultations
  if (recentCases && recentCases.length > 0) {
    const casesSummary = recentCases.slice(0, 3).map(c =>
      `${c.chiefComplaint.slice(0, 30)}(${c.triageLevel})`
    ).join('；');
    parts.push(`近期问诊：${casesSummary}`);
  }

  // Health metrics
  const metrics = getMetricsSummaryForAI();
  if (metrics) parts.push(metrics);

  // Medicine box
  const meds = getMedicineBox();
  if (meds.length > 0) {
    parts.push(`家中备药：${meds.slice(0, 5).map(m => m.name).join('、')}`);
  }

  // Long-term memory
  const ltm = getLongTermMemory();
  if (ltm && ltm.frequentSymptoms.length > 0) {
    parts.push(`高频症状：${ltm.frequentSymptoms.join('、')}`);
  }

  return parts.join('。');
}
