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
import { SymptomTags } from './SymptomTags'

interface WelcomeScreenProps {
  onSendMessage: (text: string) => void
  onToggleMap: () => void
  onOpenWorkspace: () => void
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

export function WelcomeScreen({ onSendMessage, onToggleMap, onOpenWorkspace }: WelcomeScreenProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          无需登录，直接开始症状自查
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          先描述不适，系统会帮你判断下一步
        </h1>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-2xl">
          适合发热、咳嗽、头痛、腹痛、乏力等常见情况。系统会继续追问，并给出风险等级、建议科室与附近医院参考。
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={() => onSendMessage('我想做一次症状自查，请按标准流程开始问我第一个问题。')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <MessageCircle size={16} />
            立即开始
          </button>
          <button
            onClick={onOpenWorkspace}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition-colors"
          >
            <LogIn size={16} />
            登录 / 健康空间
          </button>
          <button
            onClick={onToggleMap}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            查看疾病地图
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-slate-800 text-sm font-semibold">常见问题</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            {COMMON_SCENARIOS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={() => onSendMessage(item.sendText)}
                  className="bg-white border border-slate-200 rounded-2xl p-3 text-left hover:border-blue-300 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                >
                  <Icon size={18} className="text-blue-400 mb-2" />
                  <p className="text-slate-700 text-xs font-medium leading-snug">{item.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-slate-800 text-sm font-semibold">按人群快速开始</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
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
                  <p className="text-[11px] opacity-80 mt-1">{mode.subtitle}</p>
                </button>
              )
            })}
          </div>
          <p className="text-slate-400 text-xs mt-3 mb-2">更多常见症状</p>
          <SymptomTags onSelect={onSendMessage} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-cyan-50 p-2 text-cyan-600">
              <ShieldPlus size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">登录后可使用健康空间</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                保存档案、同步历史记录、跨设备继续上次问诊，都集中放在空间里，不影响游客直接使用。
              </p>
              <p className="text-[11px] text-cyan-700 mt-2">
                也可以先载入虚拟体验画像，直接查看个性化推荐和随访效果。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
