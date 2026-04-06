import {
  Baby,
  Brain,
  HeartPulse,
  LogIn,
  MessageCircle,
  ShieldPlus,
  Thermometer,
  UserRound,
} from 'lucide-react'
import type { ConversationSession } from '../types'
import { ConversationHistoryPanel } from './ConversationHistoryPanel'
import { SymptomTags } from './SymptomTags'

interface WelcomeScreenProps {
  onSendMessage: (text: string) => void
  onToggleMap: () => void
  onOpenWorkspace: () => void
  onOpenAuth: () => void
  sessionEmail?: string | null
  recentSessions: ConversationSession[]
  activeSessionId?: string | null
  onOpenConversation: (sessionId: string) => void
}

const COMMON_SCENARIOS = [
  { label: '发烧了不知道严不严重', sendText: '我发烧了，不知道严不严重', icon: Thermometer },
  { label: '头痛持续三天要去医院吗', sendText: '我头痛已经持续三天了', icon: Brain },
  { label: '孩子咳嗽该去哪里看', sendText: '我的孩子一直在咳嗽', icon: Baby },
] as const

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
  onOpenWorkspace,
  onOpenAuth,
  sessionEmail,
  recentSessions,
  activeSessionId,
  onOpenConversation,
}: WelcomeScreenProps) {
  const hasRecentSessions = recentSessions.length > 0
  const isSignedIn = Boolean(sessionEmail)

  return (
    <div className="w-full py-5">
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            无需登录，直接开始症状自查
          </div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            先描述不适，再决定下一步
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            适合发热、咳嗽、头痛、腹痛、乏力等常见情况。系统会继续追问，并给出风险等级、建议科室与附近医院参考。
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => onSendMessage('我想做一次症状自查，请按标准流程开始问我第一个问题。')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <MessageCircle size={16} />
              立即开始
            </button>
            <button
              onClick={isSignedIn ? onOpenWorkspace : onOpenAuth}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-100"
            >
              <LogIn size={16} />
              {isSignedIn ? '打开记录与档案' : '登录 / 注册'}
            </button>
            <button
              onClick={onToggleMap}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              健康地图
            </button>
          </div>

          {hasRecentSessions && (
            <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3">
              <p className="text-xs font-semibold text-cyan-800">
                最近 {recentSessions.length} 段问诊已保留
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-cyan-700">
                桌面端可在左侧继续最近线程；手机端会在下方展示最近对话，方便下次直接接着问。
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">常见问题</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {COMMON_SCENARIOS.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => onSendMessage(item.sendText)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-3 text-left transition-all duration-200 hover:border-blue-300 hover:bg-slate-50"
                  >
                    <Icon size={18} className="mb-2 text-blue-400" />
                    <p className="text-xs font-medium leading-snug text-slate-700">{item.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">按人群快速开始</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GUARDIAN_MODES.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.label}
                    onClick={() => onSendMessage(mode.sendText)}
                    className={`rounded-2xl border px-3 py-3 text-left transition-all hover:shadow-sm ${mode.className}`}
                  >
                    <Icon size={16} className="mb-2" />
                    <p className="text-xs font-semibold">{mode.label}</p>
                    <p className="mt-1 text-[11px] opacity-80">{mode.subtitle}</p>
                  </button>
                )
              })}
            </div>
            <p className="mb-2 mt-3 text-xs text-slate-400">更多常见症状</p>
            <SymptomTags onSelect={onSendMessage} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-cyan-50 p-2 text-cyan-600">
                <ShieldPlus size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">记录与档案会长期保留</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  登录后可以保存基础档案、同步历史记录，并在不同设备继续上次问诊，不影响游客直接使用。
                </p>
                <p className="mt-2 text-[11px] text-cyan-700">
                  先补齐年龄、常住城市和慢病信息，系统后续会更少重复追问。
                </p>
              </div>
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
