import { Activity, ArrowRight, Baby, Brain, MessageCircle, Thermometer } from 'lucide-react'
import { SymptomTags } from './SymptomTags'
import { getCityOverview } from '../lib/epidemicDataEngine'

interface WelcomeScreenProps {
  onSendMessage: (text: string) => void
  onToggleMap: () => void
}

const SCENARIOS = [
  { label: '发烧了不知道严不严重', sendText: '我发烧了，不知道严不严重', icon: Thermometer },
  { label: '头痛持续三天要去医院吗', sendText: '我头痛已经持续三天了', icon: Brain },
  { label: '孩子咳嗽该去哪里看', sendText: '我的孩子一直在咳嗽', icon: Baby },
] as const

export function WelcomeScreen({ onSendMessage, onToggleMap }: WelcomeScreenProps) {
  const overview = getCityOverview()

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* 顶部 Hero */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <MessageCircle size={24} className="text-blue-500" />
          </div>
          <ArrowRight size={20} className="text-slate-300" />
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <Activity size={24} className="text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">症状自查 × 疾病预警</h1>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          个人问诊获得就医建议，数据汇聚成公共卫生预警信号
        </p>
      </div>

      {/* 价值主张两列卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <MessageCircle size={20} className="text-blue-500" />
          <p className="font-semibold text-blue-800 text-sm mt-2">智能问诊</p>
          <p className="text-blue-600 text-xs mt-1 leading-relaxed">
            描述症状，AI 追问，获得就医等级建议
          </p>
          <span className="bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-0.5 inline-block mt-3">
            个人使用 · 免费
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <Activity size={20} className="text-emerald-500" />
          <p className="font-semibold text-emerald-800 text-sm mt-2">疾病预警</p>
          <p className="text-emerald-600 text-xs mt-1 leading-relaxed">
            购药行为监测，提前 5-7 天发现疫情苗头
          </p>
          <span className="bg-emerald-100 text-emerald-600 text-xs rounded-full px-2 py-0.5 inline-block mt-3">
            面向公共卫生机构
          </span>
        </div>
      </div>

      {/* 实时数据条 */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-4 mb-4">
        <div className="flex items-center flex-shrink-0">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
          <span className="text-slate-500 text-xs">实时监测中</span>
        </div>
        <span className="text-slate-300 text-xs">|</span>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 text-xs">今日上报 {overview.totalReports} 人</span>
          <span className="text-slate-300 text-xs">|</span>
          <span className="text-orange-500 text-xs font-medium">预警 {overview.alertDistricts} 区</span>
          <span className="text-slate-300 text-xs">|</span>
          <span className="text-slate-600 text-xs">主要：{overview.dominantSymptom}</span>
        </div>
        <button
          onClick={onToggleMap}
          className="ml-auto bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
        >
          查看疾病地图 →
        </button>
      </div>

      {/* 快速开始 */}
      <p className="text-slate-400 text-xs mb-2">立即开始问诊</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {SCENARIOS.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              onClick={() => onSendMessage(s.sendText)}
              className="bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Icon size={18} className="text-blue-400 mb-2" />
              <p className="text-slate-700 text-xs font-medium leading-snug">{s.label}</p>
            </button>
          )
        })}
      </div>

      <SymptomTags onSelect={onSendMessage} />
    </div>
  )
}
