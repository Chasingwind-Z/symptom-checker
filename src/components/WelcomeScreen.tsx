import { Baby, HeartPulse, LogIn, MessageCircle, ShieldPlus, UserRound } from 'lucide-react'
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData'
import { maskEmail } from '../lib/supabase'
import type { ConversationSession } from '../types'
import { ConversationHistoryPanel } from './ConversationHistoryPanel'

type WelcomeProfileContext = Pick<
  ProfileDraft,
  'city' | 'careFocus' | 'chronicConditions' | 'allergies' | 'currentMedications'
>

interface ScenarioChip {
  label: string
  sendText: string
}

interface WelcomeScreenProps {
  onSendMessage: (text: string) => void
  onToggleMap: () => void
  onOpenWorkspace: () => void
  sessionEmail?: string | null
  canOpenAuth?: boolean
  onOpenAuth?: () => void
  authActionLabel?: string
  profile?: WelcomeProfileContext | null
  recentCases?: CaseHistoryItem[]
  recentSessions: ConversationSession[]
  activeSessionId?: string | null
  onOpenConversation: (sessionId: string) => void
}

const COMMON_SCENARIOS: ScenarioChip[] = [
  { label: '发烧了不知道严不严重', sendText: '我发烧了，不知道严不严重' },
  { label: '头痛持续三天要去医院吗', sendText: '我头痛已经持续三天了' },
  { label: '孩子咳嗽该去哪里看', sendText: '我的孩子一直在咳嗽' },
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
    label: '本人',
    subtitle: '标准问诊',
    sendText: '我想咨询自己的身体不适，请按标准问诊流程开始。',
    icon: UserRound,
    className: 'bg-white text-blue-700 border-blue-100 hover:bg-blue-50',
  },
  {
    label: '儿童守护',
    subtitle: '儿科优先',
    sendText: '这是孩子的情况，请按儿童模式帮我问诊并优先考虑儿科建议。',
    icon: Baby,
    className: 'bg-white text-amber-700 border-amber-100 hover:bg-amber-50',
  },
  {
    label: '老人守护',
    subtitle: '高风险优先',
    sendText: '这是家里老人的情况，请按老年人高风险模式帮我问诊。',
    icon: ShieldPlus,
    className: 'bg-white text-violet-700 border-violet-100 hover:bg-violet-50',
  },
  {
    label: '慢病守护',
    subtitle: '基础病叠加',
    sendText: '我有高血压/糖尿病等慢性病，请按慢病患者模式帮我问诊。',
    icon: HeartPulse,
    className: 'bg-white text-rose-700 border-rose-100 hover:bg-rose-50',
  },
] as const

export function WelcomeScreen({
  onSendMessage,
  onToggleMap,
  sessionEmail,
  canOpenAuth,
  onOpenAuth,
  authActionLabel,
  profile,
  recentCases = [],
  recentSessions,
  activeSessionId,
  onOpenConversation,
}: WelcomeScreenProps) {
  const personalizedScenarios = buildPersonalizedScenarios({
    profile,
    recentCases,
    recentSessions,
  })
  const canOpenAuthEntry = canOpenAuth !== false && Boolean(onOpenAuth)
  const maskedSessionEmail = sessionEmail ? maskEmail(sessionEmail) : ''
  const scenarioChips =
    personalizedScenarios.length === 0
      ? COMMON_SCENARIOS
      : personalizedScenarios.length < MIN_SCENARIO_CHIP_COUNT
        ? [...personalizedScenarios, ...COMMON_SCENARIOS].slice(0, MIN_SCENARIO_CHIP_COUNT)
        : personalizedScenarios.slice(0, MAX_PERSONALIZED_CHIP_COUNT)
  const hasPersonalizedScenarios = personalizedScenarios.length > 0

  return (
    <div className="w-full py-5">
      <div className="space-y-3">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            <span className={`h-1.5 w-1.5 rounded-full ${sessionEmail ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            {sessionEmail ? `已同步 · ${maskedSessionEmail}` : '无需登录，直接开始症状自查'}
          </div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            先描述不适，再决定下一步
          </h1>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              onClick={() => onSendMessage('我想做一次症状自查，请按标准流程开始问我第一个问题。')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <MessageCircle size={16} />
              立即开始
            </button>
            {canOpenAuthEntry && !sessionEmail && (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-100"
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
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            {hasPersonalizedScenarios && (
              <p className="text-xs text-slate-500">
                已优先参考你保存的档案和近期记录；不符合的话，也可以直接描述这次不适。
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {scenarioChips.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onSendMessage(item.sendText)}
                  className="rounded-full border px-4 py-2 text-xs text-slate-700 transition-colors hover:border-blue-300 hover:bg-slate-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GUARDIAN_MODES.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.label}
                    onClick={() => onSendMessage(mode.sendText)}
                    className={`rounded-2xl border px-3 py-2 text-left transition-all hover:shadow-sm ${mode.className}`}
                  >
                    <Icon size={16} className="mb-2" />
                    <p className="text-xs font-semibold">{mode.label}</p>
                    <p className="mt-1 text-[11px] opacity-80">{mode.subtitle}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <ConversationHistoryPanel
            sessions={recentSessions}
            activeSessionId={activeSessionId}
            onOpenSession={onOpenConversation}
            title="最近对话"
            description="手机端也能在这里继续之前的问诊线程。"
            maxItems={5}
            showStartButton={false}
            emptyMessage="完成第一次问诊后，最近对话会出现在这里。下次回来时可以直接继续，不必重新描述全部症状。"
          />
        </div>
      </div>
    </div>
  )
}
