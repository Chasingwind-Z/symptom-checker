import { useEffect, useRef, useState, useMemo } from 'react'
import { Activity, AlertOctagon, AlertTriangle, ArrowLeft, BarChart2, Bot, Map, TrendingUp } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js'
import {
  getCityOverview,
  getDistrictRiskData,
  getDrugTrendData,
  getAIWarningText,
  mergeLocalReports,
} from '../lib/epidemicDataEngine'
import { OfficialSourceComparison } from './OfficialSourceComparison'
import * as officialSourceHelpers from '../lib/officialSources'
import type { DistrictRiskData } from '../lib/epidemicDataEngine'
import type { OfficialSourceBundle } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler)

interface Props {
  onBack: () => void
}

const getRiskColor = (level: string) =>
  ({ low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' }[level] ?? '#10B981')

const getRiskLabel = (level: DistrictRiskData['riskLevel']) =>
  ({ low: '低风险', medium: '中风险', high: '高风险', critical: '紧急关注' }[level])

const getTrendLabel = (trend: DistrictRiskData['trend']) =>
  ({ up: '持续上升', stable: '高位平稳', down: '回落观察' }[trend])

const formatTrendDelta = (trend: DistrictRiskData['trend'], percent: number) =>
  trend === 'down' ? `-${percent}%` : trend === 'stable' ? `±${Math.max(2, Math.round(percent * 0.4))}%` : `+${percent}%`

const FALLBACK_DASHBOARD_SOURCES = {
  records: [],
  syncStatus: {
    state: 'idle',
    mode: 'seeded-local',
    freshness: 'seeded',
    sourceLabel: '官方公开资料',
    summary: '当前展示内置公开资料摘要。',
    note: '如云端资料暂不可用，会先回退到本地整理的公开信息。',
    lastSyncTime: '',
    latestRecordTime: '',
    fallbackActive: true,
    configured: false,
    fetchedAt: Date.now(),
  },
} satisfies OfficialSourceBundle

const useDashboardOfficialSourcesSafe =
  typeof officialSourceHelpers.useDashboardOfficialSources === 'function'
    ? officialSourceHelpers.useDashboardOfficialSources
    : () => FALLBACK_DASHBOARD_SOURCES

export function EpidemicDashboard({ onBack }: Props) {
  const mapKey = (import.meta.env.VITE_AMAP_JS_KEY as string | undefined)?.trim() ?? ''
  const [currentTime, setCurrentTime] = useState<string>('')
  const cityOverview = useMemo(() => getCityOverview(), [])
  const districtData = useMemo<DistrictRiskData[]>(() => mergeLocalReports(getDistrictRiskData()), [])
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'fallback'>(
    mapKey ? 'loading' : 'fallback'
  )
  const [mapNote, setMapNote] = useState(
    mapKey ? '正在载入热力图…' : '当前未配置地图 Key，已自动切换为趋势参考视图。'
  )
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circlesRef = useRef<any[]>([])

  // 时钟
  useEffect(() => {
    const fmt = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setCurrentTime(`${hh}:${mm}:${ss}`)
    }
    fmt()
    const timer = setInterval(fmt, 1000)
    return () => clearInterval(timer)
  }, [])

  // 绘制地图覆盖物
  useEffect(() => {
    if (districtData.length === 0) return

    const initMap = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!mapContainerRef.current || !(window as any).AMap) return

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap

        circlesRef.current.forEach(c => c.setMap?.(null))
        circlesRef.current = []

        if (!mapRef.current) {
          mapRef.current = new AMap.Map(mapContainerRef.current, {
            zoom: 10,
            center: [116.3974, 39.9093],
            mapStyle: 'amap://styles/dark',
          })
        }

        const map = mapRef.current

        districtData.forEach(district => {
          const color = getRiskColor(district.riskLevel)

          const circle = new AMap.Circle({
            center: district.center,
            radius: 4500,
            fillColor: color,
            fillOpacity: district.riskLevel === 'critical' ? 0.5 : 0.3,
            strokeColor: color,
            strokeWeight: 2,
            strokeOpacity: 0.8,
          })
          circle.setMap(map)
          circle.on('click', () => setSelectedDistrict(district.district))
          circlesRef.current.push(circle)

          if (district.riskLevel === 'critical') {
            const outerCircle = new AMap.Circle({
              center: district.center,
              radius: 6500,
              fillColor: color,
              fillOpacity: 0.1,
              strokeColor: color,
              strokeWeight: 1,
              strokeOpacity: 0.3,
            })
            outerCircle.setMap(map)
            circlesRef.current.push(outerCircle)
          }

          const text = new AMap.Text({
            text: district.district.replace('区', ''),
            position: district.center,
            style: {
              'background-color': 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              'font-size': '12px',
              'font-weight': '500',
            },
          })
          text.setMap(map)
          circlesRef.current.push(text)
        })

        setMapStatus('ready')
      } catch {
        setMapStatus('fallback')
        setMapNote('地图暂时无法渲染，已自动切换为趋势参考视图。')
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).AMap) {
      initMap()
    } else {
      const key = mapKey
      const securityKey = import.meta.env.VITE_AMAP_JS_SECURITY_KEY as string
      if (!key) {
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any)._AMapSecurityConfig = { securityJsCode: securityKey }

      const existing = document.getElementById('amap-script')
      if (existing) {
        existing.addEventListener('load', initMap)
        existing.addEventListener('error', () => {
          setMapStatus('fallback')
          setMapNote('地图资源加载失败，已切换为趋势参考视图。')
        })
      } else {
        const script = document.createElement('script')
        script.id = 'amap-script'
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
        script.onload = initMap
        script.onerror = () => {
          setMapStatus('fallback')
          setMapNote('地图资源加载失败，已切换为趋势参考视图。')
        }
        document.head.appendChild(script)
      }
    }

    return () => {
      circlesRef.current.forEach(c => c.setMap?.(null))
      circlesRef.current = []
    }
  }, [districtData, mapKey])

  // 卸载时销毁地图
  useEffect(() => {
    return () => {
      circlesRef.current.forEach(c => c.setMap?.(null))
      mapRef.current?.destroy?.()
    }
  }, [])

  const sortedDistricts = [...districtData].sort((a, b) => b.riskScore - a.riskScore)
  const activeDistrictName = selectedDistrict ?? sortedDistricts[0]?.district ?? null
  const activeDistrict = activeDistrictName
    ? districtData.find(district => district.district === activeDistrictName) ?? null
    : null
  const trendData = activeDistrictName ? getDrugTrendData(activeDistrictName) : null
  const warningText = districtData.length > 0 ? getAIWarningText(districtData) : ''
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const focusDistrict = sortedDistricts[0] ?? null
  const { records: dashboardSources, syncStatus: dashboardSyncStatus } = useDashboardOfficialSourcesSafe(
    activeDistrict?.topSymptoms ?? focusDistrict?.topSymptoms ?? []
  )
  const breakdownItems = activeDistrict
    ? [
        {
          label: '症状上报',
          value: activeDistrict.riskBreakdown.symptomReports,
          color: '#38BDF8',
          description: '来自匿名问诊与购药热度的核心信号',
        },
        {
          label: '趋势变化',
          value: activeDistrict.riskBreakdown.trendChange,
          color: '#A78BFA',
          description: '观察近 7 日曲线是否持续抬升',
        },
        {
          label: '环境因素',
          value: activeDistrict.riskBreakdown.environment,
          color: '#34D399',
          description: '天气与通勤等外部因素参考',
        },
        {
          label: '最近回访',
          value: activeDistrict.riskBreakdown.followUp,
          color: '#F59E0B',
          description: '结合近期复测与回访提醒进行加权',
        },
      ]
    : []
  const hotspotSummary = sortedDistricts.slice(0, 3)
  const recentAlerts = sortedDistricts
    .filter(district => district.riskLevel !== 'low')
    .slice(0, 4)
    .map((district, index) => ({
      district: district.district,
      time: `${String(8 + index * 3).padStart(2, '0')}:${index % 2 === 0 ? '20' : '50'}`,
      levelLabel:
        district.riskLevel === 'critical'
          ? '升级核查'
          : district.riskLevel === 'high'
          ? '重点回看'
          : '例行观察',
      detail: district.alertReasons[0] ?? `${district.topSymptoms.slice(0, 2).join('、')}相关信号波动`,
    }))
  const signalDistrict = activeDistrict ?? focusDistrict
  const trendSignalItems = signalDistrict
    ? [
        {
          label: '搜索热度',
          value: 100 + signalDistrict.trendPercent * 2 + Math.round(signalDistrict.riskScore / 3),
          delta:
            signalDistrict.trend === 'down'
              ? `-${Math.max(3, Math.round(signalDistrict.trendPercent * 0.45))}%`
              : `+${Math.max(4, Math.round(signalDistrict.trendPercent * 0.8))}%`,
          note: `关键词：${signalDistrict.topSymptoms.slice(0, 2).join(' / ')}`,
        },
        {
          label: '舆情提及',
          value: 40 + Math.round(signalDistrict.totalReports * 0.35),
          delta:
            signalDistrict.trend === 'down'
              ? '热度回落'
              : signalDistrict.trend === 'stable'
              ? '高位持平'
              : '讨论升温',
          note: `${signalDistrict.district}通勤圈、社区群反馈较集中`,
        },
        {
          label: '药店咨询',
          value: 20 + Math.round((signalDistrict.feverDrugIndex + signalDistrict.coughDrugIndex) / 4),
          delta: `${Math.round((signalDistrict.feverDrugIndex + signalDistrict.coughDrugIndex) / 2)} 指数`,
          note: '夜间退烧/止咳咨询占比近期上升',
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse mr-3 flex-shrink-0" />
          <span className="text-white font-bold text-xl">城市健康趋势参考</span>
          <span className="text-white/40 text-xs ml-4 tracking-widest hidden md:block">
            公共健康趋势 · 官方公开资料 + 匿名信号
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm font-mono">{currentTime}</span>
          <span className="bg-white/10 text-white/50 text-xs px-3 py-1 rounded-full">
            低样本阶段 · 官方摘要 + 季节/天气 + 匿名样本估计
          </span>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-white/60 hover:text-white text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            返回问诊
          </button>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
        {/* 统计卡片区 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{cityOverview.totalReports}</p>
                <p className="text-white/50 text-xs mt-1">近 24 小时症状参考信号</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Activity size={18} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-400">{cityOverview.alertDistricts}</p>
                <p className="text-white/50 text-xs mt-1">近期关注区域</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-orange-400" />
              </div>
            </div>
          </div>

          <div className={`bg-white/5 border rounded-2xl p-4 hover:bg-white/10 transition-colors ${cityOverview.criticalDistricts > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-red-400">{cityOverview.criticalDistricts}</p>
                <p className="text-white/50 text-xs mt-1">重点留意区域</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertOctagon size={18} className="text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-bold text-white">{cityOverview.dominantSymptom}</p>
                <p className="text-white/50 text-xs mt-1">近期高频症状</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {focusDistrict && (
          <div className="mb-4 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent px-4 py-3 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-amber-100 text-sm font-semibold">近期关注</span>
                  <span className="bg-amber-400/15 text-amber-200 text-[11px] px-2 py-0.5 rounded-full">
                    {focusDistrict.district}
                  </span>
                  <span className="text-white/35 text-[11px]">
                    风险分 {Math.round(focusDistrict.riskScore)} · {getRiskLabel(focusDistrict.riskLevel)}
                  </span>
                </div>
                <p className="text-white/75 text-xs mt-1 leading-relaxed">
                  近 7 日{focusDistrict.topSymptoms.slice(0, 2).join('、')}相关匿名信号持续抬升，
                  当前主要由症状上报 {focusDistrict.riskBreakdown.symptomReports} 分和趋势变化{' '}
                  {focusDistrict.riskBreakdown.trendChange} 分驱动，建议优先关注社区问诊与接诊资源分配。
                </p>
              </div>
            </div>
            <div className="hidden xl:flex items-center gap-2 flex-wrap justify-end">
              <span className="bg-white/8 border border-white/10 text-white/65 text-[11px] px-2.5 py-1 rounded-full">
                当前口径：透明估计模型
              </span>
              {focusDistrict.alertReasons.slice(0, 2).map(reason => (
                <span
                  key={reason}
                  className="bg-white/8 border border-white/10 text-white/65 text-[11px] px-2.5 py-1 rounded-full"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 主体内容区 */}
        <div className="flex-1 grid grid-cols-5 gap-6 min-h-0">
          {/* 左侧地图区 */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Map size={16} className="text-white/60" />
                  <span className="text-white font-medium text-sm">各区风险热力分布</span>
                  <span className="text-white/30 text-[11px] hidden md:inline">点击区域查看解释卡</span>
                  {activeDistrict && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        color: getRiskColor(activeDistrict.riskLevel),
                        background: `${getRiskColor(activeDistrict.riskLevel)}18`,
                        borderColor: `${getRiskColor(activeDistrict.riskLevel)}33`,
                      }}
                    >
                      当前聚焦：{activeDistrict.district}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {[
                    { color: '#10B981', label: '低风险' },
                    { color: '#F59E0B', label: '中风险' },
                    { color: '#F97316', label: '高风险' },
                    { color: '#EF4444', label: '紧急' },
                    { color: '#67E8F9', label: '低样本估计' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-white/40 text-xs">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative flex-1 min-h-[360px]">
                <div ref={mapContainerRef} className="h-full w-full min-h-[360px]" />
                {mapStatus !== 'ready' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/65 px-5 text-center">
                    <div className="max-w-sm rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4">
                      <p className="text-sm font-semibold text-white">
                        {mapStatus === 'loading' ? '正在载入区域热力图' : '已切换为趋势参考视图'}
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-white/65">{mapNote}</p>
                      {focusDistrict && (
                        <p className="mt-3 text-[11px] leading-relaxed text-cyan-200">
                          当前重点关注 {focusDistrict.district}，高频症状为
                          {focusDistrict.topSymptoms.slice(0, 2).join('、')}。
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {focusDistrict && (
                  <div className="absolute left-4 bottom-4 max-w-xs rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur px-3 py-2.5 shadow-2xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/85 text-xs font-medium">热点摘要</span>
                      <span className="text-[10px] text-white/40">Top 1 区域</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{focusDistrict.district}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          color: getRiskColor(focusDistrict.riskLevel),
                          background: `${getRiskColor(focusDistrict.riskLevel)}18`,
                        }}
                      >
                        {getRiskLabel(focusDistrict.riskLevel)}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/65 mt-1 leading-relaxed">
                      {focusDistrict.topSymptoms.slice(0, 2).join('、')}主导，趋势{formatTrendDelta(focusDistrict.trend, focusDistrict.trendPercent)}，
                      当前为低样本阶段趋势估计，适合联动下方信号卡和官方资料做交叉验证。
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-300" />
                  <span className="text-white font-medium text-sm">热点区域摘要</span>
                </div>
                <div className="space-y-2.5">
                  {hotspotSummary.map((district, index) => (
                    <div key={district.district} className="rounded-xl bg-slate-950/45 border border-white/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/35">#{index + 1}</span>
                          <span className="text-white/85 text-sm">{district.district}</span>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ color: getRiskColor(district.riskLevel), background: `${getRiskColor(district.riskLevel)}18` }}
                        >
                          {Math.round(district.riskScore)}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1 leading-relaxed">{district.alertReasons[0]}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {district.topSymptoms.slice(0, 2).map(symptom => (
                          <span
                            key={symptom}
                            className="border border-cyan-400/15 bg-cyan-500/10 px-2 py-0.5 rounded-full text-[10px] text-cyan-200"
                          >
                            {symptom}
                          </span>
                        ))}
                        <span className="text-[10px] text-white/40">{formatTrendDelta(district.trend, district.trendPercent)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={16} className="text-cyan-300" />
                  <span className="text-white font-medium text-sm">最近预警动态</span>
                </div>
                <div className="space-y-3">
                  {recentAlerts.map(alert => (
                    <div key={`${alert.district}-${alert.time}`} className="flex items-start gap-3">
                      <div className="mt-0.5 flex flex-col items-center">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="w-px h-8 bg-white/10 mt-1" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white/85 text-xs">{alert.district}</span>
                          <span className="text-[10px] text-white/35">{alert.time}</span>
                        </div>
                        <p className="text-[11px] text-cyan-200 mt-1">{alert.levelLabel}</p>
                        <p className="text-[11px] text-white/55 leading-relaxed mt-0.5">{alert.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-950/50 to-blue-950/40 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-300" />
                    <span className="text-white font-medium text-sm">搜索热度 / 舆情信号</span>
                  </div>
                  <span className="bg-cyan-500/15 text-cyan-200 text-[10px] px-2 py-0.5 rounded-full">
                    趋势参考
                  </span>
                </div>
                {signalDistrict && (
                  <p className="text-[11px] text-white/60 leading-relaxed mb-3">
                    以 <span className="text-white/85">{signalDistrict.district}</span> 为当前观察窗口，
                    当前先用官方公开资料、天气季节因子和匿名样本估计来补充趋势参考，后续可继续接入真实搜索与舆情数据源。
                  </p>
                )}
                <div className="space-y-2.5">
                  {trendSignalItems.map(item => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white/75 text-xs">{item.label}</span>
                        <span className="text-cyan-200 text-xs font-semibold">{item.value}</span>
                      </div>
                      <p className="text-[11px] text-cyan-300 mt-1">{item.delta}</p>
                      <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{item.note}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/35 mt-3">
                  注：当前为本地整理样本，用于补充交叉验证，不替代真实互联网趋势源。
                </p>
              </div>
            </div>
          </div>

          {/* 右侧数据面板 */}
          <div className="col-span-2 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
            {/* 区块1：风险排行榜 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-white/60" />
                  <span className="text-white font-medium text-sm">区域风险排行</span>
                </div>
                <span className="text-white/30 text-[11px]">点击区域查看明细</span>
              </div>
              {sortedDistricts.map((d, i) => (
                <div
                  key={d.district}
                  onClick={() => setSelectedDistrict(d.district)}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                    activeDistrictName === d.district ? 'bg-white/15' : 'hover:bg-white/10'
                  }`}
                >
                  <span className="text-white/30 text-xs w-4">{i + 1}</span>
                  <span className="text-white/80 text-xs flex-1">{d.district}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    d.riskLevel === 'critical'
                      ? 'bg-red-500/20 text-red-400'
                      : d.riskLevel === 'high'
                      ? 'bg-orange-500/20 text-orange-400'
                      : d.riskLevel === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {d.riskLevel === 'critical' ? '紧急' : d.riskLevel === 'high' ? '高' : d.riskLevel === 'medium' ? '中' : '低'}
                  </span>
                  <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${d.riskScore}%`, background: getRiskColor(d.riskLevel) }}
                    />
                  </div>
                  <span className="text-white/40 text-xs w-6 text-right">{Math.round(d.riskScore)}</span>
                </div>
              ))}
            </div>

            {/* 区块2：选中区域解释卡 */}
            {activeDistrict && (
              <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <BarChart2 size={16} className="text-white/60" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{activeDistrict.district} · 风险解释卡</span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          color: getRiskColor(activeDistrict.riskLevel),
                          background: `${getRiskColor(activeDistrict.riskLevel)}20`,
                        }}
                      >
                        {getRiskLabel(activeDistrict.riskLevel)}
                      </span>
                    </div>
                    <p className="text-white/35 text-[11px] mt-1">
                      风险分 = 症状上报 + 趋势变化 + 环境因素 + 最近回访
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-slate-950/40 border border-white/10 p-3">
                    <p className="text-white/40 text-[11px]">综合风险分</p>
                    <p className="text-2xl font-bold text-white mt-1">{Math.round(activeDistrict.riskScore)}</p>
                    <p className="text-xs mt-1" style={{ color: getRiskColor(activeDistrict.riskLevel) }}>
                      {getTrendLabel(activeDistrict.trend)} · {activeDistrict.trendPercent}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950/40 border border-white/10 p-3">
                    <p className="text-white/40 text-[11px]">最近主要症状</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeDistrict.topSymptoms.map(symptom => (
                        <span
                          key={symptom}
                          className="bg-cyan-500/10 text-cyan-200 text-[11px] px-2 py-0.5 rounded-full border border-cyan-400/15"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {breakdownItems.map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/75">{item.label}</span>
                        <span className="text-white/45">{item.value} 分</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, item.value * 3.5)}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                      <p className="text-white/35 text-[11px] mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/45 text-[11px] mb-1.5">告警原因</p>
                  <div className="space-y-1.5">
                    {activeDistrict.alertReasons.map(reason => (
                      <div key={reason} className="flex items-start gap-2 text-xs text-white/75">
                        <span className="text-cyan-300 mt-0.5">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-950/40 border border-white/10 p-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-cyan-200 text-[11px]">数据来源说明</span>
                      <span className="bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full">
                        {activeDistrict.dataLabel}
                      </span>
                    </div>
                    <p className="text-white/60 text-[11px] leading-relaxed mt-1">
                      {activeDistrict.sourceNote}
                    </p>
                    <p className="text-white/35 text-[10px] mt-1">
                      更新时间：{activeDistrict.lastUpdated}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 区块3：7日趋势图 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-white/60" />
                <span className="text-white font-medium text-sm">
                  {activeDistrictName ? `${activeDistrictName} · 7日购药趋势` : '点击区域查看趋势'}
                </span>
              </div>
              <div style={{ height: '140px' }}>
                {trendData ? (
                  <Line
                    data={{
                      labels: trendData.labels,
                      datasets: [
                        {
                          label: '退烧药',
                          data: trendData.fever,
                          borderColor: '#EF4444',
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          tension: 0.4,
                          fill: true,
                          pointRadius: 3,
                        },
                        {
                          label: '止咳药',
                          data: trendData.cough,
                          borderColor: '#60A5FA',
                          backgroundColor: 'rgba(96,165,250,0.1)',
                          tension: 0.4,
                          fill: true,
                          pointRadius: 3,
                        },
                        {
                          label: '肠胃药',
                          data: trendData.gi,
                          borderColor: '#34D399',
                          backgroundColor: 'rgba(52,211,153,0.1)',
                          tension: 0.4,
                          fill: true,
                          pointRadius: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: {
                            color: 'rgba(255,255,255,0.5)',
                            font: { size: 10 },
                            boxWidth: 12,
                          },
                        },
                        tooltip: { mode: 'index', intersect: false },
                      },
                      scales: {
                        x: {
                          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
                          grid: { color: 'rgba(255,255,255,0.05)' },
                        },
                        y: {
                          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
                          grid: { color: 'rgba(255,255,255,0.05)' },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30 text-sm">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            {/* 区块4：AI预警分析 */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} className="text-blue-400" />
                <span className="text-white font-medium text-sm">AI 预警研判</span>
                <span className="text-white/30 text-xs ml-auto">基于脱敏指标生成</span>
              </div>
                  <p className="text-white/75 text-xs leading-relaxed whitespace-pre-line">
                    {warningText}
                  </p>
                  <p className="text-white/35 text-[11px] mt-3">
                    注：该研判用于辅助解释风险变化，不替代疾控部门正式结论。
                  </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-white/30 text-xs">生成时间：{today}</span>
                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                  数据置信度：中
                </span>
              </div>
            </div>

            <OfficialSourceComparison
              records={dashboardSources}
              syncStatus={dashboardSyncStatus}
              theme="dark"
              subtitle="优先展示疾控、卫健委与 WHO 的公开资料；云端暂不可用时，会自动保留人工整理的本地摘要。"
            />
          </div>
        </div>
      </div>

      {/* 底部滚动条 */}
      {districtData.length > 0 && (() => {
        const marqueeContent = [...districtData]
          .sort((a, b) => b.riskScore - a.riskScore)
          .map(d => {
            const emoji = d.riskLevel === 'critical' ? '🔴'
              : d.riskLevel === 'high' ? '🟠'
              : d.riskLevel === 'medium' ? '🟡' : '🟢'
            const trendSymbol = d.trend === 'up' ? '↑' : d.trend === 'down' ? '↓' : '→'
            return `${emoji} ${d.district} · 风险指数 ${Math.round(d.riskScore)} · ${d.topSymptoms[0]} ${trendSymbol}${d.trendPercent}%`
          })
          .join('   |')
        const fullContent = `${marqueeContent}   |${marqueeContent}`
        return (
          <div className="border-t border-white/10 py-2 px-6 overflow-hidden">
            <div className="flex overflow-hidden">
              <div className="animate-marquee text-white/40 text-xs font-mono">
                {fullContent}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
