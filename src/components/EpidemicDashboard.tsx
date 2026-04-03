import { useEffect, useRef, useState } from 'react'
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
import type { CityOverview, DistrictRiskData } from '../lib/epidemicDataEngine'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler)

interface Props {
  onBack: () => void
}

const getRiskColor = (level: string) =>
  ({ low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' }[level] ?? '#10B981')

export function EpidemicDashboard({ onBack }: Props) {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [cityOverview, setCityOverview] = useState<CityOverview>(getCityOverview())
  const [districtData, setDistrictData] = useState<DistrictRiskData[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
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

  // 初始化区域数据
  useEffect(() => {
    const raw = getDistrictRiskData()
    const merged = mergeLocalReports(raw)
    setDistrictData(merged)
  }, [])

  // 绘制地图覆盖物
  useEffect(() => {
    if (districtData.length === 0) return

    const initMap = () => {
      if (!mapContainerRef.current || !(window as any).AMap) return
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
    }

    if ((window as any).AMap) {
      initMap()
    } else {
      const key = import.meta.env.VITE_AMAP_JS_KEY as string
      const securityKey = import.meta.env.VITE_AMAP_JS_SECURITY_KEY as string
      ;(window as any)._AMapSecurityConfig = { securityJsCode: securityKey }

      const existing = document.getElementById('amap-script')
      if (existing) {
        existing.addEventListener('load', initMap)
      } else {
        const script = document.createElement('script')
        script.id = 'amap-script'
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
        script.onload = initMap
        document.head.appendChild(script)
      }
    }

    return () => {
      circlesRef.current.forEach(c => c.setMap?.(null))
      circlesRef.current = []
    }
  }, [districtData])

  // 卸载时销毁地图
  useEffect(() => {
    return () => {
      circlesRef.current.forEach(c => c.setMap?.(null))
      mapRef.current?.destroy?.()
    }
  }, [])

  const trendDistrict = selectedDistrict || districtData[0]?.district
  const trendData = trendDistrict ? getDrugTrendData(trendDistrict) : null
  const warningText = districtData.length > 0 ? getAIWarningText(districtData) : ''
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const sortedDistricts = [...districtData].sort((a, b) => b.riskScore - a.riskScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse mr-3 flex-shrink-0" />
          <span className="text-white font-bold text-xl">公共卫生疾病预警平台</span>
          <span className="text-white/40 text-xs ml-4 tracking-widest hidden md:block">
            SURVEILLANCE SYSTEM · 实时监测
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm font-mono">{currentTime}</span>
          <span className="bg-white/10 text-white/50 text-xs px-3 py-1 rounded-full">
            数据来源：匿名购药行为分析
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
                <p className="text-white/50 text-xs mt-1">今日上报症状数</p>
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
                <p className="text-white/50 text-xs mt-1">存在异常区域</p>
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
                <p className="text-white/50 text-xs mt-1">高风险区域</p>
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
                <p className="text-white/50 text-xs mt-1">本周主要症状</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 主体内容区 */}
        <div className="flex-1 grid grid-cols-5 gap-6 min-h-0">
          {/* 左侧地图区 */}
          <div className="col-span-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Map size={16} className="text-white/60" />
                <span className="text-white font-medium text-sm">各区风险热力分布</span>
              </div>
              <div className="flex items-center gap-3">
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
            <div ref={mapContainerRef} style={{ height: '440px', width: '100%' }} />
          </div>

          {/* 右侧数据面板 */}
          <div className="col-span-2 flex flex-col gap-4 min-h-0">
            {/* 区块1：风险排行榜 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={16} className="text-white/60" />
                <span className="text-white font-medium text-sm">区域风险排行</span>
              </div>
              {sortedDistricts.map((d, i) => (
                <div
                  key={d.district}
                  onClick={() => setSelectedDistrict(d.district)}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                    selectedDistrict === d.district ? 'bg-white/15' : 'hover:bg-white/10'
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

            {/* 区块2：7日趋势图 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-white/60" />
                <span className="text-white font-medium text-sm">
                  {selectedDistrict ? `${selectedDistrict} · 7日购药趋势` : '点击区域查看趋势'}
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

            {/* 区块3：AI预警分析 */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} className="text-blue-400" />
                <span className="text-white font-medium text-sm">AI 预警研判</span>
                <span className="text-white/30 text-xs ml-auto">由大语言模型生成</span>
              </div>
              <p className="text-white/75 text-xs leading-relaxed whitespace-pre-line">
                {warningText}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-white/30 text-xs">生成时间：{today}</span>
                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                  数据置信度：中
                </span>
              </div>
            </div>
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
          .join('　　|　　')
        const fullContent = `${marqueeContent}　　|　　${marqueeContent}`
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
