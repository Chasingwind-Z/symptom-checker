import type { ProfileDraft } from './healthData'
import type { DiagnosisResult, RiskLevel } from '../types'

export interface AftercarePlanStep {
  id: string
  windowLabel: string
  title: string
  description: string
  tone: RiskLevel | 'slate'
}

export interface AftercarePlan {
  headline: string
  note: string
  steps: AftercarePlanStep[]
}

function hasElevatedRiskProfile(profile?: ProfileDraft) {
  if (!profile) return false

  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : null
  return Boolean(
    (age !== null && (age < 18 || age >= 60)) || profile.chronicConditions.trim() || profile.currentMedications.trim()
  )
}

function buildEscalationDescription(level: RiskLevel) {
  switch (level) {
    case 'green':
      return '若症状持续不缓解，或出现发热明显升高、呼吸不适、剧烈疼痛等变化，不要继续单纯观察。'
    case 'yellow':
      return '如果等待就诊期间明显加重，或出现胸痛、呼吸困难、意识改变等危险信号，应改为当天线下处理。'
    case 'orange':
      return '若出现胸痛、呼吸困难、意识改变、持续加重等危险信号，不要再等待门诊，直接急诊。'
    case 'red':
      return '在救援或就诊途中，如意识、呼吸或出血情况继续恶化，应立即寻求急救人员支持。'
  }
}

export function buildAftercarePlan(result: DiagnosisResult, profile?: ProfileDraft): AftercarePlan {
  const elevatedRiskProfile = hasElevatedRiskProfile(profile)
  const note = elevatedRiskProfile
    ? '已结合年龄 / 慢病 / 现用药等背景降低观察阈值；如果你是为儿童、老人或慢病家人咨询，建议更早线下确认。'
    : '这是一份诊后执行顺序，方便你把“现在做什么”和“接下来怎么观察”拆开处理。'

  switch (result.level) {
    case 'green':
      return {
        headline: '先按居家观察节奏处理',
        note,
        steps: [
          {
            id: 'now',
            windowLabel: '现在',
            title: '先休息、补水并减少刺激',
            description: result.action,
            tone: 'green',
          },
          {
            id: 'next-day',
            windowLabel: '24-48 小时',
            title: '记录有没有明显好转',
            description: '关注体温、疼痛、咳嗽或食欲变化；若逐步缓解，可继续观察。',
            tone: 'slate',
          },
          {
            id: 'escalate',
            windowLabel: '一旦加重',
            title: '及时升级处理',
            description: buildEscalationDescription(result.level),
            tone: 'yellow',
          },
        ],
      }
    case 'yellow':
      return {
        headline: '先稳住症状，再安排 48 小时内就诊',
        note,
        steps: [
          {
            id: 'now',
            windowLabel: '现在',
            title: '先完成基础处理',
            description: result.action,
            tone: 'yellow',
          },
          {
            id: 'soon',
            windowLabel: '48 小时内',
            title: '尽快安排门诊或线上医生',
            description: '准备最近症状变化、体温 / 用药记录和本次分诊摘要，方便更快进入下一步判断。',
            tone: 'yellow',
          },
          {
            id: 'escalate',
            windowLabel: '若明显变差',
            title: '不要继续等待',
            description: buildEscalationDescription(result.level),
            tone: 'orange',
          },
        ],
      }
    case 'orange':
      return {
        headline: '今天内把线下就医和陪同安排好',
        note,
        steps: [
          {
            id: 'now',
            windowLabel: '现在',
            title: '优先准备出行就医',
            description: result.action,
            tone: 'orange',
          },
          {
            id: 'today',
            windowLabel: '今天',
            title: '带上病历、药物和过敏信息',
            description: '如果你在为老人、儿童或慢病家人处理，尽量不要单独前往，并提前整理既往病史。',
            tone: 'orange',
          },
          {
            id: 'escalate',
            windowLabel: '若继续恶化',
            title: '直接升级到急诊',
            description: buildEscalationDescription(result.level),
            tone: 'red',
          },
        ],
      }
    case 'red':
      return {
        headline: '不要再等待，直接急诊 / 120',
        note,
        steps: [
          {
            id: 'now',
            windowLabel: '现在',
            title: '立即呼救或前往急诊',
            description: result.action,
            tone: 'red',
          },
          {
            id: 'transit',
            windowLabel: '途中',
            title: '尽量有人陪同并保持信息可交接',
            description: '提前准备过敏史、现用药、既往病史和主要症状开始时间，方便到院后快速接诊。',
            tone: 'orange',
          },
          {
            id: 'escalate',
            windowLabel: '等待期间',
            title: '持续观察危险信号',
            description: buildEscalationDescription(result.level),
            tone: 'red',
          },
        ],
      }
  }
}
