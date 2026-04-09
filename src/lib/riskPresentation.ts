import type { RiskLevel } from '../types';

export type RiskPresentationLevel = RiskLevel | 'pending' | null | undefined;

const RISK_PRESENTATION: Record<RiskLevel | 'pending', { label: string; tone: string }> = {
  green: { label: '可居家观察', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  yellow: { label: '建议就诊', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  orange: { label: '今日就医', tone: 'bg-orange-50 text-orange-700 border-orange-100' },
  red: { label: '立即急诊', tone: 'bg-red-50 text-red-700 border-red-100' },
  pending: { label: '待处理', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export function getRiskPresentation(level: RiskPresentationLevel) {
  return RISK_PRESENTATION[level ?? 'pending'] ?? RISK_PRESENTATION.pending;
}

export function isPriorityRisk(level: RiskPresentationLevel) {
  return level === 'orange' || level === 'red';
}
