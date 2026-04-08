import type { SymptomTrackingEntry } from '../types'

const STORAGE_KEY = 'symptom_timeline'

const RESPIRATORY_KEYWORDS = ['咳嗽', '发烧', '发热', '感冒', '流涕', '鼻塞', '咽痛', '喉咙', '呼吸', '肺']
const DIGESTIVE_KEYWORDS = ['腹泻', '拉肚子', '恶心', '呕吐', '腹痛', '肚子', '胃', '消化']

export interface FamilyCrossInfectionAlert {
  category: string
  memberCount: number
  recentSymptoms: string[]
  alertText: string
}

function generateId(): string {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function loadEntries(): SymptomTrackingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistEntries(entries: SymptomTrackingEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function saveTrackingEntry(
  entry: Omit<SymptomTrackingEntry, 'id' | 'followUpStatus'>
): string {
  const entries = loadEntries()
  const newEntry: SymptomTrackingEntry = {
    ...entry,
    id: generateId(),
    followUpStatus: 'pending',
  }
  entries.unshift(newEntry)
  // Keep max 20 entries
  persistEntries(entries.slice(0, 20))
  return newEntry.id
}

export function getRecentTracking(limit = 5): SymptomTrackingEntry[] {
  return loadEntries().slice(0, limit)
}

export function updateFollowUpStatus(
  entryId: string,
  status: 'better' | 'same' | 'worse'
): void {
  const entries = loadEntries()
  const entry = entries.find((e) => e.id === entryId)
  if (entry) {
    entry.followUpStatus = status
    entry.followUpTimestamp = Date.now()
    persistEntries(entries)
  }
}

export function deleteTrackingEntry(entryId: string): void {
  const entries = loadEntries().filter((e) => e.id !== entryId)
  persistEntries(entries)
}

export function getHistoryContextForAI(): string {
  const entries = getRecentTracking(3)
  if (entries.length === 0) return ''

  const lines = entries.map((e) => {
    const ago = formatTimeAgo(e.timestamp)
    const statusLabel =
      e.followUpStatus === 'better' ? '已好转'
      : e.followUpStatus === 'worse' ? '更严重了'
      : e.followUpStatus === 'same' ? '没有变化'
      : '追踪中'
    return `• ${ago}：${e.symptoms.join('+')}，AI评级${e.level}，状态：${statusLabel}`
  })

  return `用户最近健康记录：\n${lines.join('\n')}`
}

export function getPendingFollowUp(): SymptomTrackingEntry | null {
  const entries = loadEntries()
  const now = Date.now()
  const FOLLOW_UP_DELAY = 48 * 60 * 60 * 1000 // 48 hours

  return entries.find(
    (e) => e.followUpStatus === 'pending' && now - e.timestamp >= FOLLOW_UP_DELAY
  ) ?? null
}

function matchesKeywords(entry: SymptomTrackingEntry, keywords: string[]): boolean {
  const text = [...entry.symptoms, entry.notes ?? ''].join(' ')
  return keywords.some((kw) => text.includes(kw))
}

export function detectFamilyCrossInfection(): FamilyCrossInfectionAlert | null {
  try {
    const entries = loadEntries()
    if (entries.length < 2) return null

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recent = entries.filter((e) => e.timestamp > sevenDaysAgo)
    if (recent.length < 2) return null

    const respiratoryEntries = recent.filter((e) => matchesKeywords(e, RESPIRATORY_KEYWORDS))
    if (respiratoryEntries.length >= 2) {
      const symptoms = [...new Set(respiratoryEntries.flatMap((e) => e.symptoms))].slice(0, 3)
      return {
        category: '呼吸道',
        memberCount: respiratoryEntries.length,
        recentSymptoms: symptoms,
        alertText: `近7天内有${respiratoryEntries.length}次呼吸道相关症状记录，可能存在交叉感染风险，建议注意通风和隔离措施。`,
      }
    }

    const digestiveEntries = recent.filter((e) => matchesKeywords(e, DIGESTIVE_KEYWORDS))
    if (digestiveEntries.length >= 2) {
      const symptoms = [...new Set(digestiveEntries.flatMap((e) => e.symptoms))].slice(0, 3)
      return {
        category: '消化道',
        memberCount: digestiveEntries.length,
        recentSymptoms: symptoms,
        alertText: `近7天内有${digestiveEntries.length}次消化道相关症状记录，可能存在交叉感染风险，建议注意饮食卫生和手部清洁。`,
      }
    }

    return null
  } catch {
    return null
  }
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  return `${days}天前`
}
