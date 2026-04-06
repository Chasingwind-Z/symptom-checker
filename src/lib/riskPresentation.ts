import type { RiskLevel } from '../types';

export type RiskPresentationLevel = RiskLevel | 'pending' | null | undefined;

const RISK_PRESENTATION: Record<RiskLevel | 'pending', { label: string; tone: string }> = {
  green: { label: '低风险', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  yellow: { label: '建议就诊', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  orange: { label: '今日处理', tone: 'bg-orange-50 text-orange-700 border-orange-100' },
  red: { label: '紧急', tone: 'bg-rose-50 text-rose-700 border-rose-100' },
  pending: { label: '进行中', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export function getRiskPresentation(level: RiskPresentationLevel) {
  return RISK_PRESENTATION[level ?? 'pending'] ?? RISK_PRESENTATION.pending;
}

export function isPriorityRisk(level: RiskPresentationLevel) {
  return level === 'orange' || level === 'red';
}
