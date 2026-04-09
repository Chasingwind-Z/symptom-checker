import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  MapPin,
  ShieldPlus,
  ShoppingCart,
  TrendingUp,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData'
import type { WeatherData } from '../lib/geolocation'
import { maskEmail } from '../lib/supabase'
import type { ConversationSession } from '../types'
import {
  getConsultationModePreset,
  type ConsultationModeId,
} from '../lib/consultationModes'
import type { HouseholdProfileRecord } from '../lib/healthWorkspaceInsights'
import { buildWeatherExperienceSummary } from '../lib/weatherExperience'
import { getDistrictRiskData, getActiveCity, fetchCityAggregation, detectLocalSurgeAlert, type SurgeAlert } from '../lib/epidemicDataEngine'
import { buildJDSearchUrl, trackMedicationClick } from '../lib/jdAffiliate'
import { HouseholdProfileSwitcher } from './HouseholdProfileSwitcher'
import { detectFamilyCrossInfection, type FamilyCrossInfectionAlert } from '../lib/symptomTracking'

interface ScenarioChip {
  label: string
  sendText: string
}

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

interface FocusPathCard {
  id: string
  title: string
  description: string
  sendText: string
  icon: LucideIcon
  toneClass: string
}

const COMMON_SCENARIOS: ScenarioChip[] = [
  { label: '发烧 38.5℃，要不要去医院', sendText: '发烧 38.5℃，要不要去医院' },
  { label: '咳嗽三天，晚上更重', sendText: '咳嗽三天，晚上更重' },
  { label: '先把过敏史和现在用药说清楚', sendText: '先把过敏史和现在用药说清楚' },
]

const DEFAULT_PROFILE_CITY = '中国大陆'
const MIN_SCENARIO_CHIP_COUNT = 3
const MAX_PERSONALIZED_CHIP_COUNT = 4

function getModeSubject(modeId?: ConsultationModeId | null) {
  switch (modeId) {
    case 'child':
      return '孩子现在的情况'
    case 'elderly':
      return '家里老人现在的情况'
    case 'chronic':
      return '我这种有慢病背景的情况'
    default:
      return '我这次情况'
  }
}

function normalizeText(value?: string | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text
}

function summarizeContextValue(value?: string | null, maxItems = 2, maxLength = 22) {
  const normalized = normalizeText(value)
  if (!normalized) return ''

  const parts = normalized
    .split(/[、，,；;/]/)
    .map((item) => item.trim())
    .filter(Boolean)
  const summary = parts.length > 1 ? parts.slice(0, maxItems).join('、') : normalized
  return truncateText(summary, maxLength)
}

function getRecentSessionReference(session: ConversationSession) {
  const firstUserMessage = session.messages.find((message) => message.role === 'user')
  return normalizeText(firstUserMessage?.content ?? session.title)
}

function buildPersonalizedScenarios(params: {
  profile?: ProfileDraft | null
  recentCases?: CaseHistoryItem[]
  recentSessions: ConversationSession[]
}) {
  const personalized: ScenarioChip[] = []
  const recentCase = params.recentCases?.find((item) => normalizeText(item.chiefComplaint))

  if (recentCase) {
    const complaint = normalizeText(recentCase.chiefComplaint)
    personalized.push({
      label: `继续关注：${truncateText(complaint, 14)}`,
      sendText: `我想继续跟进最近一次“${complaint}”相关的情况，请先帮我梳理和上次相比需要重点观察哪些变化，以及何时需要复诊或线下就医。`,
    })
  } else {
    const recentSession = params.recentSessions.find((session) => getRecentSessionReference(session))
    const reference = recentSession ? getRecentSessionReference(recentSession) : ''

    if (reference) {
      personalized.push({
        label: `继续上次话题：${truncateText(reference, 12)}`,
        sendText: `我想继续上次关于“${truncateText(reference, 28)}”的咨询，请先帮我回顾这次需要补充的重点症状和下一步判断。`,
      })
    }
  }

  const careFocus = normalizeText(params.profile?.careFocus)
  if (careFocus) {
    personalized.push({
      label: `关注：${truncateText(careFocus, 12)}`,
      sendText: `我想做一次症状自查。我这次更关注“${careFocus}”，请围绕这个重点问我关键问题，并保守判断下一步。`,
    })
  }

  const chronicConditions = summarizeContextValue(params.profile?.chronicConditions)
  const allergies = summarizeContextValue(params.profile?.allergies)
  const currentMedications = summarizeContextValue(params.profile?.currentMedications)
  const medicalContext = [
    chronicConditions ? `慢病/既往史：${chronicConditions}` : '',
    allergies ? `过敏史：${allergies}` : '',
    currentMedications ? `当前用药：${currentMedications}` : '',
  ].filter(Boolean)
  const medicalLabels = [
    chronicConditions ? '慢病' : '',
    allergies ? '过敏' : '',
    currentMedications ? '用药' : '',
  ].filter(Boolean)

  if (medicalContext.length > 0) {
    personalized.push({
      label: `先说明${medicalLabels.join('、')}`,
      sendText: `我想做一次症状自查。开始前先补充这些背景：${medicalContext.join('；')}。请在问诊和建议里结合这些情况，给我更保守的下一步判断。`,
    })
  }

  const city = normalizeText(params.profile?.city)
  if (city && city !== DEFAULT_PROFILE_CITY) {
    personalized.push({
      label: `我在${truncateText(city, 8)}，先判断要不要线下看`,
      sendText: `我在${city}，想先做一次保守的症状自查，也请帮助我判断是否需要尽快线下就诊。`,
    })
  }

  return personalized
}

function buildFocusPathCards(params: {
  selectedModeId?: ConsultationModeId | null
  cityLabel?: string
  weather?: WeatherData | null
}): FocusPathCard[] {
  const subject = getModeSubject(params.selectedModeId)
  const weatherSummary = buildWeatherExperienceSummary(params.weather ?? null)
  const localAccessLabel = params.cityLabel ? `${params.cityLabel} 本地资源` : '附近门诊 / 药房入口'

  return [
    {
      id: 'severity-first',
      title: '先判断严不严重',
      description: '优先做保守分级，先知道要不要马上线下处理。',
      sendText: `请先判断${subject}现在严不严重，我会马上补充主要症状、持续时间和伴随表现。`,
      icon: ShieldPlus,
      toneClass: 'border-amber-100 bg-amber-50/70',
    },
    {
      id: 'action-first',
      title: '先看现在怎么办',
      description: '先拿到家庭处理、观察重点和复诊时机。',
      sendText: `请先告诉我${subject}现在在家该怎么处理、重点观察什么，以及什么情况要尽快就医。`,
      icon: HeartPulse,
      toneClass: 'border-cyan-100 bg-cyan-50/70',
    },
    {
      id: 'access-first',
      title: '先找去哪看 / 买药',
      description: `${localAccessLabel} + ${weatherSummary.tags[0]}，更适合先判断行动入口。`,
      sendText: `请先判断${subject}是否需要尽快去医院，还是可以先看附近药房或 OTC 方向；也请说明适合挂什么科。`,
      icon: MapPin,
      toneClass: 'border-violet-100 bg-violet-50/70',
    },
  ]
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
    description: '成年人自查',
  },
  {
    id: 'child' as const,
    emoji: '👶',
    label: '孩子',
    description: '14岁以下',
  },
  {
    id: 'elderly' as const,
    emoji: '🧓',
    label: '家里老人',
    description: '60岁以上',
  },
  {
    id: 'chronic' as const,
    emoji: '💊',
    label: '慢病患者',
    description: '有基础疾病',
  },
] as const

export function WelcomeScreen({
  onStartConsultation,
  onApplyStarterText,
  selectedModeId,
  onSelectMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleMap: _onToggleMap,
  onOpenEpidemicDashboard,
  sessionEmail,
  profile,
  weather,
  pendingFollowUpCount = 0,
  householdProfiles = [],
  switchingHouseholdProfileId,
  recentCases = [],
  recentSessions,
  onOpenConversation,
  onSelectHouseholdProfile,
  onManageProfiles,
}: WelcomeScreenProps) {
  const [showExtras, setShowExtras] = useState(false)
  const [crossInfectionAlert, setCrossInfectionAlert] = useState<FamilyCrossInfectionAlert | null>(null)
  const [alertDismissed, setAlertDismissed] = useState(false)

  useEffect(() => {
    const alert = detectFamilyCrossInfection()
    if (alert) {
      window.setTimeout(() => setCrossInfectionAlert(alert), 0)
    }
  }, [])

  // Community health trend data (loaded once from epidemic data engine)
  const [trendData, setTrendData] = useState<{ symptom: string; heat: number; color: string }[]>([])
  const [trendCity, setTrendCity] = useState('本地')
  const [todayReportCount, setTodayReportCount] = useState<number | null>(null)
  const [surgeAlert, setSurgeAlert] = useState<SurgeAlert | null>(null)

  useEffect(() => {
    const alert = detectLocalSurgeAlert()
    if (alert) {
      window.setTimeout(() => setSurgeAlert(alert), 0)
    }
  }, [])

  useEffect(() => {
    const cityName = getActiveCity()
    setTrendCity(cityName)

    fetchCityAggregation(cityName || '北京').then(agg => {
      if (agg) {
        window.setTimeout(() => setTodayReportCount(agg.totalReports), 0)
      }
    })

    const districts = getDistrictRiskData(cityName)
    const symptomAgg: Record<string, { count: number; totalScore: number }> = {}

    for (const d of districts) {
      for (const s of d.topSymptoms) {
        if (!symptomAgg[s]) symptomAgg[s] = { count: 0, totalScore: 0 }
        symptomAgg[s].count++
        symptomAgg[s].totalScore += d.riskScore
      }
    }

    const sorted = Object.entries(symptomAgg)
      .map(([symptom, { count, totalScore }]) => ({
        symptom,
        rawHeat: (totalScore / count) * (count / districts.length),
      }))
      .sort((a, b) => b.rawHeat - a.rawHeat)
      .slice(0, 3)

    const maxRaw = sorted[0]?.rawHeat ?? 1
    const trends = sorted.map(({ symptom, rawHeat }) => {
      const heat = Math.min(99, Math.max(10, Math.round((rawHeat / maxRaw) * 65 + 20)))
      const color = heat >= 60 ? 'red' : heat >= 40 ? 'amber' : 'emerald'
      return { symptom, heat, color }
    })

    setTrendData(trends)
  }, [])

  const personalizedScenarios = buildPersonalizedScenarios({
    profile,
    recentCases,
    recentSessions,
  })
  const maskedSessionEmail = sessionEmail ? maskEmail(sessionEmail) : ''
  const selectedMode = getConsultationModePreset(selectedModeId)
  const normalizedProfileCity = normalizeText(profile?.city)
  const localCityLabel =
    normalizedProfileCity && normalizedProfileCity !== DEFAULT_PROFILE_CITY ? normalizedProfileCity : ''
  void buildWeatherExperienceSummary(weather ?? null) // kept for focusPathCards internal use
  const focusPathCards = buildFocusPathCards({
    selectedModeId,
    cityLabel: localCityLabel,
    weather,
  })
  const modeStarterScenarios = selectedMode
    ? selectedMode.starterPrompts.map((prompt) => ({
        label: truncateText(prompt, 18),
        sendText: prompt,
      }))
    : COMMON_SCENARIOS
  const scenarioChips = Array.from(
    new Map(
      [
        ...personalizedScenarios.slice(0, selectedMode ? 1 : 2),
        ...modeStarterScenarios,
        ...COMMON_SCENARIOS,
      ].map((item) => [item.sendText, item] as const)
    ).values()
  ).slice(0, selectedMode ? MAX_PERSONALIZED_CHIP_COUNT : MIN_SCENARIO_CHIP_COUNT)
  // const hasPersonalizedScenarios = personalizedScenarios.length > 0
  const recentConversationChips = recentSessions.slice(0, 3)
  const latestSession = recentSessions[0] ?? null
  const cloudSessions = recentSessions.filter((session) => session.storage === 'supabase')
  const latestCloudSession = cloudSessions[0] ?? null
  const showReengagement = Boolean(
    latestSession && (pendingFollowUpCount > 0 || wasUpdatedWithinOneDay(latestSession.updatedAt))
  )

  return (
    <div className="space-y-4">
      {/* Cross-infection alert banner */}
      {crossInfectionAlert && !alertDismissed && (
        <div className="mb-4 rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">家庭健康提醒</p>
                <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                  {crossInfectionAlert.alertText}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="text-orange-400 hover:text-orange-600 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Compact header */}
      <div className="px-1 pt-2">
        <h1 className="text-xl font-bold text-slate-800">健康助手</h1>
        <p className="mt-1 text-sm text-slate-500">今天在照顾谁？</p>
      </div>

      {/* Guardian Mode Cards — HERO position, 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {GUARDIAN_MODES.map((mode) => {
          const isSelected = selectedModeId === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="text-2xl mb-2">{mode.emoji}</div>
              <p className="text-sm font-semibold text-slate-800">{mode.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{mode.description}</p>
            </button>
          )
        })}
      </div>
      {selectedMode && (
        <p className="text-xs leading-relaxed text-slate-500 px-1">
          {selectedMode.summary}
        </p>
      )}

      {/* Household profile switcher */}
      <HouseholdProfileSwitcher
        currentProfile={profile ?? {
          displayName: '',
          city: '中国大陆',
          birthYear: null,
          gender: '',
          medicalNotes: '',
          chronicConditions: '',
          allergies: '',
          currentMedications: '',
          careFocus: '',
          profileMode: 'custom',
        }}
        householdProfiles={householdProfiles}
        isSwitchingId={switchingHouseholdProfileId}
        onSwitchProfile={onSelectHouseholdProfile}
        onManageProfiles={onManageProfiles}
      />

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

      {/* Cloud sync card */}
      {!showReengagement && sessionEmail && latestCloudSession && (
        <button
          type="button"
          onClick={() => onOpenConversation(latestCloudSession.id)}
          className="w-full rounded-3xl border border-blue-100 bg-blue-50 px-4 py-4 text-left shadow-sm transition-colors hover:bg-blue-100/70"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">已同步 {cloudSessions.length} 段问诊，可跨设备继续</p>
              <p className="mt-1 truncate text-xs text-slate-600">
                {truncateText(getRecentSessionReference(latestCloudSession) || latestCloudSession.title, 24)}
              </p>
              <p className="mt-1 text-xs text-slate-500">适合直接回到上次线程继续补充，不必从头再说。</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-700">
              继续查看
              <ArrowRight size={13} />
            </span>
          </div>
        </button>
      )}

      {/* Status + input prompt area */}
      <div className="rounded-3xl border border-slate-200 bg-white/95 px-5 pb-5 pt-4 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          <span className={`h-1.5 w-1.5 rounded-full ${sessionEmail ? 'bg-blue-500' : 'bg-emerald-500'}`} />
          {sessionEmail
            ? `已登录 · ${maskedSessionEmail}${cloudSessions.length > 0 ? ` · ${cloudSessions.length} 段问诊可继续` : ''}`
            : '未登录 · 仅本设备保存'}
        </div>

        {/* eslint-disable-next-line no-constant-binary-expression */}
        {false && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {[
            '先判断今天需不需要线下处理',
            '年龄、慢病和用药会自动带入',
            '登录后可跨设备继续上次问诊',
          ].map((item) => (
            <span key={item} className="text-xs text-slate-500">
              <span className="mr-1 font-semibold text-emerald-500">✓</span>
              {item}
            </span>
          ))}
        </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>直接在下方输入症状，或先点一个起步词条。</span>
          <button
            type="button"
            onClick={onStartConsultation}
            className="inline-flex items-center gap-1 font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            <CheckCircle2 size={14} />
            直接输入症状
          </button>
        </div>
      </div>

      {/* Community health trend card */}
      {trendData.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3.5 shadow-sm">
          <p className="text-xs font-medium text-slate-600">
            📍 {localCityLabel || trendCity} · 今日社区健康动态
            {todayReportCount != null && todayReportCount > 0 && (
              <span className="ml-1 text-slate-400">
                · 今日已有 {todayReportCount} 人参与健康上报
              </span>
            )}
          </p>
          <div className="mt-3 space-y-2.5">
            {trendData.map((item) => (
              <div key={item.symptom} className="flex items-center gap-2.5 text-xs">
                <span>
                  {item.color === 'red' ? '🔴' : item.color === 'amber' ? '🟡' : '🟢'}
                </span>
                <span className="w-16 shrink-0 text-slate-700">{item.symptom}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${
                      item.color === 'red'
                        ? 'bg-red-500'
                        : item.color === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.heat}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-slate-400">热度 {item.heat}</span>
              </div>
            ))}
          </div>
          {onOpenEpidemicDashboard && (
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={onOpenEpidemicDashboard}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                查看完整预警大屏
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3.5 shadow-sm">
          <p className="text-xs font-medium text-slate-600">
            📍 {localCityLabel || trendCity} · 今日社区健康动态
          </p>
          <p className="mt-2 text-sm text-blue-600 font-medium">
            成为首个健康数据贡献者 →
          </p>
        </div>
      )}

      {/* Seasonal surge alert card */}
      {surgeAlert && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <TrendingUp size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                ⚠️ {surgeAlert.symptom} 上升 {surgeAlert.increasePercent}%
              </p>
              <p className="text-xs text-amber-700 mt-1">{surgeAlert.alertText}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {surgeAlert.suggestedMeds.map(med => (
                  <button
                    key={med}
                    onClick={() => {
                      trackMedicationClick({ medicationName: med, source: 'surge_alert' })
                      window.open(buildJDSearchUrl(med), '_blank', 'noopener')
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <ShoppingCart size={10} />
                    备{med}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible section for chips and recent sessions — default collapsed */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowExtras(!showExtras)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronRight size={14} className={`transition-transform ${showExtras ? 'rotate-90' : ''}`} />
          常见问题与最近记录
        </button>
        {showExtras && (
          <div className="mt-3 space-y-4">
            {/* Scenario chips */}
            <div className="flex flex-wrap gap-2">
              {scenarioChips.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onApplyStarterText(item.sendText)}
                  className="rounded-full border border-transparent bg-slate-100 px-3.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-200"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Continue last session */}
            {latestSession && (
              <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm text-slate-600">
                    继续上次问诊：{truncateText(getRecentSessionReference(latestSession) || latestSession.title, 15)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenConversation(latestSession.id)}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                  >
                    继续 →
                  </button>
                </div>
              </div>
            )}

            {/* Recent conversation chips */}
            {recentConversationChips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="w-full text-xs text-slate-400">最近问诊</span>
                {recentConversationChips.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onOpenConversation(session.id)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50"
                  >
                    {truncateText(getRecentSessionReference(session) || session.title, 16)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Focus path cards — hidden for cleaner first impression (preserved) */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        {/* eslint-disable-next-line no-constant-binary-expression */}
        {false && (
        <section className="rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-slate-900">今天先解决什么</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              先走这 3 条高频主路径之一，词条会先写进输入框，你确认后再发。
            </p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {focusPathCards.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onApplyStarterText(item.sendText)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${item.toneClass}`}
                >
                  <div className="inline-flex rounded-xl bg-white/90 p-2 text-slate-700 shadow-sm">
                    <Icon size={16} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    预填问题
                    <ArrowRight size={12} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>
        )}
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-20" />
    </div>
  )
}
