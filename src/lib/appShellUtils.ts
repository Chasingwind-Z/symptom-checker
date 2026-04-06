import type { SidebarSection } from '../components/AppSidebar'
import type { CaseHistoryItem } from './healthData'
import type { ConversationSession } from '../types'

export const WORKSPACE_TAB_LABELS: Record<SidebarSection, string> = {
  search: '统一搜索',
  evidence: '判断依据',
  profile: '健康档案',
  history: '会话线程',
  records: '记录中心',
  medication: '买药 / 用药',
  settings: '问诊设置',
}

export function getReportCount(): number {
  try {
    return (JSON.parse(localStorage.getItem('symptom_reports') ?? '[]') as unknown[]).length
  } catch {
    return 0
  }
}

export function stripRecordMetadata(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeRecordKey(content: string): string {
  return stripRecordMetadata(content).replace(/[^a-z0-9\u4e00-\u9fff]/gi, '').toLowerCase()
}

export function matchesSearchQuery(
  value: string | null | undefined,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true
  return normalizeRecordKey(value ?? '').includes(normalizedQuery)
}

export function getConversationReferenceText(session: ConversationSession): string {
  const firstUserMessage = session.messages.find((message) => message.role === 'user')
  return stripRecordMetadata(firstUserMessage?.content ?? session.title)
}

export function findMatchingConversation(
  summary: string,
  sessions: ConversationSession[]
): ConversationSession | null {
  const summaryKey = normalizeRecordKey(summary)
  if (!summaryKey) return null

  return (
    sessions.find((session) => {
      const sessionKey = normalizeRecordKey(getConversationReferenceText(session))
      return Boolean(sessionKey) && (sessionKey.includes(summaryKey) || summaryKey.includes(sessionKey))
    }) ?? null
  )
}

export function findMatchingCase(
  summary: string,
  recentCases: CaseHistoryItem[]
): CaseHistoryItem | null {
  const summaryKey = normalizeRecordKey(summary)
  if (!summaryKey) return null

  return (
    recentCases.find((item) => {
      const caseKey = normalizeRecordKey(item.chiefComplaint)
      return Boolean(caseKey) && (caseKey.includes(summaryKey) || summaryKey.includes(caseKey))
    }) ?? null
  )
}

export function formatDateTimeLabel(value: string | number): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '刚刚'

  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function trimText(text: string, maxLength = 92): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text
}

export function getConversationSourceLabel(storage: ConversationSession['storage']): string {
  return storage === 'supabase' ? '云端会话' : '本机会话'
}

export function getCaseSourceLabel(source: CaseHistoryItem['source']): string {
  return source === 'supabase' ? '云端摘要' : '本机摘要'
}
