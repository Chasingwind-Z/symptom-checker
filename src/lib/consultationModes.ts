export type ConsultationModeId = 'self' | 'child' | 'elderly' | 'chronic'

export interface ConsultationModePreset {
  id: ConsultationModeId
  label: string
  subtitle: string
  summary: string
  placeholder: string
  promptNote: string
  starterPrompts: string[]
}

export const CONSULTATION_MODE_PRESETS: readonly ConsultationModePreset[] = [
  {
    id: 'self',
    label: '本人',
    subtitle: '标准问诊',
    summary: '适合自己描述本次不适，按标准问诊流程追问。',
    placeholder: '描述这次哪里不舒服、持续多久，以及是否发热、疼痛或影响活动…',
    promptNote: '当前是“本人”模式。默认按标准成人问诊流程追问，但如果用户提到老人、孩子、孕产或慢病，请立即切换到更保守策略。',
    starterPrompts: [
      '发烧 38.5℃，要不要去医院',
      '头痛三天了，还需要继续观察吗',
      '肚子痛半天了，要不要挂消化内科',
      '先把过敏史和现在用药说清楚',
    ],
  },
  {
    id: 'child',
    label: '儿童守护',
    subtitle: '儿科优先',
    summary: '更适合孩子、宝宝或婴幼儿的症状描述，会优先使用更保守的儿科视角。',
    placeholder: '描述孩子哪里不舒服、持续多久、体温多少，以及精神/进食/呼吸情况…',
    promptNote: '当前是“儿童守护”模式。把儿童/婴幼儿视为更需要保守判断的人群，优先确认体温、精神状态、进食饮水和呼吸情况，并倾向儿科建议。',
    starterPrompts: [
      '孩子发烧 38.7℃，精神一般，要不要马上去医院',
      '孩子咳嗽三天，晚上更重',
      '宝宝吐奶又哭闹，要先观察还是就医',
      '先说明孩子年龄、体重和这两天吃喝情况',
    ],
  },
  {
    id: 'elderly',
    label: '老人守护',
    subtitle: '高风险优先',
    summary: '更适合帮家里老人问，系统会提高对高危因素和线下就医时机的警惕。',
    placeholder: '描述老人现在最主要的不适、持续多久、有没有头晕胸闷发热，以及既往慢病…',
    promptNote: '当前是“老人守护”模式。要优先结合高龄、基础病、现用药和精神状态做更保守判断，不要默认按普通成人轻症处理。',
    starterPrompts: [
      '家里老人头晕两天了，今天更没精神',
      '老人咳嗽伴低烧，要不要尽快去门诊',
      '老人胸闷气短，先判断现在严不严重',
      '先把老人慢病、现用药和最近血压血糖说清楚',
    ],
  },
  {
    id: 'chronic',
    label: '慢病守护',
    subtitle: '基础病叠加',
    summary: '更适合高血压、糖尿病、哮喘等慢病或多药并用场景，会先核对风险和用药冲突。',
    placeholder: '描述本次不适、慢病背景、现用药，以及最担心会不会和原有疾病或药物冲突…',
    promptNote: '当前是“慢病守护”模式。要主动把慢病、过敏史和现用药视为优先上下文，先核对风险与药物冲突，再给家庭处理或就医建议。',
    starterPrompts: [
      '我有高血压和糖尿病，今天发烧了',
      '慢病用药期间又咳嗽，先判断能不能自己处理',
      '先把现在吃的药和过敏史说明白，再看这次不适',
      '想先确认这次症状会不会和原有慢病叠加变严重',
    ],
  },
]

export function getConsultationModePreset(
  modeId?: ConsultationModeId | null
): ConsultationModePreset | null {
  if (!modeId) return null
  return CONSULTATION_MODE_PRESETS.find((item) => item.id === modeId) ?? null
}
