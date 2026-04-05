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

export function WelcomeScreen({ onSendMessage, onToggleMap }: WelcomeScreenProps) {
  const overview = getCityOverview()

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* 顶部 Hero */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-600 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          2~3 分钟完成一次症状自查
        </div>
        <h1 className="text-2xl font-bold text-slate-800">症状自查 × 疾病预警</h1>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          从个人问诊到城市级监测，帮助你更快判断是否该就医，也让异常趋势被更早发现。
        </p>
      </div>

      {/* 价值主张两列卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white/90 border border-slate-200 rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <MessageCircle size={18} className="text-blue-500" />
          </div>
          <p className="font-semibold text-slate-800 text-sm mt-3">智能问诊</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            描述症状，AI 追问，获得就医等级建议
          </p>
          <span className="bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5 inline-block mt-3">
            个人使用 · 免费
          </span>
        </div>

        <div className="bg-white/90 border border-slate-200 rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Activity size={18} className="text-emerald-500" />
          </div>
          <p className="font-semibold text-slate-800 text-sm mt-3">疾病预警</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            购药行为监测，提前 5-7 天发现疫情苗头
          </p>
          <span className="bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5 inline-block mt-3">
            面向公共卫生机构
          </span>
        </div>
      </div>

      {/* 实时数据条 */}
      <div className="bg-white/90 border border-slate-200 rounded-2xl px-4 py-3 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center flex-shrink-0">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
              <span className="text-slate-500 text-xs">实时监测中</span>
            </div>
            <span className="text-slate-300 text-xs hidden sm:inline">|</span>
            <span className="text-slate-600 text-xs">今日上报 {overview.totalReports} 人</span>
            <span className="text-slate-300 text-xs hidden sm:inline">|</span>
            <span className="text-orange-500 text-xs font-medium">预警 {overview.alertDistricts} 区</span>
            <span className="text-slate-300 text-xs hidden sm:inline">|</span>
            <span className="text-slate-600 text-xs">主要：{overview.dominantSymptom}</span>
          </div>
          <button
            onClick={onToggleMap}
            className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
          >
            查看疾病地图 →
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <p className="text-slate-800 text-sm font-semibold">家庭守护模式</p>
            <p className="text-slate-500 text-xs mt-1">针对本人、儿童、老人、慢病人群快速进入对应问诊策略</p>
          </div>
          <span className="text-[11px] text-slate-400">按人群快速切换</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <p className="text-slate-800 text-sm font-semibold">开始一次症状自查</p>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              从常见不适开始，系统会继续追问并给出就医级别、挂号方向与附近医院建议。
            </p>
          </div>
          <span className="text-[11px] text-slate-500 rounded-full bg-slate-50 px-2.5 py-1 border border-slate-200">
            日常使用
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {CARE_FLOW.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${item.iconClass}`}>
                  <Icon size={16} />
                </div>
                <p className="text-slate-800 text-xs font-semibold">{item.title}</p>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{item.description}</p>
              </div>
            )
          })}
        </div>

        <p className="text-slate-400 text-xs mb-2">常见症状入口</p>
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
          <p className="text-slate-400 text-xs mb-2">更多常见症状</p>
          <SymptomTags onSelect={onSendMessage} />
        </div>
      </div>
    </div>
  )
}
