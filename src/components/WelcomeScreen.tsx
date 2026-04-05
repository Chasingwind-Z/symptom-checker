import {
  Activity,
  Baby,
  Brain,
  HeartPulse,
  MessageCircle,
  ShieldPlus,
  Thermometer,
  UserRound,
} from 'lucide-react'
import { SymptomTags } from './SymptomTags'
import { getCityOverview } from '../lib/epidemicDataEngine'

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

const CARE_FLOW = [
  {
    title: '描述不适',
    description: '可直接输入症状，也能从常见问题快速开始',
    icon: MessageCircle,
    iconClass: 'bg-blue-50 text-blue-600',
  },
  {
    title: '匹配对象',
    description: '儿童、老人、慢病用户可切换对应守护模式',
    icon: ShieldPlus,
    iconClass: 'bg-violet-50 text-violet-600',
  },
  {
    title: '获得建议',
    description: '查看分诊等级、挂号方向与附近医院推荐',
    icon: Activity,
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
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
  const overview = getCityOverview()

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          游客可直接使用 · 2~3 分钟完成一次自查
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          先描述不适，再决定是否需要尽快就医
        </h1>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-2xl">
          适合发热、咳嗽、头痛、腹痛、乏力等常见情况。系统会按问诊流程继续追问，并给出风险等级、建议科室与附近医院参考。
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={() => onSendMessage('我想做一次症状自查，请按标准流程开始问我第一个问题。')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <MessageCircle size={16} />
            游客开始自查
          </button>
          <button
            onClick={onOpenWorkspace}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ShieldPlus size={16} />
            登录同步档案
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
          {CARE_FLOW.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${item.iconClass}`}>
                  <Icon size={16} />
                </div>
                <p className="text-slate-800 text-xs font-semibold">{item.title}</p>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-3 mb-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <p className="text-slate-800 text-sm font-semibold">开始一次症状自查</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                从常见不适开始，系统会继续追问并给出就医级别、挂号方向与附近医院建议。
              </p>
            </div>
            <span className="text-[11px] text-slate-500 rounded-full bg-slate-50 px-2.5 py-1 border border-slate-200">
              游客也可直接使用
            </span>
          </div>

          <p className="text-slate-400 text-xs mb-2">常见问题</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-slate-400 text-xs mb-2">按人群快速开始</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
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
            <p className="text-slate-400 text-xs mb-2">更多常见症状</p>
            <SymptomTags onSelect={onSendMessage} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldPlus size={16} className="text-cyan-600" />
              <p className="text-sm font-semibold text-slate-800">登录后可同步的内容</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">健康档案</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">历史问诊</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">跨设备查看</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              首次体验可以先以游客方式开始；需要保存档案和近期结果时，再使用邮箱登录即可。
            </p>
            <button
              onClick={onOpenWorkspace}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs text-cyan-700 hover:bg-cyan-100 transition-colors"
            >
              前往我的健康空间
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-300" />
                <p className="text-sm font-semibold">城市健康趋势参考</p>
              </div>
              <span className="text-[10px] text-white/50">更新于 {overview.lastUpdated}</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              结合匿名症状信号与公开资料摘要，帮助你快速查看近期需要关注的方向。
            </p>
            <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-200">
              近期关注：{overview.dominantSymptom}
            </div>
            <button
              onClick={onToggleMap}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white text-slate-900 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 transition-colors"
            >
              查看疾病地图
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
