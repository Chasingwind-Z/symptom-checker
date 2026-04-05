import type { DiagnosisResult } from '../types';
import type { CaseHistoryItem, ProfileDraft } from './healthData';

export interface DemoPersonaSummary {
  id: string;
  label: string;
  subtitle: string;
  tags: string[];
}

interface DemoPersona extends DemoPersonaSummary {
  profile: ProfileDraft;
  recentCases: CaseHistoryItem[];
}

export interface PersonalizedInsight {
  id: string;
  title: string;
  summary: string;
  details: string[];
  tone: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose';
}

export interface MedicationAdvice {
  id: string;
  title: string;
  useCase: string;
  reason: string;
  caution: string;
  suitable: boolean;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'urban-commuter',
    label: '都市通勤型',
    subtitle: '适合演示呼吸道 / 过敏场景',
    tags: ['上班族', '过敏', '夜间作息晚'],
    profile: {
      displayName: '林晨',
      city: '北京',
      birthYear: 1992,
      gender: '男',
      medicalNotes: '春季容易鼻塞、咽痒，工作日休息不足。',
      chronicConditions: '过敏性鼻炎',
      allergies: '青霉素',
      currentMedications: '氯雷他定（按需）',
      careFocus: '想更快判断是否需要线下就诊',
      profileMode: 'demo',
    },
    recentCases: [
      {
        id: 'demo-case-commuter-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        chiefComplaint: '咽痛伴轻咳两天',
        triageLevel: 'yellow',
        status: 'closed',
        assistantPreview: '建议先观察体温变化，若伴高热或气促，48 小时内就医。',
        departments: ['呼吸内科', '全科医学科'],
        source: 'local',
      },
      {
        id: 'demo-case-commuter-2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        chiefComplaint: '鼻塞流涕，晨起更明显',
        triageLevel: 'green',
        status: 'closed',
        assistantPreview: '更像上呼吸道刺激或过敏表现，可先做短期对症处理。',
        departments: ['耳鼻喉科', '全科医学科'],
        source: 'local',
      },
    ],
  },
  {
    id: 'senior-chronic',
    label: '长辈慢病型',
    subtitle: '适合演示高风险守护场景',
    tags: ['老年人', '高血压', '需更保守判断'],
    profile: {
      displayName: '王阿姨',
      city: '北京',
      birthYear: 1958,
      gender: '女',
      medicalNotes: '有高血压史，最近偶尔头晕。',
      chronicConditions: '高血压、血糖偏高',
      allergies: '',
      currentMedications: '氯沙坦 50mg 每日、二甲双胍',
      careFocus: '更关注今天要不要去医院、是否适合家人陪同',
      profileMode: 'demo',
    },
    recentCases: [
      {
        id: 'demo-case-senior-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
        chiefComplaint: '咳嗽伴乏力三天',
        triageLevel: 'orange',
        status: 'closed',
        assistantPreview: '因合并慢病和年龄因素，建议当天评估，优先呼吸内科/全科。',
        departments: ['呼吸内科', '全科医学科'],
        source: 'local',
      },
      {
        id: 'demo-case-senior-2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
        chiefComplaint: '晨起头晕、血压波动',
        triageLevel: 'yellow',
        status: 'closed',
        assistantPreview: '建议记录血压并尽快复诊，避免自行停药。',
        departments: ['心内科', '全科医学科'],
        source: 'local',
      },
    ],
  },
  {
    id: 'family-guardian',
    label: '家庭守护型',
    subtitle: '适合演示儿童 / 家庭管理',
    tags: ['儿童照护', '家庭药箱', '夜间咳嗽'],
    profile: {
      displayName: '张妈妈',
      city: '北京',
      birthYear: 1988,
      gender: '女',
      medicalNotes: '家中有 6 岁儿童，夜间咳嗽时比较焦虑。',
      chronicConditions: '',
      allergies: '布洛芬疑似不耐受',
      currentMedications: '家中常备儿童退热贴、生理盐水',
      careFocus: '希望获得儿童优先的随访和用药提醒',
      profileMode: 'demo',
    },
    recentCases: [
      {
        id: 'demo-case-family-1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        chiefComplaint: '孩子夜间咳嗽、白天精神尚可',
        triageLevel: 'yellow',
        status: 'closed',
        assistantPreview: '建议观察呼吸频率和体温，必要时儿科复诊。',
        departments: ['儿科', '呼吸内科'],
        source: 'local',
      },
    ],
  },
];

function getAge(profile?: Partial<ProfileDraft> | null): number | null {
  if (!profile?.birthYear) return null;
  return Math.max(0, new Date().getFullYear() - profile.birthYear);
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function getTopDepartment(recentCases: CaseHistoryItem[]): string | null {
  const counter = new Map<string, number>();
  recentCases.forEach((item) => {
    item.departments.forEach((department) => {
      counter.set(department, (counter.get(department) ?? 0) + 1);
    });
  });

  return Array.from(counter.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

export function getDemoPersonaSummaries(): DemoPersonaSummary[] {
  return DEMO_PERSONAS.map(({ id, label, subtitle, tags }) => ({ id, label, subtitle, tags }));
}

export function getDemoPersonaWorkspace(id: string) {
  const persona = DEMO_PERSONAS.find((item) => item.id === id);
  if (!persona) return null;

  return {
    profile: { ...persona.profile },
    recentCases: persona.recentCases.map((item) => ({ ...item })),
    label: persona.label,
  };
}

export function getDefaultDemoPersonaWorkspace() {
  return getDemoPersonaWorkspace('urban-commuter') ?? getDemoPersonaWorkspace(DEMO_PERSONAS[0].id);
}

export function buildCombinedMedicalNotes(profile?: Partial<ProfileDraft> | null): string {
  if (!profile) return '';

  return [
    profile.medicalNotes,
    profile.chronicConditions ? `慢病/既往史：${profile.chronicConditions}` : '',
    profile.allergies ? `过敏史：${profile.allergies}` : '',
    profile.currentMedications ? `当前用药：${profile.currentMedications}` : '',
    profile.careFocus ? `关注重点：${profile.careFocus}` : '',
  ]
    .filter((item): item is string => Boolean(item && item.trim()))
    .join('；');
}

export function getMedicationGuidance(
  diagnosis: DiagnosisResult,
  profile?: Partial<ProfileDraft> | null
): MedicationAdvice[] {
  const age = getAge(profile);
  const combinedNotes = buildCombinedMedicalNotes(profile);
  const lowerText = `${diagnosis.reason} ${diagnosis.action} ${diagnosis.departments.join(' ')}`.toLowerCase();

  if (diagnosis.level === 'orange' || diagnosis.level === 'red') {
    return [
      {
        id: 'urgent-offline-care',
        title: '当前更适合线下评估',
        useCase: '当前风险等级较高，应优先考虑当日就医或急诊通道。',
        reason: '这类情况更需要医生面诊、生命体征评估或进一步检查，不建议仅依赖家庭药箱。',
        caution: '此时可以做的更多是补水、休息和准备病历，不建议延误就医。',
        suitable: false,
      },
    ];
  }

  const suggestions: MedicationAdvice[] = [];
  const hasPenicillinAllergy = includesAny(combinedNotes, ['青霉素']);
  const hasGastricRisk = includesAny(combinedNotes, ['胃溃疡', '消化道出血', '肾功能']);
  const hasLiverRisk = includesAny(combinedNotes, ['肝病', '肝功能']);

  if (includesAny(lowerText, ['发热', '头痛', '肌肉酸痛', '咽痛', '疼痛'])) {
    suggestions.push({
      id: 'acetaminophen',
      title: '对乙酰氨基酚（退热 / 止痛方向）',
      useCase: '适合轻中度发热、头痛、肌肉酸痛的短期对症缓解。',
      reason: '这次症状更偏向发热或疼痛控制，短期使用更容易操作，也便于和就医观察配合。',
      caution: hasLiverRisk
        ? '若有明显肝病或长期饮酒，请先咨询医生或药师后再决定是否使用。'
        : '注意不要与其他含相同成分的感冒药重复使用。',
      suitable: !hasLiverRisk,
    });

    suggestions.push({
      id: 'ibuprofen',
      title: '布洛芬（退热 / 消炎止痛方向）',
      useCase: '适合体温升高伴疼痛不适的短期缓解。',
      reason: '若没有胃溃疡、明显肾功能问题，布洛芬常用于发热和疼痛管理。',
      caution:
        age !== null && age < 6
          ? '儿童使用需严格遵医嘱；当前档案年龄不建议默认自用。'
          : hasGastricRisk
          ? '若有胃溃疡、消化道出血或肾功能问题，不建议优先使用。'
          : '餐后使用更稳妥，如症状持续需进一步评估病因。',
      suitable: !(age !== null && age < 6) && !hasGastricRisk,
    });
  }

  if (includesAny(lowerText, ['咳嗽', '咽痒', '咽痛', '鼻塞', '流涕'])) {
    suggestions.push({
      id: 'saline-and-lozenge',
      title: '生理盐水冲洗 / 润喉含片',
      useCase: '适合咽部刺激、鼻塞流涕、轻度上呼吸道不适。',
      reason: '这类对症处理安全边界更清晰，适合作为短期辅助，而不会掩盖明显重症信号。',
      caution: '若出现持续高热、气促、咳喘加重或咽痛明显吞咽困难，应尽快线下就医。',
      suitable: true,
    });
  }

  if (includesAny(lowerText, ['腹泻', '恶心', '呕吐', '腹痛'])) {
    suggestions.push({
      id: 'ors',
      title: '口服补液盐 / 补液方向',
      useCase: '适合轻度腹泻、恶心后的补液和电解质支持。',
      reason: '胃肠道症状很多时候先要避免脱水，补液通常比盲目止泻更重要。',
      caution: '如伴持续呕吐、明显腹痛、血便或无法进水，应尽快到消化内科或急诊。',
      suitable: true,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'general-self-care',
      title: '家庭观察与补水',
      useCase: '适合当前未出现明确高危信号时的短期自我处理。',
      reason: '现阶段更重要的是记录体温、症状变化、补水和休息，结合问诊结果判断是否需要转诊。',
      caution: '一旦症状持续不缓解、明显加重或出现新的红旗信号，请及时就医。',
      suitable: true,
    });
  }

  if (hasPenicillinAllergy) {
    suggestions.push({
      id: 'allergy-flag',
      title: '过敏史提醒',
      useCase: '档案中已记录青霉素相关过敏史。',
      reason: '后续若需要线下开药，应主动告诉医生和药师，避免使用相关成分。',
      caution: '不要自行尝试来路不明的抗生素。',
      suitable: false,
    });
  }

  return suggestions.slice(0, 4);
}

export function getPersonalizedInsights(params: {
  profile?: Partial<ProfileDraft> | null;
  recentCases?: CaseHistoryItem[];
  diagnosis?: DiagnosisResult | null;
}): PersonalizedInsight[] {
  const profile = params.profile ?? null;
  const recentCases = params.recentCases ?? [];
  const diagnosis = params.diagnosis ?? null;
  const age = getAge(profile);
  const combinedNotes = buildCombinedMedicalNotes(profile);
  const dominantDepartment = getTopDepartment(recentCases);
  const insights: PersonalizedInsight[] = [];

  if (profile?.displayName || profile?.profileMode === 'demo') {
    insights.push({
      id: 'persona',
      title: profile?.profileMode === 'demo' ? '当前为体验画像' : '你的健康画像',
      summary:
        profile?.profileMode === 'demo'
          ? '已为你预置一份可编辑的体验档案和历史记录，方便直接感受个性化推荐效果。'
          : '后续问诊会自动复用这些资料，减少重复提问并让建议更贴近你的情况。',
      details: [
        profile?.careFocus ? `当前关注：${profile.careFocus}` : '可继续补充你的用药、过敏和慢病信息。',
        dominantDepartment ? `近期更常关联：${dominantDepartment}` : '常见不适可继续通过游客模式快速开始。',
      ],
      tone: 'blue',
    });
  }

  if (age !== null && (age >= 60 || includesAny(combinedNotes, ['高血压', '糖尿病', '哮喘', '慢病']))) {
    insights.push({
      id: 'high-risk-profile',
      title: '这类档案建议更保守处理',
      summary: '年龄、慢病或既往病史会提高阈值，系统会更早提示复诊或线下评估。',
      details: [
        age !== null ? `年龄约 ${age} 岁，分诊会自动提高警惕级别。` : '已有慢病/既往史提示。',
        '建议把血压、血糖、长期用药或过敏史补充完整，避免问诊时漏掉关键风险。',
      ],
      tone: 'amber',
    });
  }

  if (diagnosis) {
    insights.push({
      id: 'follow-up-plan',
      title: diagnosis.level === 'green' ? '建议居家观察' : diagnosis.level === 'yellow' ? '建议尽快复查' : '建议立即处理',
      summary: diagnosis.action,
      details: [
        diagnosis.departments.length > 0
          ? `优先方向：${diagnosis.departments.join('、')}`
          : '可先按当前建议处理，再决定是否转诊。',
        diagnosis.level === 'green' || diagnosis.level === 'yellow'
          ? '建议 24-48 小时内复测体温、症状强度和精神状态变化。'
          : '当前不建议只做家庭观察，优先安排线下就医。',
      ],
      tone: diagnosis.level === 'green' ? 'emerald' : diagnosis.level === 'yellow' ? 'blue' : 'rose',
    });
  }

  if (recentCases.length > 0) {
    insights.push({
      id: 'history-pattern',
      title: '近期记录显示的重点',
      summary: `已保留 ${recentCases.length} 条近期问诊，可用于后续个性化分诊和随访。`,
      details: [
        dominantDepartment
          ? `最近更常推荐的科室：${dominantDepartment}`
          : '历史记录可帮助系统减少重复追问。',
        `最近一条：${recentCases[0].chiefComplaint}`,
      ],
      tone: 'violet',
    });
  }

  return insights.slice(0, 3);
}
