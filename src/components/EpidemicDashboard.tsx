import { useEffect, useRef, useState, useMemo } from 'react'
import { Activity, AlertOctagon, AlertTriangle, ArrowLeft, BarChart2, Bot, Map, ShieldCheck, TrendingUp } from 'lucide-react'
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
  getActiveCityConfig,
  getActiveCity,
  setActiveCity,
  getSupportedCities,
  detectCityFromCoords,
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
    summary: '当前展示已核对的官方公开资料摘要。',
    note: '用于对照正式建议、就医路径和疾病背景，不替代医生诊疗。',
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
  const [currentCity, setCurrentCity] = useState(getActiveCity())
  const supportedCities = getSupportedCities()
  const cityConfig = getActiveCityConfig()
  const cityOverview = useMemo(() => getCityOverview(), [currentCity])
  const districtData = useMemo<DistrictRiskData[]>(() => mergeLocalReports(getDistrictRiskData()), [currentCity])
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'fallback'>(
    mapKey ? 'loading' : 'fallback'
  )
  const [mapNote, setMapNote] = useState(
    mapKey ? '正在载入热力图…' : '地图组件未加载，已切换为趋势参考视图。'
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

  // 根据用户定位自动选择城市
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected = detectCityFromCoords(pos.coords.longitude, pos.coords.latitude)
        if (detected !== currentCity) {
          setActiveCity(detected)
          setCurrentCity(detected)
        }
      },
      () => { /* 定位失败时保持默认城市 */ },
      { timeout: 5000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCityChange(city: string) {
    setActiveCity(city)
    setCurrentCity(city)
    // 销毁旧地图重新绘制
    circlesRef.current.forEach(c => c.setMap?.(null))
    circlesRef.current = []
    mapRef.current?.destroy?.()
    mapRef.current = null
    setMapStatus(mapKey ? 'loading' : 'fallback')
  }

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
            zoom: cityConfig.zoom,
            center: cityConfig.center,
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
  }, [districtData, mapKey, currentCity, cityConfig])

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
  const { records: dashboardSources, syncStatus: dashboardSourceStatus } = useDashboardOfficialSourcesSafe(
    activeDistrict?.topSymptoms ?? focusDistrict?.topSymptoms ?? []
  )
  const signalDistrict = activeDistrict ?? focusDistrict
  const officialReferenceTime =
    dashboardSourceStatus.latestRecordTime || dashboardSourceStatus.lastSyncTime
  const officialTimeLabel = officialReferenceTime
    ? officialSourceHelpers.formatOfficialSourceTime(officialReferenceTime)
    : ''
  const officialFreshnessLabel =
    dashboardSourceStatus.freshness === 'fresh'
      ? '近期更新'
      : dashboardSourceStatus.freshness === 'recent'
      ? '近期公开'
      : dashboardSourceStatus.freshness === 'stale'
      ? '待复核'
      : '稳定参考'
  const sourceTierCards = [
    {
      id: 'official',
      label: '权威对照层',
      title: '官方公开资料',
      badge: officialFreshnessLabel,
      summary: '来自疾控中心、卫健委及 WHO 等公开渠道，优先用于核对正式建议、就医路径和疾病背景。',
      note: officialTimeLabel
        ? `最近资料时间：${officialTimeLabel}`
        : '以公开原文标注时间为准',
      wrapperClass: 'border-emerald-400/20 bg-emerald-500/5',
      labelClass: 'text-emerald-200',
      badgeClass: 'bg-emerald-500/15 text-emerald-200',
    },
    {
      id: 'trend',
      label: '趋势参考层',
      title: '地图热力与 7 日曲线',
      badge: '估算口径',
      summary: '综合社区分诊、购药波动、季节和天气因子估算近期方向，适合比较区域变化与服务压力。',
      note: '用于看相对变化，不代表官方通报病例数。',
      wrapperClass: 'border-cyan-500/20 bg-cyan-500/5',
      labelClass: 'text-cyan-200',
      badgeClass: 'bg-cyan-500/15 text-cyan-200',
    },
    {
      id: 'anonymous',
      label: '早期感知层',
      title: '社区问诊与回访',
      badge: '近 48 小时',
      summary: '汇总脱敏自查上报与回访状态，帮助识别局部抬升和恢复缓慢区域，便于做早期观察。',
      note: signalDistrict
        ? `当前重点观察 ${signalDistrict.district} 的社区分诊与回访变化。`
        : '需结合个人症状和线下诊疗共同判断。',
      wrapperClass: 'border-amber-400/20 bg-amber-500/5',
      labelClass: 'text-amber-200',
      badgeClass: 'bg-amber-500/15 text-amber-200',
    },
  ]
  const readingGuide = [
    '先看官方公开资料，确认正式防护建议、就医入口和疾病背景。',
    '再看地图热力与 7 日曲线，判断区域关注度是上行、持平还是回落。',
    '最后结合匿名问诊信号与个人症状；如持续高热、胸痛或呼吸困难，请直接线下就医。',
  ]
  const breakdownItems = activeDistrict
    ? [
        {
          label: '症状上报',
          value: activeDistrict.riskBreakdown.symptomReports,
          color: '#38BDF8',
          description: '来自社区分诊与自查上报的早期观察信号',
        },
        {
          label: '趋势变化',
          value: activeDistrict.riskBreakdown.trendChange,
          color: '#A78BFA',
          description: '观察近 7 日变化方向，判断是否持续抬升',
        },
        {
          label: '环境因素',
          value: activeDistrict.riskBreakdown.environment,
          color: '#34D399',
          description: '天气、季节与通勤等背景因子，仅作校准参考',
        },
        {
          label: '最近回访',
          value: activeDistrict.riskBreakdown.followUp,
          color: '#F59E0B',
          description: '结合复测与回访恢复情况，评估是否需要继续关注',
        },
      ]
    : []
  const hotspotSummary = sortedDistricts.slice(0, 3)
  const trendSignalItems = signalDistrict
    ? [
        {
          label: '综合关注度',
          value: 100 + signalDistrict.trendPercent * 2 + Math.round(signalDistrict.riskScore / 3),
          delta:
            signalDistrict.trend === 'down'
              ? `-${Math.max(3, Math.round(signalDistrict.trendPercent * 0.45))}%`
              : `+${Math.max(4, Math.round(signalDistrict.trendPercent * 0.8))}%`,
          note: `聚焦症状：${signalDistrict.topSymptoms.slice(0, 2).join(' / ')}`,
        },
        {
          label: '社区反馈密度',
          value: 40 + Math.round(signalDistrict.totalReports * 0.35),
          delta:
            signalDistrict.trend === 'down'
              ? '反馈回落'
              : signalDistrict.trend === 'stable'
              ? '持续关注'
              : '关注升温',
          note: `${signalDistrict.district} 区域的匿名自查与社区反馈较集中`,
        },
        {
          label: '药房咨询波动',
          value: 20 + Math.round((signalDistrict.feverDrugIndex + signalDistrict.coughDrugIndex) / 4),
          delta: `${Math.round((signalDistrict.feverDrugIndex + signalDistrict.coughDrugIndex) / 2)} 指数`,
          note: '夜间退烧与止咳咨询变化，用于判断服务需求',
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse mr-3 flex-shrink-0" />
          <span className="text-white font-bold text-xl">{currentCity} · 公共健康观察</span>
          <select
            value={currentCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="ml-3 bg-white/10 text-white/80 text-xs px-2 py-1 rounded-lg border border-white/20 outline-none cursor-pointer"
          >
            {supportedCities.map(city => (
              <option key={city} value={city} className="text-slate-900">{city}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm font-mono">{currentTime}</span>
          <span className="bg-white/10 text-white/50 text-xs px-3 py-1 rounded-full hidden md:inline">
            官方资料对照 · 综合趋势 · 健康动态
          </span>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-white/60 hover:text-white text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            返回
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
                <p className="text-white/50 text-xs mt-1">近 24 小时健康动态</p>
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
                    趋势参考分 {Math.round(focusDistrict.riskScore)} · {getRiskLabel(focusDistrict.riskLevel)}
                  </span>
                </div>
                <p className="text-white/75 text-xs mt-1 leading-relaxed">
                  近 7 日{focusDistrict.topSymptoms.slice(0, 2).join('、')}相关分诊与回访信号持续抬升，
                  当前主要由症状上报 {focusDistrict.riskBreakdown.symptomReports} 分和趋势变化{' '}
                  {focusDistrict.riskBreakdown.trendChange} 分驱动，建议先核对官方公开资料，再评估社区问诊与接诊压力。
                </p>
              </div>
            </div>
            <div className="hidden xl:flex items-center gap-2 flex-wrap justify-end">
              <span className="bg-white/8 border border-white/10 text-white/65 text-[11px] px-2.5 py-1 rounded-full">
                综合趋势参考
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
                  <span className="text-white font-medium text-sm">各区健康趋势热力图</span>
                  <span className="text-white/30 text-[11px] hidden md:inline">趋势参考层 · 点击区域查看解释卡</span>
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
                  <span className="bg-cyan-500/15 text-cyan-200 text-[10px] px-2 py-0.5 rounded-full">
                    趋势参考层
                  </span>
                  {[
                    { color: '#10B981', label: '低风险' },
                    { color: '#F59E0B', label: '中风险' },
                    { color: '#F97316', label: '高风险' },
                    { color: '#EF4444', label: '紧急' },
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
                      建议结合下方信号卡和官方资料综合判断。
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
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-300" />
                    <span className="text-white font-medium text-sm">数据口径与阅读方式</span>
                  </div>
                  <span className="bg-white/10 text-white/50 text-[10px] px-2 py-0.5 rounded-full">
                    分层展示
                  </span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  这张图将官方公开资料、趋势参考层和社区问诊信号分开展示，帮助你快速分辨哪些信息用于核对正式建议，哪些信息用于观察变化方向。
                </p>
                <div className="space-y-2.5 mt-3">
                  {sourceTierCards.map(card => (
                    <div key={card.id} className={`rounded-xl border p-3 ${card.wrapperClass}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-medium ${card.labelClass}`}>{card.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${card.badgeClass}`}>
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-white/85 text-xs mt-1">{card.title}</p>
                      <p className="text-[11px] text-white/60 mt-1 leading-relaxed">{card.summary}</p>
                      <p className="text-[10px] text-white/35 mt-2 leading-relaxed">{card.note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                  <p className="text-white/40 text-[11px]">建议阅读顺序</p>
                  <div className="space-y-2 mt-2">
                    {readingGuide.map((item, index) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-white/10 text-white/60 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-[11px] text-white/65 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-950/50 to-blue-950/40 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-300" />
                    <span className="text-white font-medium text-sm">趋势参考信号</span>
                  </div>
                  <span className="bg-cyan-500/15 text-cyan-200 text-[10px] px-2 py-0.5 rounded-full">
                    估算口径
                  </span>
                </div>
                {signalDistrict && (
                  <p className="text-[11px] text-white/60 leading-relaxed mb-3">
                    以 <span className="text-white/85">{signalDistrict.district}</span> 为当前观察窗口，
                    当前结合社区分诊、购药咨询与季节因子估算近期关注度，用于判断变化方向，不代表官方病例统计。
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
                  注：该卡用于补充用户体感与服务需求变化，建议与官方公开资料和线下接诊情况交叉判断。
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
                  <span className="text-white font-medium text-sm">区域关注排行</span>
                </div>
                <span className="text-white/30 text-[11px]">基于趋势参考分</span>
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
                      <span className="text-white font-medium text-sm">{activeDistrict.district} · 趋势解释卡</span>
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
                      趋势参考分 = 症状上报 + 趋势变化 + 环境因素 + 最近回访
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-slate-950/40 border border-white/10 p-3">
                    <p className="text-white/40 text-[11px]">趋势参考分</p>
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
                  辅助解释层
                </span>
              </div>
            </div>

            {dashboardSources.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-300" />
                    <span className="text-white font-medium text-sm">官方公开资料对照</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-500/15 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full">
                      {officialFreshnessLabel}
                    </span>
                    {officialTimeLabel && (
                      <span className="text-white/35 text-[10px]">最近资料时间：{officialTimeLabel}</span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-white/65 mt-2 leading-relaxed">
                  {dashboardSourceStatus.summary}
                </p>
                <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                  {dashboardSourceStatus.note}
                </p>
              </div>
            )}
            <OfficialSourceComparison
              records={dashboardSources}
              theme="dark"
              subtitle="权威对照层：资料来自疾控中心、卫健委及 WHO 等公开渠道，适合核对正式建议、就医路径和疾病背景。"
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
            return `${emoji} ${d.district} · 趋势指数 ${Math.round(d.riskScore)} · ${d.topSymptoms[0]} ${trendSymbol}${d.trendPercent}%`
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
