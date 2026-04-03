export interface SymptomReport {
  id: string
  district: string
  symptoms: string[]
  level: string
  timestamp: number
  ageGroup?: '儿童' | '青年' | '中年' | '老年'
}

export interface DistrictRiskData {
  district: string
  center: [number, number]
  totalReports: number
  feverDrugIndex: number
  coughDrugIndex: number
  giDrugIndex: number
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  trend: 'up' | 'stable' | 'down'
  trendPercent: number
  topSymptoms: string[]
  weeklyData: number[]
}

export interface CityOverview {
  totalReports: number
  alertDistricts: number
  criticalDistricts: number
  dominantSymptom: string
  weeklyTrend: 'rising' | 'stable' | 'falling'
  lastUpdated: string
}

const DISTRICT_CENTERS: Record<string, [number, number]> = {
  朝阳区: [116.4432, 39.9219],
  海淀区: [116.3178, 39.984],
  东城区: [116.4201, 39.9547],
  西城区: [116.3634, 39.9219],
  丰台区: [116.287, 39.8584],
  石景山区: [116.1955, 39.9146],
  通州区: [116.656, 39.9022],
  顺义区: [116.6544, 40.13],
  昌平区: [116.2316, 40.2207],
  大兴区: [116.3406, 39.7268],
  房山区: [116.0432, 39.7354],
  门头沟区: [116.1019, 39.9404],
}

const DISTRICTS = Object.keys(DISTRICT_CENTERS)

const TOP_SYMPTOMS_POOL = [
  '发热',
  '咳嗽',
  '流涕',
  '咽痛',
  '乏力',
  '头痛',
  '腹泻',
  '恶心',
  '肌肉酸痛',
  '胸闷',
]

export const RISK_COLORS: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
}

const seededRandom = (seed: number, offset: number = 0): number => {
  const x = Math.sin(seed + offset) * 10000
  return x - Math.floor(x)
}

function getDaySeed(): number {
  const now = new Date()
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
}

function getDistrictSeed(district: string): number {
  return district.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

function classifyRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 30) return 'low'
  if (score <= 55) return 'medium'
  if (score <= 75) return 'high'
  return 'critical'
}

function generateDistrictData(district: string, daySeed: number): DistrictRiskData {
  const dSeed = getDistrictSeed(district)
  const base = daySeed + dSeed

  // 海淀区固定为 critical，朝阳区固定为 high，其余随机 15-55
  if (district === '海淀区') {
    const weeklyData: number[] = []
    for (let d = 6; d >= 0; d--) {
      const pastSeed = getDaySeedOffset(-d) + dSeed
      weeklyData.push(Math.round(60 + seededRandom(pastSeed, 7) * 25))
    }
    return {
      district,
      center: DISTRICT_CENTERS[district],
      totalReports: Math.round(seededRandom(base, 6) * 80 + 120),
      feverDrugIndex: 82,
      coughDrugIndex: 71,
      giDrugIndex: Math.round(seededRandom(base, 3) * 30 + 30),
      riskScore: 81,
      riskLevel: 'critical',
      trend: 'up',
      trendPercent: 41,
      topSymptoms: ['退烧药', '止咳药', '抗病毒药'],
      weeklyData,
    }
  }

  if (district === '朝阳区') {
    const weeklyData: number[] = []
    for (let d = 6; d >= 0; d--) {
      const pastSeed = getDaySeedOffset(-d) + dSeed
      weeklyData.push(Math.round(45 + seededRandom(pastSeed, 7) * 25))
    }
    return {
      district,
      center: DISTRICT_CENTERS[district],
      totalReports: Math.round(seededRandom(base, 6) * 60 + 90),
      feverDrugIndex: 67,
      coughDrugIndex: Math.round(seededRandom(base, 2) * 20 + 40),
      giDrugIndex: 58,
      riskScore: 65,
      riskLevel: 'high',
      trend: 'up',
      trendPercent: 23,
      topSymptoms: ['退烧药', '肠胃药', '止泻药'],
      weeklyData,
    }
  }

  // 其余区域随机分布在 15-55
  const feverDrugIndex = Math.round(seededRandom(base, 1) * 50 + 10)
  const coughDrugIndex = Math.round(seededRandom(base, 2) * 50 + 10)
  const giDrugIndex = Math.round(seededRandom(base, 3) * 50 + 10)

  const riskScore = Math.min(
    55,
    Math.round(feverDrugIndex * 0.4 + coughDrugIndex * 0.35 + giDrugIndex * 0.25)
  )

  const riskLevel = classifyRiskLevel(riskScore)

  const trendRaw = seededRandom(base, 4)
  let trend: 'up' | 'stable' | 'down'
  if (trendRaw < 0.33) trend = 'down'
  else if (trendRaw < 0.66) trend = 'stable'
  else trend = 'up'

  const trendPercent = Math.round(seededRandom(base, 5) * 20 + 1)
  const totalReports = Math.round(seededRandom(base, 6) * 100 + 20)

  const topSymptoms: string[] = []
  const pool = [...TOP_SYMPTOMS_POOL]
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(seededRandom(base, 10 + i) * pool.length)
    topSymptoms.push(pool.splice(idx, 1)[0])
  }

  const weeklyData: number[] = []
  for (let d = 6; d >= 0; d--) {
    const pastSeed = getDaySeedOffset(-d) + dSeed
    const ps = Math.min(
      55,
      Math.round(
        seededRandom(pastSeed, 1) * 50 * 0.4 +
          seededRandom(pastSeed, 2) * 50 * 0.35 +
          seededRandom(pastSeed, 3) * 50 * 0.25 +
          10
      )
    )
    weeklyData.push(ps)
  }

  return {
    district,
    center: DISTRICT_CENTERS[district],
    totalReports,
    feverDrugIndex,
    coughDrugIndex,
    giDrugIndex,
    riskScore,
    riskLevel,
    trend,
    trendPercent,
    topSymptoms,
    weeklyData,
  }
}

function getDaySeedOffset(offset: number): number {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export function getDistrictRiskData(): DistrictRiskData[] {
  const daySeed = getDaySeed()
  return DISTRICTS.map((district) => generateDistrictData(district, daySeed))
}

export function getCityOverview(): CityOverview {
  const daySeed = getDaySeed()
  const totalReports = Math.round(400 + seededRandom(daySeed, 99) * 200)

  const now = new Date()
  const lastUpdated = now.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return {
    totalReports,
    alertDistricts: 4,
    criticalDistricts: 1,
    dominantSymptom: '发烧',
    weeklyTrend: 'rising',
    lastUpdated,
  }
}

export function getDrugTrendData(district: string): {
  labels: string[]
  fever: number[]
  cough: number[]
  gi: number[]
} {
  const dSeed = getDistrictSeed(district)
  const labels: string[] = []
  const fever: number[] = []
  const cough: number[] = []
  const gi: number[] = []

  for (let d = 6; d >= 0; d--) {
    const dayObj = new Date()
    dayObj.setDate(dayObj.getDate() - d)
    const daySeed = dayObj.getFullYear() * 10000 + (dayObj.getMonth() + 1) * 100 + dayObj.getDate()
    const base = daySeed + dSeed

    labels.push(`${dayObj.getMonth() + 1}/${dayObj.getDate()}`)
    fever.push(Math.round(seededRandom(base, 1) * 80 + 10))
    cough.push(Math.round(seededRandom(base, 2) * 80 + 10))
    gi.push(Math.round(seededRandom(base, 3) * 80 + 10))
  }

  return { labels, fever, cough, gi }
}

export function getAIWarningText(data: DistrictRiskData[]): string {
  const topTwo = [...data].sort((a, b) => b.riskScore - a.riskScore).slice(0, 2)
  const top1 = topTwo[0]
  const top2 = topTwo[1]

  const coughRise = top1.coughDrugIndex > 50
    ? Math.round(top1.coughDrugIndex * 0.4)
    : 18

  return `⚠️ 高风险预警：本周${top1.district}退烧药购买指数达到 ${Math.round(top1.feverDrugIndex)}，较上周上涨 ${top1.trendPercent}%，止咳药同步上升 ${coughRise}%。结合历史数据模型判断，该区域极可能正处于流感样疾病早期传播阶段。

📍 次级关注：${top2.district}${top2.topSymptoms[1] || '肠胃'}类药品购买量出现异常，建议关注消化道疾病聚集性风险。

🏥 行动建议：建议${top1.district}各社区卫生中心提前备充退烧、止咳类药物库存，适当扩充发热门诊接诊能力。预计未来 3-5 天相关就诊量将增加 20-35%。`
}

export function mergeLocalReports(data: DistrictRiskData[]): DistrictRiskData[] {
  if (typeof window === 'undefined') return data

  let reports: SymptomReport[] = []
  try {
    const raw = localStorage.getItem('symptom_reports')
    if (raw) reports = JSON.parse(raw) as SymptomReport[]
  } catch {
    return data
  }

  const countByDistrict: Record<string, number> = {}
  for (const report of reports) {
    if (report.district) {
      countByDistrict[report.district] = (countByDistrict[report.district] ?? 0) + 1
    }
  }

  return data.map((d) => {
    const extra = countByDistrict[d.district] ?? 0
    if (extra === 0) return d

    const newScore = Math.min(100, d.riskScore + extra * 0.5)
    return {
      ...d,
      riskScore: Math.round(newScore * 10) / 10,
      riskLevel: classifyRiskLevel(newScore),
      totalReports: d.totalReports + extra,
    }
  })
}
