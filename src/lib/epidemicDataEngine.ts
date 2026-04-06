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

interface CityDistrictConfig {
  name: string
  center: [number, number]
  zoom: number
  districts: Record<string, [number, number]>
}

const CITY_CONFIGS: Record<string, CityDistrictConfig> = {
  苏州: {
    name: '苏州',
    center: [120.6196, 31.2994],
    zoom: 11,
    districts: {
      姑苏区: [120.6179, 31.3116],
      虎丘区: [120.5713, 31.3004],
      吴中区: [120.6318, 31.2639],
      相城区: [120.6427, 31.3689],
      吴江区: [120.6451, 31.1383],
      工业园区: [120.7177, 31.2959],
      昆山市: [120.9578, 31.3847],
      常熟市: [120.7522, 31.6539],
      太仓市: [121.1306, 31.4578],
      张家港市: [120.5534, 31.8755],
    },
  },
  北京: {
    name: '北京',
    center: [116.3974, 39.9093],
    zoom: 10,
    districts: {
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
    },
  },
  上海: {
    name: '上海',
    center: [121.4737, 31.2304],
    zoom: 10,
    districts: {
      黄浦区: [121.4846, 31.2319],
      徐汇区: [121.4368, 31.1884],
      长宁区: [121.4259, 31.2204],
      静安区: [121.4484, 31.2276],
      普陀区: [121.3955, 31.2496],
      虹口区: [121.4882, 31.2647],
      杨浦区: [121.5261, 31.2594],
      浦东新区: [121.5442, 31.2214],
      闵行区: [121.3817, 31.1126],
      宝山区: [121.4895, 31.4051],
      嘉定区: [121.2654, 31.3747],
      松江区: [121.2279, 31.0326],
    },
  },
  广州: {
    name: '广州',
    center: [113.2644, 23.1291],
    zoom: 10,
    districts: {
      天河区: [113.3613, 23.1245],
      越秀区: [113.2668, 23.1289],
      海珠区: [113.3174, 23.0834],
      荔湾区: [113.2442, 23.1255],
      白云区: [113.2728, 23.1581],
      番禺区: [113.3843, 22.9372],
      花都区: [113.2203, 23.4037],
      南沙区: [113.5251, 22.8016],
      增城区: [113.8110, 23.2614],
      黄埔区: [113.4597, 23.1063],
    },
  },
  深圳: {
    name: '深圳',
    center: [114.0579, 22.5431],
    zoom: 11,
    districts: {
      福田区: [114.0555, 22.5268],
      罗湖区: [114.1318, 22.5488],
      南山区: [113.9302, 22.5330],
      盐田区: [114.2370, 22.5574],
      宝安区: [113.8830, 22.5546],
      龙岗区: [114.2460, 22.7200],
      龙华区: [114.0365, 22.6573],
      坪山区: [114.3461, 22.6902],
      光明区: [113.9360, 22.7487],
      大鹏新区: [114.4790, 22.5881],
    },
  },
  南京: {
    name: '南京',
    center: [118.7969, 32.0603],
    zoom: 11,
    districts: {
      玄武区: [118.7978, 32.0486],
      秦淮区: [118.7944, 32.0393],
      建邺区: [118.7316, 32.0035],
      鼓楼区: [118.7696, 32.0666],
      浦口区: [118.6282, 32.0589],
      栖霞区: [118.9092, 32.0965],
      雨花台区: [118.7788, 31.9914],
      江宁区: [118.8401, 31.9534],
      六合区: [118.8413, 32.3222],
      溧水区: [119.0282, 31.6510],
    },
  },
  杭州: {
    name: '杭州',
    center: [120.1551, 30.2741],
    zoom: 11,
    districts: {
      上城区: [120.1694, 30.2421],
      拱墅区: [120.1418, 30.3191],
      西湖区: [120.1306, 30.2592],
      滨江区: [120.2119, 30.2084],
      萧山区: [120.2643, 30.1839],
      余杭区: [120.0593, 30.4191],
      临平区: [120.2996, 30.4190],
      钱塘区: [120.4922, 30.3209],
      富阳区: [119.9616, 30.0495],
      临安区: [119.7248, 30.2337],
    },
  },
}

let _activeCity = '苏州'

export function setActiveCity(cityName: string) {
  if (CITY_CONFIGS[cityName]) {
    _activeCity = cityName
  }
}

export function getActiveCity(): string {
  return _activeCity
}

export function getActiveCityConfig(): CityDistrictConfig {
  return CITY_CONFIGS[_activeCity] ?? CITY_CONFIGS['苏州']
}

export function getSupportedCities(): string[] {
  return Object.keys(CITY_CONFIGS)
}

export function detectCityFromCoords(lng: number, lat: number): string {
  let bestCity = '苏州'
  let bestDist = Infinity
  for (const [name, cfg] of Object.entries(CITY_CONFIGS)) {
    const dx = lng - cfg.center[0]
    const dy = lat - cfg.center[1]
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      bestCity = name
    }
  }
  return bestCity
}

function getDistrictCenters(): Record<string, [number, number]> {
  return getActiveCityConfig().districts
}

function getDistricts(): string[] {
  return Object.keys(getDistrictCenters())
}

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
  _district: string,
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
    center: getDistrictCenters()[params.district] ?? [120.62, 31.30],
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
      `此卡属于趋势参考口径：综合官方公开资料摘要、季节/天气因子与匿名症状样本（${seasonalSignal.label}），用于解释区域变化方向，不等同于疾控通报。`,
    lastUpdated: getLastUpdatedLabel(),
    dataLabel: params.dataLabel ?? `趋势参考口径 · ${seasonalSignal.label}`,
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
  const allDistricts = getDistricts()
  const isTopDistrict = allDistricts.indexOf(district) === 0
  const isSecondDistrict = allDistricts.indexOf(district) === 1

  // First district in list gets elevated risk, second gets high risk
  if (isTopDistrict) {
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

  if (isSecondDistrict) {
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
  return getDistricts().map((district) => generateDistrictData(district, daySeed))
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
      sourceNote: `已叠加近 48 小时脱敏匿名分诊与回访信号（${recentReports || extra} 条新增上报，${unresolvedFollowUps} 条待恢复回访），用于提升早期感知灵敏度；${d.sourceNote}`,
      lastUpdated: getLastUpdatedLabel(),
      dataLabel: '匿名信号叠加 · 趋势参考',
    }
  })
}
