import { Baby, CheckCircle2, HeartPulse, LogIn, ShieldPlus, UserRound } from 'lucide-react'
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData'
import { maskEmail } from '../lib/supabase'
import type { ConversationSession } from '../types'
import {
  getConsultationModePreset,
  type ConsultationModeId,
} from '../lib/consultationModes'

type WelcomeProfileContext = Pick<
  ProfileDraft,
  'city' | 'careFocus' | 'chronicConditions' | 'allergies' | 'currentMedications'
>

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
  onOpenWorkspace: () => void
  sessionEmail?: string | null
  canOpenAuth?: boolean
  onOpenAuth?: () => void
  authActionLabel?: string
  profile?: WelcomeProfileContext | null
  recentCases?: CaseHistoryItem[]
  recentSessions: ConversationSession[]
  onOpenConversation: (sessionId: string) => void
}

const COMMON_SCENARIOS: ScenarioChip[] = [
  { label: '发烧 38.5℃，要不要去医院', sendText: '发烧 38.5℃，要不要去医院' },
  { label: '咳嗽三天，晚上更重', sendText: '咳嗽三天，晚上更重' },
  { label: '先把过敏史和现在用药说清楚', sendText: '先把过敏史和现在用药说清楚' },
]

const DEFAULT_PROFILE_CITY = '中国大陆'
const MIN_SCENARIO_CHIP_COUNT = 3
const MAX_PERSONALIZED_CHIP_COUNT = 4

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
  profile?: WelcomeProfileContext | null
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

const GUARDIAN_MODES = [
  {
    id: 'self' as const,
    label: '本人',
    subtitle: '标准问诊',
    icon: UserRound,
    className: 'bg-white text-blue-700 border-blue-100 hover:bg-blue-50',
    activeClassName: 'border-blue-300 bg-blue-50/80 shadow-sm',
  },
  {
    id: 'child' as const,
    label: '儿童守护',
    subtitle: '儿科优先',
    icon: Baby,
    className: 'bg-white text-amber-700 border-amber-100 hover:bg-amber-50',
    activeClassName: 'border-amber-300 bg-amber-50/80 shadow-sm',
  },
  {
    id: 'elderly' as const,
    label: '老人守护',
    subtitle: '高风险优先',
    icon: ShieldPlus,
    className: 'bg-white text-violet-700 border-violet-100 hover:bg-violet-50',
    activeClassName: 'border-violet-300 bg-violet-50/80 shadow-sm',
  },
  {
    id: 'chronic' as const,
    label: '慢病守护',
    subtitle: '基础病叠加',
    icon: HeartPulse,
    className: 'bg-white text-rose-700 border-rose-100 hover:bg-rose-50',
    activeClassName: 'border-rose-300 bg-rose-50/80 shadow-sm',
  },
] as const

export function WelcomeScreen({
  onStartConsultation,
  onApplyStarterText,
  selectedModeId,
  onSelectMode,
  onToggleMap,
  sessionEmail,
  canOpenAuth,
  onOpenAuth,
  authActionLabel,
  profile,
  recentCases = [],
  recentSessions,
  onOpenConversation,
}: WelcomeScreenProps) {
  const personalizedScenarios = buildPersonalizedScenarios({
    profile,
    recentCases,
    recentSessions,
  })
  const canOpenAuthEntry = canOpenAuth !== false && Boolean(onOpenAuth)
  const maskedSessionEmail = sessionEmail ? maskEmail(sessionEmail) : ''
  const selectedMode = getConsultationModePreset(selectedModeId)
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
  const hasPersonalizedScenarios = personalizedScenarios.length > 0
  const recentConversationChips = recentSessions.slice(0, 3)

  return (
    <div className="w-full py-6 sm:py-7">
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white/95 px-5 pb-5 pt-4 shadow-sm">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            <span className={`h-1.5 w-1.5 rounded-full ${sessionEmail ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            {sessionEmail ? `已同步 · ${maskedSessionEmail}` : '无需登录，也可先开始咨询'}
          </div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            今天哪里不舒服？
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            先选一种咨询方式，我会按对应人群更谨慎地问你；真正开始前，不会替你自动发消息。
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              onClick={onStartConsultation}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <CheckCircle2 size={16} />
              开始咨询
            </button>
            {canOpenAuthEntry && !sessionEmail && (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-2 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              >
                <LogIn size={16} />
                {authActionLabel ?? '登录 / 注册'}
              </button>
            )}
            {onOpenAuth && sessionEmail && (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
              >
                {authActionLabel ?? '管理账号'}
              </button>
            )}
            <button
              onClick={onToggleMap}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              健康地图
            </button>
          </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">先选 AI 咨询模式</p>
                  <p className="mt-1 text-xs text-slate-500">
                    模式只决定问诊策略与推荐入口，不会自动替你开始发问。
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GUARDIAN_MODES.map((mode) => {
                  const Icon = mode.icon
                  const isSelected = selectedModeId === mode.id
                  return (
                    <button
                      key={mode.id}
                      onClick={() => onSelectMode(mode.id)}
                      className={`rounded-2xl border px-3 py-3 text-left transition-all hover:shadow-sm ${
                        isSelected ? mode.activeClassName : mode.className
                      }`}
                    >
                      <Icon size={16} className="mb-2" />
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold">{mode.label}</p>
                        {isSelected && <CheckCircle2 size={13} />}
                      </div>
                      <p className="mt-1 text-[11px] opacity-80">{mode.subtitle}</p>
                    </button>
                  )
                })}
              </div>
              {selectedMode && (
                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        已切换到 {selectedMode.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {selectedMode.summary} 下方词条会先写入输入框，你确认后再发送。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs leading-relaxed text-slate-500">
              支持文字、语音和图片辅助；药盒、报告和皮疹图片会先做谨慎说明，不会直接当作诊断结论。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            {(hasPersonalizedScenarios || selectedMode) && (
              <p className="text-xs text-slate-500">
                {selectedMode
                  ? `已按 ${selectedMode.label} 模式换了一组更贴近的起步词条；点击后会先写入输入框。`
                  : '这些入口已结合你保存的档案和近期记录；点击后会先写入输入框，不会直接发送。'}
              </p>
            )}
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
          </div>

          {recentConversationChips.length > 0 && (
            <div className="lg:hidden rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">继续最近问诊</p>
                  <p className="mt-1 text-xs text-slate-500">
                    手机端先保留最常继续的 3 条线程入口，不再堆一整块历史面板。
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  {recentSessions.length} 段
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
