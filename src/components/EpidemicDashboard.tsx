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
  getNearestDistrictFromCoords,
  getNearestSupportedCityFromCoords,
} from '../lib/epidemicDataEngine'
import { loadExperienceSettings, type LocationPreference } from '../lib/experienceSettings'
import { OfficialSourceComparison } from './OfficialSourceComparison'
import * as officialSourceHelpers from '../lib/officialSources'
import type { DistrictRiskData } from '../lib/epidemicDataEngine'
import type { OfficialSourceBundle } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler)

interface Props {
  onBack: () => void
  onOpenB2B?: () => void
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

type CitySelectionSource = 'default' | 'detected' | 'manual'
type LocationStatus =
  | 'detecting'
  | 'detected'
  | 'outside'
  | 'blocked'
  | 'unsupported'
  | 'profile'
  | 'disabled'

const SUPPORTED_LOCATION_MATCH_KM = 120

const RESPIRATORY_SYMPTOMS = ['发热', '咳嗽', '流涕', '咽痛', '鼻塞', '胸闷']
const GI_SYMPTOMS = ['腹泻', '恶心']

const formatDistanceLabel = (distanceKm: number | null) => {
  if (distanceKm == null || Number.isNaN(distanceKm)) {
    return ''
  }

  if (distanceKm < 1) {
    return '1 公里内'
  }

  return `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} 公里`
}

const formatAccuracyLabel = (accuracyMeters: number | null) => {
  if (accuracyMeters == null || Number.isNaN(accuracyMeters)) {
    return ''
  }

  if (accuracyMeters < 1000) {
    return `${Math.round(accuracyMeters)} 米`
  }

  return `${(accuracyMeters / 1000).toFixed(1)} 公里`
}

const getMapLoadingNote = (city: string) =>
  `${city}分区趋势图正在加载，你仍可先查看重点片区、7 日曲线和官方来源。`

const getMapFallbackNote = (city: string) =>
  `${city}地图暂未显示，已保留分区摘要、重点片区和 7 日变化，不影响继续核对趋势。`

export function EpidemicDashboard({ onBack, onOpenB2B }: Props) {
  const mapKey = (import.meta.env.VITE_AMAP_JS_KEY as string | undefined)?.trim() ?? ''
  const locationPreference = useMemo<LocationPreference>(
    () => loadExperienceSettings().locationPreference,
    []
  )
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentCity, setCurrentCity] = useState(getActiveCity())
  const [detectedCity, setDetectedCity] = useState<string | null>(null)
  const [detectedDistrict, setDetectedDistrict] = useState<string | null>(null)
  const [detectedDistanceKm, setDetectedDistanceKm] = useState<number | null>(null)
  const [detectedAccuracyMeters, setDetectedAccuracyMeters] = useState<number | null>(null)
  const [citySelectionSource, setCitySelectionSource] = useState<CitySelectionSource>('default')
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('detecting')
  const supportedCities = getSupportedCities()
  const cityConfig = getActiveCityConfig()
  const cityOverview = useMemo(() => getCityOverview(currentCity), [currentCity])
  const districtData = useMemo<DistrictRiskData[]>(
    () => mergeLocalReports(getDistrictRiskData(currentCity)),
    [currentCity]
  )
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7)
  const [symptomFilter, setSymptomFilter] = useState<string>('全部')
  const filteredDistrictData = useMemo(() => {
    if (symptomFilter === '全部') return districtData
    return districtData.filter(d => {
      if (symptomFilter === '呼吸道') return d.topSymptoms.some(s => RESPIRATORY_SYMPTOMS.includes(s))
      if (symptomFilter === '消化道') return d.topSymptoms.some(s => GI_SYMPTOMS.includes(s))
      return d.topSymptoms.some(s => !RESPIRATORY_SYMPTOMS.includes(s) && !GI_SYMPTOMS.includes(s))
    })
  }, [districtData, symptomFilter])
  const filteredSortedDistricts = useMemo(
    () => [...filteredDistrictData].sort((a, b) => b.riskScore - a.riskScore),
    [filteredDistrictData]
  )
  const dailyTrend = useMemo(() => {
    const result: { label: string; count: number }[] = []
    const now = new Date()
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const label = `${d.getMonth() + 1}/${d.getDate()}`
      const seed = (d.getDate() * 7 + d.getMonth() * 13) % 50
      result.push({ label, count: seed + 5 })
    }
    return result
  }, [timeRange])
  const maxTrendCount = useMemo(() => Math.max(...dailyTrend.map(d => d.count), 1), [dailyTrend])
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'fallback'>(
    mapKey ? 'loading' : 'fallback'
  )
  const [mapNote, setMapNote] = useState(
    mapKey ? getMapLoadingNote(currentCity) : getMapFallbackNote(currentCity)
  )
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circlesRef = useRef<any[]>([])
  const citySelectionSourceRef = useRef<CitySelectionSource>('default')

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

  function applyCityChange(city: string, source: CitySelectionSource) {
    const isSameCity = city === currentCity

    citySelectionSourceRef.current = source
    setCitySelectionSource(source)
    setActiveCity(city)
    setCurrentCity(city)

    if (isSameCity) {
      return
    }

    setSelectedDistrict(null)
    circlesRef.current.forEach(c => c.setMap?.(null))
    circlesRef.current = []
    mapRef.current?.destroy?.()
    mapRef.current = null
    setMapStatus(mapKey ? 'loading' : 'fallback')
    setMapNote(mapKey ? getMapLoadingNote(city) : getMapFallbackNote(city))
  }

  function focusDetectedCity(source: CitySelectionSource = 'detected') {
    if (!detectedCity) {
      return
    }

    applyCityChange(detectedCity, source)

    if (detectedDistrict) {
      setSelectedDistrict(detectedDistrict)
    }
  }

  function focusDetectedDistrictArea() {
    if (!detectedDistrict) {
      return
    }

    if (detectedCity && currentCity !== detectedCity) {
      applyCityChange(detectedCity, 'detected')
    }

    setSelectedDistrict(detectedDistrict)
  }

  // 根据用户定位自动选择城市
  useEffect(() => {
    if (locationPreference !== 'device') {
      setLocationStatus(locationPreference === 'profile' ? 'profile' : 'disabled')
      return
    }

    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearestCityMatch = getNearestSupportedCityFromCoords(
          pos.coords.longitude,
          pos.coords.latitude
        )
        const detected = nearestCityMatch.city
        const nearbyDistrict = getNearestDistrictFromCoords(
          detected,
          pos.coords.longitude,
          pos.coords.latitude
        )
        const withinSupportedCity = nearestCityMatch.distanceKm <= SUPPORTED_LOCATION_MATCH_KM

        setDetectedCity(detected)
        setDetectedDistrict(nearbyDistrict)
        setDetectedDistanceKm(nearestCityMatch.distanceKm)
        setDetectedAccuracyMeters(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null)
        setLocationStatus(withinSupportedCity ? 'detected' : 'outside')

        if (withinSupportedCity && citySelectionSourceRef.current !== 'manual') {
          applyCityChange(detected, 'detected')

          if (nearbyDistrict) {
            setSelectedDistrict(nearbyDistrict)
          }
        }
      },
      () => {
        setLocationStatus('blocked')
      },
      { timeout: 5000, maximumAge: 5 * 60 * 1000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationPreference])

  function handleCityChange(city: string) {
    applyCityChange(city, 'manual')
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
        setMapNote(getMapFallbackNote(currentCity))
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
          setMapNote(getMapFallbackNote(currentCity))
        })
      } else {
        const script = document.createElement('script')
        script.id = 'amap-script'
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
        script.onload = initMap
        script.onerror = () => {
          setMapStatus('fallback')
          setMapNote(getMapFallbackNote(currentCity))
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
  const trendData = activeDistrictName ? getDrugTrendData(activeDistrictName, currentCity) : null
  const warningText = districtData.length > 0 ? getAIWarningText(districtData) : ''
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const focusDistrict = sortedDistricts[0] ?? null
  const { records: dashboardSources, syncStatus: dashboardSourceStatus } = useDashboardOfficialSourcesSafe(
    activeDistrict?.topSymptoms ?? focusDistrict?.topSymptoms ?? []
  )
  const hasLocalOfficialSource = dashboardSources.some((record) =>
    record.scope === 'local' ||
    /市卫生健康委员会|市疾病预防控制中心|卫健委：本地|疾控：/u.test(
      `${record.sourceLabel} ${record.title}`
    )
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
  const safeSourceLabel = /supabase|tavily|api.key|edge.function|配置/i.test(dashboardSourceStatus.sourceLabel || '')
    ? '卫健委、疾控与 WHO 公开资料'
    : dashboardSourceStatus.sourceLabel;
  const safeSummary = /supabase|tavily|api.key|edge.function|配置/i.test(dashboardSourceStatus.summary || '')
    ? '当前展示内置官方公开资料摘要。'
    : dashboardSourceStatus.summary;
  const sourceTierCards = [
    {
      id: 'official',
      label: '官方 / 公共来源',
      title: safeSourceLabel || '卫健委、疾控与 WHO 公开资料',
      badge: officialFreshnessLabel,
      summary: safeSummary || `优先用于核对 ${currentCity} 的正式建议、就医入口和疾病背景，也是最先应查看的信息。`,
      note: officialTimeLabel
        ? `公开资料最近标注时间：${officialTimeLabel}`
        : '公开资料以原始发布渠道的标注时间为准，卡片会优先直达原始页面',
      wrapperClass: 'border-emerald-400/20 bg-emerald-500/5',
      labelClass: 'text-emerald-200',
      badgeClass: 'bg-emerald-500/15 text-emerald-200',
    },
    {
      id: 'trend',
      label: '趋势 / 参考',
      title: `${currentCity}各区热力与 7 日变化`,
      badge: '观察口径',
      summary: '综合社区分诊、购药咨询和季节因子，用来看同城不同片区是升温、持平还是回落。',
      note: '用于比较相对变化，不等同于官方通报病例数。',
      wrapperClass: 'border-cyan-500/20 bg-cyan-500/5',
      labelClass: 'text-cyan-200',
      badgeClass: 'bg-cyan-500/15 text-cyan-200',
    },
    {
      id: 'community',
      label: '社区信号',
      title: '匿名自查、回访与药房咨询',
      badge: '近 48 小时',
      summary: '更接近居民体感，便于识别局部服务压力、恢复偏慢或夜间咨询升温的片区。',
      note: signalDistrict
        ? `当前会结合 ${signalDistrict.district} 的社区反馈与药房咨询节奏做补充判断。`
        : '需结合个人症状和线下诊疗共同判断。',
      wrapperClass: 'border-amber-400/20 bg-amber-500/5',
      labelClass: 'text-amber-200',
      badgeClass: 'bg-amber-500/15 text-amber-200',
    },
  ]
  const readingGuide = [
    `先看官方 / 公共来源，确认 ${currentCity} 最新公开建议、就医入口和疾病背景。`,
    `再看 ${currentCity} 各区热力与 7 日曲线，判断是局部抬升、持续关注还是逐步回落。`,
    '最后结合社区信号和个人症状；如持续高热、胸痛或呼吸困难，请直接线下就医。',
  ]
  const breakdownItems = activeDistrict
    ? [
        {
          label: '社区症状反馈',
          value: activeDistrict.riskBreakdown.symptomReports,
          color: '#38BDF8',
          description: '来自本地匿名自查与社区分诊，帮助判断片区体感是否升温',
        },
        {
          label: '近 7 日变化',
          value: activeDistrict.riskBreakdown.trendChange,
          color: '#A78BFA',
          description: '观察近一周走势，判断当前是抬升、持平还是回落',
        },
        {
          label: '季节与环境',
          value: activeDistrict.riskBreakdown.environment,
          color: '#34D399',
          description: '天气、季节与通勤等背景因子，仅用于校准本地参考分',
        },
        {
          label: '复测与回访',
          value: activeDistrict.riskBreakdown.followUp,
          color: '#F59E0B',
          description: '结合恢复速度与回访结果，判断是否仍需继续留意',
        },
      ]
    : []
  const hotspotSummary = sortedDistricts.slice(0, 3)
  const trendSignalItems = signalDistrict
    ? [
        {
          label: '同城综合关注度',
          value: 100 + signalDistrict.trendPercent * 2 + Math.round(signalDistrict.riskScore / 3),
          delta:
            signalDistrict.trend === 'down'
              ? `-${Math.max(3, Math.round(signalDistrict.trendPercent * 0.45))}%`
              : `+${Math.max(4, Math.round(signalDistrict.trendPercent * 0.8))}%`,
          note: `当前片区高频不适：${signalDistrict.topSymptoms.slice(0, 2).join(' / ')}`,
        },
        {
          label: '社区反馈热度',
          value: 40 + Math.round(signalDistrict.totalReports * 0.35),
          delta:
            signalDistrict.trend === 'down'
              ? '反馈回落'
              : signalDistrict.trend === 'stable'
              ? '持续关注'
              : '关注升温',
          note: `${signalDistrict.district} 的匿名自查与社区反馈相对集中，更贴近居民体感`,
        },
        {
          label: '药房咨询波动',
          value: 20 + Math.round((signalDistrict.feverDrugIndex + signalDistrict.coughDrugIndex) / 4),
          delta: `${Math.round((signalDistrict.feverDrugIndex + signalDistrict.coughDrugIndex) / 2)} 指数`,
          note: '夜间退烧与止咳咨询变化，用来补充判断附近服务需求',
        },
      ]
    : []
  const detectedDistanceLabel = formatDistanceLabel(detectedDistanceKm)
  const detectedAccuracyLabel = formatAccuracyLabel(detectedAccuracyMeters)
  const cityContext = (() => {
    if (citySelectionSource === 'manual') {
      if (detectedCity && detectedCity !== currentCity && locationStatus === 'detected') {
        return {
          badge: '手动切换',
          summary: `当前查看 ${currentCity}`,
          detail: `已读取当前位置并匹配到 ${detectedCity}${detectedDistrict ? ` · 更近片区 ${detectedDistrict}` : ''}，但你已切换到更关心的 ${currentCity}。`,
        }
      }

      return {
        badge: '手动切换',
        summary: `当前查看 ${currentCity}`,
        detail: detectedCity
          ? `你仍可随时切回 ${detectedCity}${detectedDistrict ? ` 或直接查看更近的 ${detectedDistrict}` : ''}。`
          : '你可以随时切换到其他常看城市，方便查看家人或工作地附近的变化。',
      }
    }

    if (citySelectionSource === 'detected') {
      return {
        badge: '定位已匹配',
        summary: `已按当前位置切换到 ${currentCity}`,
        detail: detectedDistrict
          ? `当前位置主要用于匹配支持城市和更近片区，当前已优先聚焦 ${detectedDistrict}。`
          : '当前位置主要用于匹配支持城市；如需看其他城市，可直接在下拉中切换。',
      }
    }

    if (locationStatus === 'detecting') {
      return {
        badge: '正在识别',
        summary: `当前先查看 ${currentCity}`,
        detail: '如果识别到你所在的支持城市，会自动切换并尝试聚焦更近片区；不想用定位也可以直接手动选择。',
      }
    }

    if (locationStatus === 'outside') {
      return {
        badge: '位置未命中支持城市',
        summary: `当前先查看 ${currentCity}`,
        detail: detectedCity
          ? `已读取当前位置，但最近的已接入城市是 ${detectedCity}${detectedDistanceLabel ? `（距市级参考中心约 ${detectedDistanceLabel}）` : ''}；需要时可手动切换查看。`
          : '已读取当前位置，但目前未命中支持城市，你仍可手动切换到最关心的城市。',
      }
    }

    if (locationStatus === 'blocked') {
      return {
        badge: '未读取位置',
        summary: `当前先查看 ${currentCity}`,
        detail: '没有获取到当前位置，先按常看城市展示；你仍可手动切换到更关心的城市或片区。',
      }
    }

    if (locationStatus === 'unsupported') {
      return {
        badge: '定位不可用',
        summary: `当前先查看 ${currentCity}`,
        detail: '当前设备暂不支持定位，可直接手动选择城市并查看重点片区。',
      }
    }

    if (locationStatus === 'profile') {
      return {
        badge: '档案城市',
        summary: `当前按常看城市查看 ${currentCity}`,
        detail: '你已在设置里切到档案城市模式；地图不会读取精准位置，只按当前常看城市展示分区趋势。',
      }
    }

    if (locationStatus === 'disabled') {
      return {
        badge: '位置已关闭',
        summary: `当前按手动城市查看 ${currentCity}`,
        detail: '你已关闭位置偏好；地图不会自动读取当前位置，但仍可手动切换支持城市。',
      }
    }

    return {
      badge: '默认城市',
      summary: `当前先查看 ${currentCity}`,
      detail: '你可以直接手动切换到其他支持城市，查看更关心的本地趋势。',
    }
  })()
  const locationUsageMeta = (() => {
    if (locationStatus === 'detected' && detectedCity) {
      return [
        `位置用途：匹配 ${detectedCity}${detectedDistrict ? ` · ${detectedDistrict} 附近` : ''}`,
        detectedDistanceLabel ? `距市级参考中心约 ${detectedDistanceLabel}` : '',
        detectedAccuracyLabel ? `定位精度约 ${detectedAccuracyLabel}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    }

    if (locationStatus === 'outside' && detectedCity) {
      return `已读取当前位置；最近的已接入城市为 ${detectedCity}${detectedDistanceLabel ? ` · 约 ${detectedDistanceLabel}` : ''}。`
    }

    if (locationStatus === 'blocked') {
      return '未读取到当前位置；地图仍可按城市和片区继续使用。'
    }

    if (locationStatus === 'unsupported') {
      return '当前设备未提供定位能力；地图仅按你选择的城市展示分区趋势。'
    }

    if (locationStatus === 'profile') {
      return '你已切到档案城市模式；地图只按当前常看城市展示分区趋势，不读取精准位置。'
    }

    if (locationStatus === 'disabled') {
      return '你已关闭位置偏好；地图只按手动选择的城市展示分区趋势，不读取精准位置。'
    }

    return '地图展示的是按区汇总的近 7 日相对变化；定位只用于推荐支持城市和更近片区，不显示精确地址。'
  })()
  const showDetectedCityAction =
    locationStatus === 'detected' &&
    Boolean(detectedCity) &&
    (citySelectionSource === 'manual' || currentCity !== detectedCity)
  const showRecommendedCityAction =
    locationStatus === 'outside' && Boolean(detectedCity) && currentCity !== detectedCity
  const showDetectedDistrictAction =
    locationStatus === 'detected' &&
    detectedCity === currentCity &&
    Boolean(detectedDistrict) &&
    activeDistrictName !== detectedDistrict
  const mapUsageNote =
    locationStatus === 'detected' && detectedDistrict && detectedCity === currentCity
      ? `地图展示的是 ${currentCity} 各区近 7 日相对变化；当前位置只用于提示你更靠近 ${detectedDistrict}。`
      : '地图展示的是按区汇总的近 7 日相对变化；定位只用于推荐支持城市和更近片区，不显示精确地址。'
  const sourceLayerBadges = [
    { label: '官方 / 公共来源', className: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' },
    { label: '趋势 / 参考', className: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200' },
    { label: '社区信号', className: 'border-amber-400/20 bg-amber-500/10 text-amber-200' },
  ]
  const mapLegendItems = [
    { color: '#10B981', label: '相对平稳' },
    { color: '#F59E0B', label: '持续关注' },
    { color: '#F97316', label: '明显抬升' },
    { color: '#EF4444', label: '优先留意' },
  ]
  const districtSourceCards = activeDistrict
    ? [
        {
          id: 'official',
          tier: '官方 / 公共来源',
          title: dashboardSourceStatus.sourceLabel || '官方公开资料',
          summary: dashboardSourceStatus.summary,
          note: officialTimeLabel
            ? `公开资料最近标注时间：${officialTimeLabel}`
            : dashboardSourceStatus.note,
          wrapperClass: 'border-emerald-400/20 bg-emerald-500/5',
          tierClass: 'text-emerald-200',
        },
        {
          id: 'trend',
          tier: '趋势 / 参考',
          title: `${activeDistrict.district}近 7 日热力与购药变化`,
          summary: `趋势参考分 ${Math.round(activeDistrict.riskScore)}，${getTrendLabel(activeDistrict.trend)} ${formatTrendDelta(activeDistrict.trend, activeDistrict.trendPercent)}。`,
          note: '用于比较同城片区变化，不等同于官方病例统计。',
          wrapperClass: 'border-cyan-500/20 bg-cyan-500/5',
          tierClass: 'text-cyan-200',
        },
        {
          id: 'community',
          tier: '社区信号',
          title: activeDistrict.dataLabel,
          summary: activeDistrict.sourceNote,
          note: `最近整理时间：${activeDistrict.lastUpdated}`,
          wrapperClass: 'border-amber-400/20 bg-amber-500/5',
          tierClass: 'text-amber-200',
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="border-b border-white/10 px-6 py-4 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="text-white font-bold text-xl">{currentCity} · 本地疾控动态</span>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">
                {cityContext.badge}
              </span>
              <span className="text-white/75 text-xs">{cityContext.summary}</span>
            </div>
            <p className="mt-1 text-xs text-white/45 leading-relaxed">{cityContext.detail}</p>
            <p className="mt-1 text-xs text-white/35 leading-relaxed">{locationUsageMeta}</p>
            {(showDetectedCityAction || showRecommendedCityAction || showDetectedDistrictAction) && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {showDetectedCityAction && (
                  <button
                    type="button"
                    onClick={() => focusDetectedCity('detected')}
                    className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100 transition-colors hover:bg-cyan-500/20"
                  >
                    切回定位城市{detectedCity ? ` · ${detectedCity}` : ''}
                  </button>
                )}
                {showRecommendedCityAction && (
                  <button
                    type="button"
                    onClick={() => focusDetectedCity('manual')}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75 transition-colors hover:bg-white/10"
                  >
                    查看最近支持城市{detectedCity ? ` · ${detectedCity}` : ''}
                  </button>
                )}
                {showDetectedDistrictAction && (
                  <button
                    type="button"
                    onClick={focusDetectedDistrictArea}
                    className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100 transition-colors hover:bg-emerald-500/20"
                  >
                    查看附近片区{detectedDistrict ? ` · ${detectedDistrict}` : ''}
                  </button>
                )}
              </div>
            )}
          </div>

          <label className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 min-w-[190px]">
            <span className="block text-xs tracking-[0.24em] uppercase text-white/35">
              当前查看城市
            </span>
            <select
              value={currentCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="mt-2 w-full bg-slate-950/60 text-white text-sm px-3 py-2 rounded-xl border border-white/10 outline-none cursor-pointer"
            >
              {supportedCities.map(city => (
                <option key={city} value={city} className="text-slate-900">{city}</option>
              ))}
            </select>
            <span className="mt-2 block text-xs text-white/35">
              可按当前位置推荐，也可切换到家人或工作地所在城市
            </span>
          </label>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-end ml-auto">
          <span className="text-white/60 text-sm font-mono">{currentTime}</span>
          <div className="hidden xl:flex items-center gap-2 flex-wrap">
            {sourceLayerBadges.map(item => (
              <span
                key={item.label}
                className={`border text-xs px-2.5 py-1 rounded-full ${item.className}`}
              >
                {item.label}
              </span>
            ))}
          </div>
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
                <p className="text-white/50 text-xs mt-1">近 24 小时本地问诊与自查</p>
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
                <p className="text-white/50 text-xs mt-1">建议多看一眼的片区</p>
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
                <p className="text-white/50 text-xs mt-1">优先留意的片区</p>
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
                <p className="text-white/50 text-xs mt-1">本地高频不适</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([7, 14, 30] as const).map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                timeRange === days
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {days}天
            </button>
          ))}
          <span className="w-px bg-slate-200 mx-1" />
          {['全部', '呼吸道', '消化道', '其他'].map(type => (
            <button
              key={type}
              onClick={() => setSymptomFilter(type)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                symptomFilter === type
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {focusDistrict && (
          <div className="mb-4 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent px-4 py-3 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-amber-100 text-sm font-semibold">当前优先关注片区</span>
                  <span className="bg-amber-400/15 text-amber-200 text-xs px-2 py-0.5 rounded-full">
                    {focusDistrict.district}
                  </span>
                  <span className="text-white/35 text-xs">
                    本地参考分 {Math.round(focusDistrict.riskScore)} · {getRiskLabel(focusDistrict.riskLevel)}
                  </span>
                </div>
                <p className="text-white/75 text-xs mt-1 leading-relaxed">
                  近 7 日 {focusDistrict.district} 的 {focusDistrict.topSymptoms.slice(0, 2).join('、')} 相关反馈持续抬升，
                  当前主要由社区症状反馈 {focusDistrict.riskBreakdown.symptomReports} 分和近 7 日变化{' '}
                  {focusDistrict.riskBreakdown.trendChange} 分带动。建议先核对官方 / 公共资料，再结合分区趋势与社区、药房信号判断。
                </p>
              </div>
            </div>
            <div className="hidden xl:flex items-center gap-2 flex-wrap justify-end">
              <span className="bg-white/8 border border-white/10 text-white/65 text-xs px-2.5 py-1 rounded-full">
                趋势 / 参考
              </span>
              {focusDistrict.alertReasons.slice(0, 2).map(reason => (
                <span
                  key={reason}
                  className="bg-white/8 border border-white/10 text-white/65 text-xs px-2.5 py-1 rounded-full"
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
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Map size={16} className="text-white/60" />
                    <span className="text-white font-medium text-sm">{currentCity}各区近 7 日趋势热力图</span>
                    <span className="text-white/30 text-xs hidden md:inline">趋势 / 参考 · 点击片区查看分区说明</span>
                    {activeDistrict && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                          color: getRiskColor(activeDistrict.riskLevel),
                          background: `${getRiskColor(activeDistrict.riskLevel)}18`,
                          borderColor: `${getRiskColor(activeDistrict.riskLevel)}33`,
                        }}
                      >
                        当前聚焦：{activeDistrict.district}
                      </span>
                    )}
                    {locationStatus === 'detected' && detectedDistrict && detectedCity === currentCity && (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                        定位附近：{detectedDistrict}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{mapUsageNote}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <span className="bg-cyan-500/15 text-cyan-200 text-xs px-2 py-0.5 rounded-full">
                    趋势 / 参考
                  </span>
                  {mapLegendItems.map(item => (
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
                        {mapStatus === 'loading' ? `正在加载${currentCity}分区趋势图` : `先看${currentCity}分区趋势摘要`}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-white/65">{mapNote}</p>
                      {focusDistrict && (
                        <p className="mt-3 text-xs leading-relaxed text-cyan-200">
                          当前先留意 {focusDistrict.district}，高频不适为
                          {focusDistrict.topSymptoms.slice(0, 2).join('、')}。
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {focusDistrict && (
                  <div className="absolute left-4 bottom-4 max-w-xs rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur px-3 py-2.5 shadow-2xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/85 text-xs font-medium">{currentCity}重点片区摘要</span>
                      <span className="text-xs text-white/40">优先核对</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{focusDistrict.district}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          color: getRiskColor(focusDistrict.riskLevel),
                          background: `${getRiskColor(focusDistrict.riskLevel)}18`,
                        }}
                      >
                        {getRiskLabel(focusDistrict.riskLevel)}
                      </span>
                    </div>
                    <p className="text-xs text-white/65 mt-1 leading-relaxed">
                      {focusDistrict.topSymptoms.slice(0, 2).join('、')}主导，近 7 日变化
                      {formatTrendDelta(focusDistrict.trend, focusDistrict.trendPercent)}，建议结合下方三类信息分层综合判断。
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-300" />
                  <span className="text-white font-medium text-sm">重点片区摘要</span>
                </div>
                <div className="space-y-2.5">
                  {hotspotSummary.map((district, index) => (
                    <div key={district.district} className="rounded-xl bg-slate-950/45 border border-white/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/35">#{index + 1}</span>
                          <span className="text-white/85 text-sm">{district.district}</span>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ color: getRiskColor(district.riskLevel), background: `${getRiskColor(district.riskLevel)}18` }}
                        >
                          {Math.round(district.riskScore)}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1 leading-relaxed">{district.alertReasons[0]}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {district.topSymptoms.slice(0, 2).map(symptom => (
                          <span
                            key={symptom}
                            className="border border-cyan-400/15 bg-cyan-500/10 px-2 py-0.5 rounded-full text-xs text-cyan-200"
                          >
                            {symptom}
                          </span>
                        ))}
                        <span className="text-xs text-white/40">{formatTrendDelta(district.trend, district.trendPercent)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-300" />
                    <span className="text-white font-medium text-sm">信息分层与阅读方式</span>
                  </div>
                  <span className="bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded-full">
                    分层展示
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  这张图把官方 / 公共来源、趋势 / 参考和社区信号分开展示，方便你分辨哪些信息用来核对正式建议，哪些信息用来看同城变化方向。
                </p>
                <div className="space-y-2.5 mt-3">
                  {sourceTierCards.map(card => (
                    <div key={card.id} className={`rounded-xl border p-3 ${card.wrapperClass}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-medium ${card.labelClass}`}>{card.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${card.badgeClass}`}>
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-white/85 text-xs mt-1">{card.title}</p>
                      <p className="text-xs text-white/60 mt-1 leading-relaxed">{card.summary}</p>
                      <p className="text-xs text-white/35 mt-2 leading-relaxed">{card.note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                  <p className="text-white/40 text-xs">建议阅读顺序</p>
                  <div className="space-y-2 mt-2">
                    {readingGuide.map((item, index) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-xs text-white/65 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-950/50 to-blue-950/40 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-300" />
                    <span className="text-white font-medium text-sm">近期趋势参考</span>
                  </div>
                  <span className="bg-cyan-500/15 text-cyan-200 text-xs px-2 py-0.5 rounded-full">
                    趋势 / 参考
                  </span>
                </div>
                {signalDistrict && (
                  <p className="text-xs text-white/60 leading-relaxed mb-3">
                    以 <span className="text-white/85">{signalDistrict.district}</span> 为当前观察窗口，
                    当前结合社区分诊、购药咨询与季节因子估算近期关注度，用来看变化方向，不代表官方病例统计。
                  </p>
                )}
                <div className="space-y-2.5">
                  {trendSignalItems.map(item => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white/75 text-xs">{item.label}</span>
                        <span className="text-cyan-200 text-xs font-semibold">{item.value}</span>
                      </div>
                      <p className="text-xs text-cyan-300 mt-1">{item.delta}</p>
                      <p className="text-xs text-white/50 mt-1 leading-relaxed">{item.note}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/35 mt-3">
                  注：该卡更贴近居民体感与服务需求变化，建议与官方公开资料和线下接诊情况交叉判断。
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
                    <span className="text-white font-medium text-sm">各区观察优先级</span>
                  </div>
                  <span className="text-white/30 text-xs">按本地参考分排序</span>
                </div>
              {filteredSortedDistricts.map((d, i) => (
                <div
                  key={d.district}
                  onClick={() => setSelectedDistrict(d.district)}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                    activeDistrictName === d.district ? 'bg-white/15' : 'hover:bg-white/10'
                  }`}
                >
                  <span className="text-white/30 text-xs w-4">{i + 1}</span>
                  <span className="text-white/80 text-xs flex-1">{d.district}</span>
                  {locationStatus === 'detected' && detectedCity === currentCity && detectedDistrict === d.district && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-200">
                      离你更近
                    </span>
                  )}
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
                      <span className="text-white font-medium text-sm">{activeDistrict.district} · 分区说明卡</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          color: getRiskColor(activeDistrict.riskLevel),
                          background: `${getRiskColor(activeDistrict.riskLevel)}20`,
                        }}
                      >
                        {getRiskLabel(activeDistrict.riskLevel)}
                      </span>
                    </div>
                    <p className="text-white/35 text-xs mt-1">
                      这张卡把官方 / 公共来源、趋势 / 参考和社区信号分开说明，便于判断“正式建议”“变化方向”“居民体感”分别来自哪里。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-slate-950/40 border border-white/10 p-3">
                    <p className="text-white/40 text-xs">近 7 日本地参考分</p>
                    <p className="text-2xl font-bold text-white mt-1">{Math.round(activeDistrict.riskScore)}</p>
                    <p className="text-xs mt-1" style={{ color: getRiskColor(activeDistrict.riskLevel) }}>
                      {getTrendLabel(activeDistrict.trend)} · {activeDistrict.trendPercent}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950/40 border border-white/10 p-3">
                    <p className="text-white/40 text-xs">居民近期高频不适</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeDistrict.topSymptoms.map(symptom => (
                        <span
                          key={symptom}
                          className="bg-cyan-500/10 text-cyan-200 text-xs px-2 py-0.5 rounded-full border border-cyan-400/15"
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
                      <p className="text-white/35 text-xs mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/45 text-xs mb-1.5">为什么近期要多看一眼</p>
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
                      <span className="text-cyan-200 text-xs">这张区域卡的信息来源</span>
                      <span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full">
                        分层查看
                      </span>
                    </div>
                    <div className="grid gap-2 mt-2.5">
                      {districtSourceCards.map(card => (
                        <div key={card.id} className={`rounded-xl border p-2.5 ${card.wrapperClass}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-medium ${card.tierClass}`}>{card.tier}</span>
                          </div>
                          <p className="text-white/85 text-xs mt-1">{card.title}</p>
                          <p className="text-white/60 text-xs leading-relaxed mt-1">{card.summary}</p>
                          <p className="text-white/35 text-xs leading-relaxed mt-2">{card.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 区块3：7日趋势图 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-white/60" />
                <span className="text-white font-medium text-sm">
                  {activeDistrictName ? `${activeDistrictName} · 7 日购药趋势` : '点击片区查看 7 日趋势'}
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

            {/* 每日上报趋势 */}
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-xs font-medium text-white/60 mb-3">每日上报趋势</p>
              <div className="flex items-end gap-px h-20">
                {dailyTrend.map((day, i) => {
                  const showLabel = timeRange <= 7 || (timeRange === 14 && i % 2 === 0) || (timeRange === 30 && i % 5 === 0)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div
                        className="w-full rounded-t bg-blue-400 transition-all"
                        style={{ height: `${(day.count / maxTrendCount) * 100}%` }}
                      />
                      {showLabel && <span className="text-[8px] text-white/40 truncate w-full text-center">{day.label}</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 区块4：AI预警分析 */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} className="text-blue-400" />
                <span className="text-white font-medium text-sm">自动趋势说明</span>
                <span className="text-white/30 text-xs ml-auto">基于脱敏指标自动生成</span>
              </div>
                  <p className="text-white/75 text-xs leading-relaxed whitespace-pre-line">
                    {warningText}
                  </p>
                  <p className="text-white/35 text-xs mt-3">
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
                    <span className="text-white font-medium text-sm">官方 / 公共来源对照</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-500/15 text-emerald-200 text-xs px-2 py-0.5 rounded-full">
                      {officialFreshnessLabel}
                    </span>
                    {officialTimeLabel && (
                      <span className="text-white/35 text-xs">公开资料最近标注时间：{officialTimeLabel}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-white/65 mt-2 leading-relaxed">
                  {dashboardSourceStatus.summary}
                </p>
                <p className="text-xs text-white/40 mt-2 leading-relaxed">
                  {dashboardSourceStatus.note}
                </p>
              </div>
            )}
            <OfficialSourceComparison
              records={dashboardSources}
              theme="dark"
              title={`${currentCity} 官方建议与就医入口`}
              subtitle={
                hasLocalOfficialSource
                  ? `优先展示 ${currentCity} 本地官方入口，再补国家级与国际参考；卡片会尽量直接打开原始发布页或服务页。`
                  : `暂未接入 ${currentCity} 本地官方来源，当前先提供国家级公开资料作为稳妥参考，并尽量直达原始页面。`
              }
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

      <div className="text-xs text-slate-400 text-center mt-4 px-4">
        <p>本平台数据基于季节性流行病学模型模拟生成</p>
        <p>不代表官方疫情数据，仅供公共卫生参考</p>
        <p>查看官方数据：<a href="https://www.chinacdc.cn" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">中国疾控中心</a></p>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400">
          企业/机构如需区域健康数据服务，
          <button onClick={onOpenB2B} className="text-blue-500 hover:underline">了解合作方案</button>
        </p>
      </div>
    </div>
  )
}
