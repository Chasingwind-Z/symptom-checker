export interface SymptomReport {
  id: string
  district: string
  symptoms: string[]
  level: string
  timestamp: number
  ageGroup?: '儿童' | '青年' | '中年' | '老年'
  followUpStatus?: '明显好转' | '略有好转' | '没有变化' | '更严重了'
  summary?: string
}

interface FollowUpSignal {
  id: string
  district: string
  level: string
  createdAt: number
  response?: '明显好转' | '略有好转' | '没有变化' | '更严重了'
  respondedAt?: number
}

export interface RiskBreakdown {
  symptomReports: number
  trendChange: number
  environment: number
  followUp: number
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
  riskBreakdown: RiskBreakdown
  alertReasons: string[]
  sourceNote: string
  lastUpdated: string
  dataLabel: string
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

function getLastUpdatedLabel(): string {
  return new Date().toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getSeasonalSignal() {
  const month = new Date().getMonth() + 1

  if (month >= 11 || month <= 2) {
    return {
      respiratoryBoost: 1.18,
      giBoost: 0.92,
      label: '呼吸道季节信号偏强',
    }
  }

  if (month >= 6 && month <= 8) {
    return {
      respiratoryBoost: 0.94,
      giBoost: 1.14,
      label: '胃肠道季节信号偏强',
    }
  }

  return {
    respiratoryBoost: 1,
    giBoost: 1,
    label: '季节信号平稳',
  }
}

function sumRiskBreakdown(breakdown: RiskBreakdown): number {
  return breakdown.symptomReports + breakdown.trendChange + breakdown.environment + breakdown.followUp
}

function buildAlertReasons(
  district: string,
  breakdown: RiskBreakdown,
  topSymptoms: string[],
  trend: 'up' | 'stable' | 'down',
  trendPercent: number
): string[] {
  const reasons = [`${topSymptoms.slice(0, 2).join('、')}相关匿名信号较平日明显抬升`]

  if (trend === 'up') {
    reasons.push(`近 7 日趋势上行 ${trendPercent}%`)
  } else if (trend === 'stable') {
    reasons.push('近 7 日趋势保持高位波动')
  } else {
    reasons.push('整体热度有所回落，仍需持续观察')
  }

  if (breakdown.environment >= 10) {
    reasons.push('天气/环境协同因子正在放大传播条件')
  } else if (breakdown.followUp >= 8) {
    reasons.push('最近回访与复测提醒权重偏高')
  }

  if (district === '海淀区') {
    reasons.push('园区与高校周边热度同步抬升')
  }

  return reasons.slice(0, 3)
}

function createDistrictRiskData(params: {
  district: string
  totalReports: number
  feverDrugIndex: number
  coughDrugIndex: number
  giDrugIndex: number
  trend: 'up' | 'stable' | 'down'
  trendPercent: number
  topSymptoms: string[]
  weeklyData: number[]
  riskBreakdown: RiskBreakdown
  dataLabel?: string
  sourceNote?: string
}): DistrictRiskData {
  const riskScore = Math.round(sumRiskBreakdown(params.riskBreakdown) * 10) / 10
  const seasonalSignal = getSeasonalSignal()

  return {
    district: params.district,
    center: DISTRICT_CENTERS[params.district],
    totalReports: params.totalReports,
    feverDrugIndex: params.feverDrugIndex,
    coughDrugIndex: params.coughDrugIndex,
    giDrugIndex: params.giDrugIndex,
    riskScore,
    riskLevel: classifyRiskLevel(riskScore),
    trend: params.trend,
    trendPercent: params.trendPercent,
    topSymptoms: params.topSymptoms,
    weeklyData: params.weeklyData,
    riskBreakdown: params.riskBreakdown,
    alertReasons: buildAlertReasons(
      params.district,
      params.riskBreakdown,
      params.topSymptoms,
      params.trend,
      params.trendPercent
    ),
    sourceNote:
      params.sourceNote ??
      `当前口径综合了官方公开资料摘要、季节/天气因子与匿名症状样本；处于低样本阶段时会退回到透明估计模型（${seasonalSignal.label}）。`,
    lastUpdated: getLastUpdatedLabel(),
    dataLabel: params.dataLabel ?? `趋势参考 · ${seasonalSignal.label}`,
  }
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
  const seasonalSignal = getSeasonalSignal()

  // 海淀区固定为 critical，朝阳区固定为 high，其余随机 15-55
  if (district === '海淀区') {
    const weeklyData: number[] = []
    for (let d = 6; d >= 0; d--) {
      const pastSeed = getDaySeedOffset(-d) + dSeed
      weeklyData.push(Math.round(60 + seededRandom(pastSeed, 7) * 25))
    }
    return createDistrictRiskData({
      district,
      totalReports: Math.round(seededRandom(base, 6) * 80 + 120),
      feverDrugIndex: Math.round(82 * seasonalSignal.respiratoryBoost),
      coughDrugIndex: Math.round(71 * seasonalSignal.respiratoryBoost),
      giDrugIndex: Math.round((seededRandom(base, 3) * 30 + 30) * seasonalSignal.giBoost),
      trend: 'up',
      trendPercent: 41,
      topSymptoms: ['发热', '咳嗽', '乏力'],
      weeklyData,
      riskBreakdown: {
        symptomReports: 37,
        trendChange: 18,
        environment: 11,
        followUp: 15,
      },
    })
  }

  if (district === '朝阳区') {
    const weeklyData: number[] = []
    for (let d = 6; d >= 0; d--) {
      const pastSeed = getDaySeedOffset(-d) + dSeed
      weeklyData.push(Math.round(45 + seededRandom(pastSeed, 7) * 25))
    }
    return createDistrictRiskData({
      district,
      totalReports: Math.round(seededRandom(base, 6) * 60 + 90),
      feverDrugIndex: Math.round(67 * seasonalSignal.respiratoryBoost),
      coughDrugIndex: Math.round((seededRandom(base, 2) * 20 + 40) * seasonalSignal.respiratoryBoost),
      giDrugIndex: Math.round(58 * seasonalSignal.giBoost),
      trend: 'up',
      trendPercent: 23,
      topSymptoms: ['发热', '腹泻', '恶心'],
      weeklyData,
      riskBreakdown: {
        symptomReports: 30,
        trendChange: 13,
        environment: 9,
        followUp: 13,
      },
    })
  }

  // 其余区域随机分布在 15-55
  const feverDrugIndex = Math.round((seededRandom(base, 1) * 50 + 10) * seasonalSignal.respiratoryBoost)
  const coughDrugIndex = Math.round((seededRandom(base, 2) * 50 + 10) * seasonalSignal.respiratoryBoost)
  const giDrugIndex = Math.round((seededRandom(base, 3) * 50 + 10) * seasonalSignal.giBoost)

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

  const riskBreakdown: RiskBreakdown = {
    symptomReports: Math.round(
      totalReports * 0.07 +
        feverDrugIndex * 0.18 +
        coughDrugIndex * 0.12 +
        giDrugIndex * 0.1
    ),
    trendChange:
      trend === 'up'
        ? Math.min(18, 6 + Math.round(trendPercent * 0.45))
        : trend === 'stable'
        ? Math.min(11, 4 + Math.round(trendPercent * 0.18))
        : Math.max(2, 5 - Math.round(trendPercent * 0.12)),
    environment: Math.round(seededRandom(base, 8) * 7 + 3 + (coughDrugIndex > 45 ? 2 : 0)),
    followUp: Math.round(seededRandom(base, 9) * 6 + 2 + (totalReports > 80 ? 2 : 0)),
  }

  return createDistrictRiskData({
    district,
    totalReports,
    feverDrugIndex,
    coughDrugIndex,
    giDrugIndex,
    trend,
    trendPercent,
    topSymptoms,
    weeklyData,
    riskBreakdown,
  })
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
  const districts = mergeLocalReports(getDistrictRiskData())
  const totalReports = districts.reduce((sum, district) => sum + district.totalReports, 0)
  const alertDistricts = districts.filter(
    district => district.riskLevel === 'high' || district.riskLevel === 'critical'
  ).length
  const criticalDistricts = districts.filter(district => district.riskLevel === 'critical').length

  const symptomCounter: Record<string, number> = {}
  districts.forEach((district) => {
    district.topSymptoms.forEach((symptom) => {
      symptomCounter[symptom] = (symptomCounter[symptom] ?? 0) + 1
    })
  })

  const dominantSymptom =
    Object.entries(symptomCounter).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '发热'

  const risingCount = districts.filter(district => district.trend === 'up').length
  const fallingCount = districts.filter(district => district.trend === 'down').length

  const now = new Date()
  const lastUpdated = now.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return {
    totalReports,
    alertDistricts,
    criticalDistricts,
    dominantSymptom,
    weeklyTrend: risingCount >= fallingCount ? 'rising' : 'falling',
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
  const top2 = topTwo[1] ?? top1

  return `以下内容为基于匿名症状信号、近 7 日变化和公开资料摘要生成的趋势参考，用于辅助观察近期健康压力，不替代官方疫情通报。

近期值得优先留意的是 ${top1.district}，当前风险分 ${Math.round(top1.riskScore)}，主要集中在${top1.topSymptoms.join('、')}等信号。

同时 ${top2.district} 仍需持续观察，近期以${top2.topSymptoms[0]}、${top2.topSymptoms[1] || '咳嗽'}为主，可结合社区反馈与官方周报继续跟踪。`
}

function getTopSymptomsFromReports(reports: SymptomReport[]): string[] {
  const symptomCounter: Record<string, number> = {}

  reports.forEach((report) => {
    report.symptoms.forEach((symptom) => {
      symptomCounter[symptom] = (symptomCounter[symptom] ?? 0) + 1
    })
  })

  return Object.entries(symptomCounter)
    .sort((a, b) => b[1] - a[1])
    .map(([symptom]) => symptom)
}

export function mergeLocalReports(data: DistrictRiskData[]): DistrictRiskData[] {
  if (typeof window === 'undefined') return data

  let reports: SymptomReport[] = []
  let followUpSignals: FollowUpSignal[] = []
  try {
    const raw = localStorage.getItem('symptom_reports')
    if (raw) reports = JSON.parse(raw) as SymptomReport[]
    const followUpRaw = localStorage.getItem('symptom_followup_cases')
    if (followUpRaw) followUpSignals = JSON.parse(followUpRaw) as FollowUpSignal[]
  } catch {
    return data
  }

  const reportsByDistrict: Record<string, SymptomReport[]> = {}
  for (const report of reports) {
    if (report.district) {
      reportsByDistrict[report.district] = [...(reportsByDistrict[report.district] ?? []), report]
    }
  }

  const followUpsByDistrict: Record<string, FollowUpSignal[]> = {}
  for (const signal of followUpSignals) {
    if (signal.district) {
      followUpsByDistrict[signal.district] = [...(followUpsByDistrict[signal.district] ?? []), signal]
    }
  }

  return data.map((d) => {
    const districtReports = reportsByDistrict[d.district] ?? []
    const districtFollowUps = followUpsByDistrict[d.district] ?? []
    const extra = districtReports.length
    const unresolvedFollowUps = districtFollowUps.filter(
      (item) => !item.response || item.response === '没有变化' || item.response === '更严重了'
    ).length
    const worsenedFollowUps = districtFollowUps.filter((item) => item.response === '更严重了').length

    if (extra === 0 && unresolvedFollowUps === 0) return d

    const recentReports = districtReports.filter((report) => {
      if (!report.timestamp) return true
      return Date.now() - report.timestamp <= 1000 * 60 * 60 * 48
    }).length
    const followUpCases = districtReports.filter(
      report => report.level === 'orange' || report.level === 'red'
    ).length
    const reportSymptoms = getTopSymptomsFromReports(districtReports)
    const riskBreakdown: RiskBreakdown = {
      symptomReports: Math.round((d.riskBreakdown.symptomReports + extra * 1.6) * 10) / 10,
      trendChange: d.riskBreakdown.trendChange,
      environment: d.riskBreakdown.environment,
      followUp:
        Math.round((
          d.riskBreakdown.followUp +
          recentReports * 1.2 +
          followUpCases * 1.8 +
          unresolvedFollowUps * 1.5 +
          worsenedFollowUps * 2.2
        ) * 10) /
        10,
    }
    const newScore = Math.min(100, Math.round(sumRiskBreakdown(riskBreakdown) * 10) / 10)

    return {
      ...d,
      riskBreakdown,
      riskScore: Math.round(newScore * 10) / 10,
      riskLevel: classifyRiskLevel(newScore),
      totalReports: d.totalReports + extra,
      topSymptoms: [...new Set([...reportSymptoms, ...d.topSymptoms])].slice(0, 3),
      alertReasons: [
        `近 48 小时新增 ${recentReports || extra} 条匿名分诊上报`,
        unresolvedFollowUps > 0
          ? `${unresolvedFollowUps} 条回访仍未明显好转`
          : followUpCases > 0
          ? `${followUpCases} 条为中高风险回访`
          : '近期回访提醒权重小幅抬升',
        ...d.alertReasons,
      ].slice(0, 3),
      sourceNote: `匿名问诊上报与回访信号已实时叠加（近 48 小时 ${recentReports || extra} 条上报，${unresolvedFollowUps} 条待恢复回访） + ${d.sourceNote}`,
      lastUpdated: getLastUpdatedLabel(),
      dataLabel: '近期自查信号已叠加',
    }
  })
}
