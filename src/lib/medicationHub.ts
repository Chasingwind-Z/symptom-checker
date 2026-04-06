import type { CaseHistoryItem, ProfileDraft } from './healthData';
import {
  getMedicationGuidance,
  type MedicationAdvice,
} from './personalization';
import type { ConversationSession, DiagnosisResult } from '../types';

export type MedicationHubSourceType = 'current' | 'conversation' | 'case-summary';

export interface MedicationHubContext {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  riskLevel: DiagnosisResult['level'];
  sourceLabel: string;
  sourceType: MedicationHubSourceType;
  conversationId?: string;
  diagnosis: DiagnosisResult;
  recommendations: MedicationAdvice[];
}

interface BuildMedicationHubContextsParams {
  profile?: Partial<ProfileDraft> | null;
  currentDiagnosis?: DiagnosisResult | null;
  activeSessionId?: string | null;
  conversationSessions: ConversationSession[];
  recentCases: CaseHistoryItem[];
}

function stripMetadata(content: string) {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimText(text: string, maxLength = 118) {
  const normalized = stripMetadata(text);
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}…` : normalized;
}

function normalizeKey(text: string) {
  return stripMetadata(text).replace(/[^a-z0-9\u4e00-\u9fff]/gi, '').toLowerCase();
}

function getConversationPreview(session: ConversationSession) {
  const lastAssistantMessage = [...session.messages]
    .reverse()
    .find((message) => message.role === 'assistant');
  const lastUserMessage = [...session.messages]
    .reverse()
    .find((message) => message.role === 'user');

  return trimText(lastAssistantMessage?.content ?? lastUserMessage?.content ?? session.title, 108);
}

function buildFallbackAction(level: DiagnosisResult['level']) {
  switch (level) {
    case 'green':
      return '更适合短期家庭处理与观察；若出现新红旗信号，再尽快补充问诊。';
    case 'yellow':
      return '建议继续观察体温、疼痛和症状变化；如持续或加重，可回到原问诊补充信息。';
    case 'orange':
      return '风险偏高，建议当天线下评估，不要只依赖家庭药箱。';
    case 'red':
      return '若同类症状再次出现或正在加重，请立即线下就医或急诊处理。';
  }
}

function buildCaseSummaryDiagnosis(item: CaseHistoryItem): DiagnosisResult | null {
  if (item.triageLevel === 'pending') return null;

  return {
    level: item.triageLevel,
    reason: `${item.chiefComplaint}。${item.assistantPreview}`.trim(),
    action: buildFallbackAction(item.triageLevel),
    departments: item.departments,
    disclaimer: '仅基于历史问诊摘要整理，不替代医生诊断、处方或用药决定。',
  };
}

function buildContextKey(context: Omit<MedicationHubContext, 'recommendations'>) {
  return context.conversationId
    ? `session:${context.conversationId}`
    : normalizeKey(`${context.title} ${context.diagnosis.reason} ${context.diagnosis.action}`);
}

function pushContext(
  contexts: MedicationHubContext[],
  seenKeys: Set<string>,
  context: Omit<MedicationHubContext, 'recommendations'>,
  profile?: Partial<ProfileDraft> | null
) {
  if (!context.title.trim()) return;

  const key = buildContextKey(context);
  if (seenKeys.has(key)) return;

  seenKeys.add(key);
  contexts.push({
    ...context,
    recommendations: getMedicationGuidance(context.diagnosis, profile),
  });
}

export function buildMedicationHubContexts(
  params: BuildMedicationHubContextsParams
): MedicationHubContext[] {
  const contexts: MedicationHubContext[] = [];
  const seenKeys = new Set<string>();
  const activeSession = params.activeSessionId
    ? params.conversationSessions.find((session) => session.id === params.activeSessionId) ?? null
    : null;

  if (params.currentDiagnosis) {
    pushContext(
      contexts,
      seenKeys,
      {
        id: activeSession ? `current-${activeSession.id}` : 'current-diagnosis',
        title: activeSession?.title ?? '当前问诊',
        summary: trimText(`${params.currentDiagnosis.reason} ${params.currentDiagnosis.action}`),
        updatedAt: activeSession?.updatedAt ?? new Date().toISOString(),
        riskLevel: params.currentDiagnosis.level,
        sourceLabel: activeSession ? '当前线程' : '本次问诊',
        sourceType: 'current',
        conversationId: activeSession?.id,
        diagnosis: params.currentDiagnosis,
      },
      params.profile
    );
  }

  params.conversationSessions.forEach((session) => {
    if (!session.diagnosisResult || session.id === activeSession?.id) return;

    pushContext(
      contexts,
      seenKeys,
      {
        id: session.id,
        title: session.title,
        summary: trimText(session.diagnosisResult.reason || getConversationPreview(session)),
        updatedAt: session.updatedAt,
        riskLevel: session.diagnosisResult.level,
        sourceLabel: session.storage === 'supabase' ? '历史云端问诊' : '最近问诊',
        sourceType: 'conversation',
        conversationId: session.id,
        diagnosis: session.diagnosisResult,
      },
      params.profile
    );
  });

  params.recentCases.forEach((item) => {
    const diagnosis = buildCaseSummaryDiagnosis(item);
    if (!diagnosis) return;

    pushContext(
      contexts,
      seenKeys,
      {
        id: `case-${item.id}`,
        title: item.chiefComplaint,
        summary: trimText(`${item.chiefComplaint}。${item.assistantPreview}`),
        updatedAt: item.createdAt,
        riskLevel: diagnosis.level,
        sourceLabel: item.source === 'supabase' ? '记录中心摘要' : '最近摘要',
        sourceType: 'case-summary',
        diagnosis,
      },
      params.profile
    );
  });

  return contexts.slice(0, 4);
}
