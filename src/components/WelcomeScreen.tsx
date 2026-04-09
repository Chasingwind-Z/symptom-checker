import { useState } from 'react'
import {
  ArrowRight,
} from 'lucide-react'
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData'
import type { WeatherData } from '../lib/geolocation'
import type { ConversationSession } from '../types'
import {
  MODE_TO_POPULATION,
  type ConsultationModeId,
} from '../lib/consultationModes'
import type { HouseholdProfileRecord } from '../lib/healthWorkspaceInsights'
import { buildWeatherExperienceSummary } from '../lib/weatherExperience'
import { StatusStrip } from './StatusStrip'
import { SuggestionCards } from './SuggestionCards'

interface WelcomeScreenProps {
  onStartConsultation: () => void
  onApplyStarterText: (text: string) => void
  selectedModeId?: ConsultationModeId | null
  onSelectMode: (modeId: ConsultationModeId) => void
  onToggleMap: () => void
  onOpenEpidemicDashboard?: () => void
  sessionEmail?: string | null
  profile?: ProfileDraft | null
  weather?: WeatherData | null
  pendingFollowUpCount?: number
  householdProfiles?: HouseholdProfileRecord[]
  switchingHouseholdProfileId?: string | null
  recentCases?: CaseHistoryItem[]
  recentSessions: ConversationSession[]
  onOpenConversation: (sessionId: string) => void
  onSelectHouseholdProfile: (record: HouseholdProfileRecord) => void
  onManageProfiles: () => void
}

const DEFAULT_PROFILE_CITY = '中国大陆'

function normalizeText(value?: string | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text
}

function getRecentSessionReference(session: ConversationSession) {
  const firstUserMessage = session.messages.find((message) => message.role === 'user')
  return normalizeText(firstUserMessage?.content ?? session.title)
}

function wasUpdatedWithinOneDay(value: string) {
  const updatedAt = new Date(value)
  if (Number.isNaN(updatedAt.getTime())) return false
  return Date.now() - updatedAt.getTime() <= 24 * 60 * 60 * 1000
}

const GUARDIAN_MODES = [
  {
    id: 'self' as const,
    emoji: '👤',
    label: '我自己',
    subtitle: '标准问诊',
  },
  {
    id: 'child' as const,
    emoji: '👶',
    label: '孩子',
    subtitle: '儿科优先',
  },
  {
    id: 'elderly' as const,
    emoji: '🧓',
    label: '家里老人',
    subtitle: '高风险优先',
  },
  {
    id: 'chronic' as const,
    emoji: '💊',
    label: '慢病家属',
    subtitle: '基础病叠加',
  },
] as const

export function WelcomeScreen({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStartConsultation: _onStartConsultation,
  onApplyStarterText,
  selectedModeId,
  onSelectMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleMap: _onToggleMap,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenEpidemicDashboard: _onOpenEpidemicDashboard,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sessionEmail: _sessionEmail,
  profile,
  weather,
  pendingFollowUpCount = 0,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  householdProfiles: _householdProfiles = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  switchingHouseholdProfileId: _switchingHouseholdProfileId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recentCases: _recentCases = [],
  recentSessions,
  onOpenConversation,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelectHouseholdProfile: _onSelectHouseholdProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onManageProfiles: _onManageProfiles,
}: WelcomeScreenProps) {
  const [checkedInToday] = useState(() => {
    try {
      const raw = localStorage.getItem('daily_checkins');
      if (!raw) return false;
      const checkins = JSON.parse(raw) as Array<{ date: string }>;
      const today = new Date().toISOString().slice(0, 10);
      return checkins.some(c => c.date === today);
    } catch { return false; }
  });

  const normalizedProfileCity = normalizeText(profile?.city)
  const localCityLabel =
    normalizedProfileCity && normalizedProfileCity !== DEFAULT_PROFILE_CITY ? normalizedProfileCity : ''
  const weatherSummary = buildWeatherExperienceSummary(weather ?? null)
  const recentConversationChips = recentSessions.slice(0, 4)
  const latestSession = recentSessions[0] ?? null
  const showReengagement = Boolean(
    latestSession && (pendingFollowUpCount > 0 || wasUpdatedWithinOneDay(latestSession.updatedAt))
  )

  return (
    <div className="space-y-4">
      {/* Compact status strip */}
      <StatusStrip
        weatherText={weatherSummary?.tags?.[0]}
        checkedIn={checkedInToday}
        pendingFollowUps={pendingFollowUpCount > 0 ? pendingFollowUpCount : undefined}
        locationText={localCityLabel || undefined}
      />

      {/* Compact header */}
      <div className="text-center pt-2">
        <h1 className="text-xl font-bold text-slate-800">现在谁不舒服？</h1>
        <p className="text-xs text-slate-500 mt-1">30秒告诉你严不严重、要不要去医院</p>
      </div>

      {/* Guardian Mode Cards — slim horizontal, 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {GUARDIAN_MODES.map((mode) => {
          const isSelected = selectedModeId === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                isSelected
                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              <span className="text-2xl shrink-0">{mode.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{mode.label}</p>
                <p className="text-xs text-slate-500 truncate">{mode.subtitle}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Daily health check-in moved to StatusStrip */}

      {/* Re-engagement card */}
      {showReengagement && latestSession && (
        <button
          type="button"
          onClick={() => onOpenConversation(latestSession.id)}
          className="w-full rounded-3xl border border-amber-100 bg-amber-50 px-4 py-4 text-left shadow-sm transition-colors hover:bg-amber-100/70"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {pendingFollowUpCount > 0 ? `还有 ${pendingFollowUpCount} 项跟进未处理` : '上次问诊还有内容未完成'}
              </p>
              <p className="mt-1 truncate text-xs text-slate-600">
                {truncateText(getRecentSessionReference(latestSession) || latestSession.title, 24)}
              </p>
              <p className="mt-1 text-xs text-slate-500">点击继续，可接着之前的上下文提问。</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-700">
              继续上次
              <ArrowRight size={13} />
            </span>
          </div>
        </button>
      )}

      {/* Suggestion cards — population-aware */}
      <div className="mt-5">
        <SuggestionCards
          population={MODE_TO_POPULATION[selectedModeId || 'self'] || 'self'}
          onSelect={(query) => {
            onApplyStarterText(query);
          }}
        />
      </div>

      <p className="text-center text-xs text-slate-400 mt-3">
        或者直接在下方描述你的情况 ↓
      </p>

      {/* Recent session chips */}
      {recentConversationChips.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {recentConversationChips.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onOpenConversation(session.id)}
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors"
            >
              {truncateText(getRecentSessionReference(session) || session.title, 16)}
            </button>
          ))}
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-4" />
    </div>
  )
}
