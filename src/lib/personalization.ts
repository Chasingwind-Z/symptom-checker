import type { ConversationSession, DiagnosisResult } from '../types';
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

export interface PersonalizationRankingContext {
  cityTerms: string[];
  careFocusTerms: string[];
  chronicTerms: string[];
  recentTerms: string[];
  hasSignals: boolean;
}

export interface PersonalizedOrderingResult<T> {
  items: T[];
  changed: boolean;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'urban-commuter',
    label: '都市通勤型',
    subtitle: '适合呼吸道 / 过敏场景',
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
    subtitle: '适合高风险守护场景',
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
    subtitle: '适合儿童 / 家庭管理',
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
  const normalizedText = text.toLowerCase();
  return keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
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

const RANKING_TERM_BLACKLIST = new Set([
  '当前',
  '最近',
  '今天',
  '继续',
  '建议',
  '帮助',
  '记录',
  '摘要',
  '问诊',
  '系统',
  '优先',
  '处理',
  '观察',
  '补充',
  '情况',
  '重点',
]);

function normalizeRankingText(text: string): string {
  return text.replace(/[^a-z0-9\u4e00-\u9fff]/gi, '').toLowerCase();
}

function addRankingTerm(target: string[], value: string) {
  const normalized = normalizeRankingText(value);
  if (!normalized) return;
  if (/^[a-z0-9]+$/i.test(normalized) ? normalized.length < 3 : normalized.length < 2) return;
  if (RANKING_TERM_BLACKLIST.has(normalized)) return;
  if (!target.includes(normalized)) {
    target.push(normalized);
  }
}

function extractRankingTerms(text: string, limit = 8): string[] {
  const terms: string[] = [];
  const cleaned = text
    .replace(/[（）()【】[\]{}]/g, ' ')
    .replace(/[，。！？；：、/|]+/g, ' ')
    .replace(
      /(当前关注|更关注|关注重点|希望获得|想更快|更快|是否需要|需不需要|要不要|是否适合|想判断|帮助判断|判断|关注|提醒|建议|优先|适合|当前|最近|今天|希望|获得|继续|补充|系统)/g,
      ' '
    )
    .replace(/[和与及并且或的]/g, ' ')
    .replace(/([一二两三四五六七八九十\d]+)(天|周|个月|月|年|小时|分钟)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return terms;

  for (const segment of cleaned.split(' ')) {
    const normalized = normalizeRankingText(segment);
    if (!normalized) continue;

    addRankingTerm(terms, normalized);

    if (/^[\u4e00-\u9fff]+$/u.test(normalized) && normalized.length > 4) {
      addRankingTerm(terms, normalized.slice(0, 4));
      addRankingTerm(terms, normalized.slice(-4));
    }

    if (terms.length >= limit) break;
  }

  return terms.slice(0, limit);
}

function buildCityRankingTerms(city?: string | null): string[] {
  const normalizedCity = city?.trim() ?? '';
  if (!normalizedCity || normalizedCity === '中国大陆') return [];

  const terms: string[] = [];
  addRankingTerm(terms, normalizedCity);
  addRankingTerm(terms, normalizedCity.replace(/(特别行政区|自治区|自治州|省|市|区|县|镇|乡)/g, ''));
  return terms.slice(0, 3);
}

function mergeRankingTerms(target: string[], terms: string[], limit: number) {
  for (const term of terms) {
    addRankingTerm(target, term);
    if (target.length >= limit) break;
  }
}

function countRankingMatches(text: string, terms: string[], maxMatches = terms.length): number {
  let matches = 0;

  for (const term of terms) {
    if (!term || !text.includes(term)) continue;

    matches += 1;
    if (matches >= maxMatches) break;
  }

  return matches;
}

export function buildPersonalizationRankingContext(params: {
  profile?: Partial<ProfileDraft> | null;
  recentCases?: CaseHistoryItem[];
  recentSessions?: ConversationSession[];
}): PersonalizationRankingContext {
  const cityTerms = buildCityRankingTerms(params.profile?.city);
  const careFocusTerms = extractRankingTerms(params.profile?.careFocus ?? '', 8);
  const chronicTerms = extractRankingTerms(params.profile?.chronicConditions ?? '', 8);
  const recentTerms: string[] = [];

  (params.recentCases ?? []).slice(0, 3).forEach((item) => {
    mergeRankingTerms(
      recentTerms,
      extractRankingTerms(`${item.chiefComplaint} ${item.departments.join(' ')}`, 6),
      12
    );
  });

  (params.recentSessions ?? []).slice(0, 3).forEach((session) => {
    mergeRankingTerms(
      recentTerms,
      extractRankingTerms(
        `${session.title} ${session.diagnosisResult?.departments.join(' ') ?? ''} ${
          session.diagnosisResult?.reason ?? ''
        }`,
        6
      ),
      12
    );
  });

  return {
    cityTerms,
    careFocusTerms,
    chronicTerms,
    recentTerms,
    hasSignals: Boolean(
      cityTerms.length || careFocusTerms.length || chronicTerms.length || recentTerms.length
    ),
  };
}

export function applyPersonalizedOrdering<T>(
  items: readonly T[],
  getSearchableTexts: (item: T) => Array<string | null | undefined>,
  context: PersonalizationRankingContext
): PersonalizedOrderingResult<T> {
  if (items.length < 2 || !context.hasSignals) {
    return { items: [...items], changed: false };
  }

  const ranked = items
    .map((item, index) => {
      const searchableText = normalizeRankingText(
        getSearchableTexts(item)
          .filter((value): value is string => Boolean(value && value.trim()))
          .join(' ')
      );

      if (!searchableText) {
        return { item, index, score: 0 };
      }

      const score =
        (countRankingMatches(searchableText, context.cityTerms, 1) > 0 ? 2 : 0) +
        (countRankingMatches(searchableText, context.careFocusTerms, 1) > 0 ? 2 : 0) +
        (countRankingMatches(searchableText, context.chronicTerms, 1) > 0 ? 2 : 0) +
        Math.min(2, countRankingMatches(searchableText, context.recentTerms, 2));

      return { item, index, score };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index);

  return {
    items: ranked.map((entry) => entry.item),
    changed:
      ranked.some((entry) => entry.score > 0) &&
      ranked.some((entry, sortedIndex) => entry.index !== sortedIndex),
  };
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

export function hasMedicationProfileContext(profile?: Partial<ProfileDraft> | null): boolean {
  if (!profile) return false;

  return Boolean(
    profile.birthYear ||
      profile.medicalNotes?.trim() ||
      profile.chronicConditions?.trim() ||
      profile.allergies?.trim() ||
      profile.currentMedications?.trim()
  );
}

function addMedicationAdvice(list: MedicationAdvice[], advice: MedicationAdvice) {
  if (!list.some((item) => item.id === advice.id)) {
    list.push(advice);
  }
}

function joinAdviceText(parts: Array<string | null | undefined | false>) {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join('；');
}

const PEDIATRIC_CONTEXT_KEYWORDS = ['儿童', '孩子', '小孩', '宝宝', '婴儿', '幼儿', '儿科'];
const GI_RISK_KEYWORDS = ['胃溃疡', '消化道出血', '胃出血', '胃炎', '胃病'];
const KIDNEY_RISK_KEYWORDS = ['肾病', '肾功能', '肾炎', '透析', '肾衰'];
const LIVER_RISK_KEYWORDS = ['肝病', '肝功能', '肝炎', '肝硬化', '长期饮酒', '酒精性肝病'];
const CARDIO_RISK_KEYWORDS = ['高血压', '冠心病', '心衰', '心功能不全', '心脏病', '心律不齐'];
const DIABETES_KEYWORDS = ['糖尿病', '血糖'];
const RESPIRATORY_RISK_KEYWORDS = ['哮喘', '慢阻肺', 'copd'];
const GLAUCOMA_URINARY_RISK_KEYWORDS = ['青光眼', '前列腺', '排尿困难'];
const BLOOD_THINNER_KEYWORDS = ['华法林', '利伐沙班', '阿哌沙班', '达比加群', '氯吡格雷', '阿司匹林', '抗凝'];
const ACETAMINOPHEN_KEYWORDS = ['对乙酰氨基酚', '扑热息痛'];
const IBUPROFEN_KEYWORDS = ['布洛芬', '萘普生', '洛索洛芬', '双氯芬酸'];
const ANTIHISTAMINE_KEYWORDS = ['氯雷他定', '西替利嗪', '非索非那定', '左西替利嗪', '依巴斯汀'];
const COLD_COMBINATION_KEYWORDS = ['复方感冒', '感冒灵', '白加黑', '感康', '泰诺', '快克'];
const ANTIHYPERTENSIVE_KEYWORDS = ['沙坦', '地平', '普利', '美托洛尔', '比索洛尔', '倍他乐克', '降压药'];
const MOTION_SICKNESS_KEYWORDS = ['晕车', '晕船', '乘车', '乘船', '旅途', '路上', '车上'];
const CONSTIPATION_KEYWORDS = ['便秘', '排便困难', '大便干结', '几天没大便'];
const NAUSEA_KEYWORDS = ['恶心', '反胃', '想吐', '呕吐', '晕车', '晕船'];
const STOMACH_DISCOMFORT_KEYWORDS = ['胃胀', '腹胀', '胀气', '胃不舒服', '消化不良', '胃痛'];

export function getMedicationGuidance(
  diagnosis: DiagnosisResult,
  profile?: Partial<ProfileDraft> | null
): MedicationAdvice[] {
  const age = getAge(profile);
  const combinedNotes = buildCombinedMedicalNotes(profile);
  const lowerNotes = combinedNotes.toLowerCase();
  const lowerAllergies = (profile?.allergies ?? '').toLowerCase();
  const lowerCurrentMedications = (profile?.currentMedications ?? '').toLowerCase();
  const lowerText =
    `${diagnosis.reason} ${diagnosis.action} ${diagnosis.departments.join(' ')} ${diagnosis.disclaimer}`.toLowerCase();

  if (diagnosis.level === 'orange' || diagnosis.level === 'red') {
    return [
      {
        id: 'urgent-offline-care',
        title: '当前更适合线下评估',
        useCase: '当前风险等级较高，应优先考虑当日就医或急诊通道。',
        reason: '这类情况更需要医生面诊、生命体征评估或进一步检查，不建议仅依赖家庭药箱。',
        caution:
          joinAdviceText([
            '此时更适合补水、休息并准备病历',
            profile?.currentMedications ? '就诊时带上现用药清单' : '',
            profile?.allergies ? '主动说明过敏史' : '',
          ]) || '此时不建议延误就医。',
        suitable: false,
      },
    ];
  }

  const prioritySuggestions: MedicationAdvice[] = [];
  const suggestions: MedicationAdvice[] = [];
  const trailingSuggestions: MedicationAdvice[] = [];
  const hasAllergyHistory = Boolean(profile?.allergies?.trim());
  const hasPenicillinAllergy = includesAny(lowerAllergies, ['青霉素']) || includesAny(lowerNotes, ['青霉素']);
  const hasPediatricContext = includesAny(lowerNotes, PEDIATRIC_CONTEXT_KEYWORDS);
  const hasGastricRisk = includesAny(lowerNotes, GI_RISK_KEYWORDS);
  const hasKidneyRisk = includesAny(lowerNotes, KIDNEY_RISK_KEYWORDS);
  const hasLiverRisk = includesAny(lowerNotes, LIVER_RISK_KEYWORDS);
  const hasCardioRisk = includesAny(lowerNotes, CARDIO_RISK_KEYWORDS);
  const hasDiabetes = includesAny(lowerNotes, DIABETES_KEYWORDS);
  const hasRespiratoryRisk = includesAny(lowerNotes, RESPIRATORY_RISK_KEYWORDS);
  const hasGlaucomaOrUrinaryRisk = includesAny(lowerNotes, GLAUCOMA_URINARY_RISK_KEYWORDS);
  const hasFluidBalanceRisk = hasKidneyRisk || includesAny(lowerNotes, ['心衰', '心功能不全']);
  const hasBloodThinner = includesAny(lowerNotes, BLOOD_THINNER_KEYWORDS);
  const hasAcetaminophenAllergy = includesAny(lowerAllergies, ACETAMINOPHEN_KEYWORDS);
  const hasNsaidAllergy = includesAny(lowerAllergies, ['布洛芬', '阿司匹林', '非甾体', '解热镇痛']);
  const hasAntihistamineAllergy =
    includesAny(lowerAllergies, ANTIHISTAMINE_KEYWORDS) || includesAny(lowerAllergies, ['抗过敏药', '抗组胺']);
  const usesAcetaminophen = includesAny(lowerCurrentMedications, ACETAMINOPHEN_KEYWORDS);
  const usesIbuprofen = includesAny(lowerCurrentMedications, IBUPROFEN_KEYWORDS);
  const usesAntihistamine = includesAny(lowerCurrentMedications, ANTIHISTAMINE_KEYWORDS);
  const usesColdCombination = includesAny(lowerCurrentMedications, COLD_COMBINATION_KEYWORDS);
  const usesAntihypertensive = includesAny(lowerCurrentMedications, ANTIHYPERTENSIVE_KEYWORDS);
  const isOlderAdult = age !== null && age >= 65;
  const isYoungChild = age !== null && age < 6;
  const isInfant = age !== null && age < 1;
  const hasHighRiskProfile =
    isOlderAdult ||
    hasPediatricContext ||
    hasCardioRisk ||
    hasKidneyRisk ||
    hasLiverRisk ||
    hasDiabetes ||
    hasRespiratoryRisk ||
    hasBloodThinner;
  const riskLabels = [
    isOlderAdult ? '高龄' : '',
    hasPediatricContext ? '儿童照护场景' : '',
    hasCardioRisk ? '血压/心血管风险' : '',
    hasKidneyRisk ? '肾功能风险' : '',
    hasLiverRisk ? '肝功能风险' : '',
    hasDiabetes ? '血糖管理' : '',
    hasRespiratoryRisk ? '慢性呼吸道疾病' : '',
    hasBloodThinner ? '长期抗凝/抗血小板用药' : '',
  ].filter(Boolean);
  const riskSummary = riskLabels.slice(0, 3).join('、') || '高风险因素';
  const hasFeverPain = includesAny(lowerText, [
    '发热',
    '发烧',
    '头痛',
    '肌肉酸痛',
    '咽痛',
    '喉咙痛',
    '疼痛',
    '关节痛',
    '酸痛',
  ]);
  const hasUpperRespSymptoms = includesAny(lowerText, [
    '咳嗽',
    '咽痒',
    '咽痛',
    '鼻塞',
    '流涕',
    '流鼻涕',
    '喷嚏',
    '喉咙',
  ]);
  const hasCongestion = includesAny(lowerText, ['鼻塞', '鼻堵', '鼻不通气', '鼻腔堵']);
  const hasDryCough = includesAny(lowerText, ['干咳', '刺激性咳嗽', '咽痒']);
  const hasProductiveCough = includesAny(lowerText, ['咳痰', '痰多', '黄痰', '白痰', '黏痰']);
  const hasAllergyLikeSymptoms = includesAny(lowerText, ['过敏', '鼻痒', '眼痒', '喷嚏', '流清涕', '流鼻涕', '鼻塞']);
  const hasGiSymptoms = includesAny(lowerText, ['腹泻', '恶心', '呕吐', '腹痛', '胃肠', '肠胃']);
  const hasRefluxLikeSymptoms = includesAny(lowerText, ['反酸', '烧心', '胃灼热', '胃酸', '消化不良']);
  const hasConstipation = includesAny(lowerText, CONSTIPATION_KEYWORDS);
  const hasNauseaOrMotion = includesAny(lowerText, NAUSEA_KEYWORDS);
  const hasMotionSickness = includesAny(lowerText, MOTION_SICKNESS_KEYWORDS);
  const hasStomachDiscomfort = includesAny(lowerText, STOMACH_DISCOMFORT_KEYWORDS);
  const hasRashOrItch = includesAny(lowerText, ['瘙痒', '皮疹', '荨麻疹', '虫咬', '蚊虫叮咬']);
  const hasPseudoephedrineRisk = hasCardioRisk || hasGlaucomaOrUrinaryRisk || usesAntihypertensive;
  const hasTravelMedicationRisk = hasGlaucomaOrUrinaryRisk || isOlderAdult || isYoungChild;
  const hasSevereGiRedFlag = includesAny(lowerText, ['血便', '黑便', '剧烈腹痛', '完全喝不下水', '明显脱水']);
  const hasAcetaminophenContraindication =
    hasLiverRisk || hasAcetaminophenAllergy || usesAcetaminophen || usesColdCombination;
  const hasIbuprofenContraindication =
    hasNsaidAllergy ||
    hasGastricRisk ||
    hasKidneyRisk ||
    hasCardioRisk ||
    hasBloodThinner ||
    isOlderAdult ||
    isYoungChild ||
    usesIbuprofen;
  const hasAntihistamineContraindication =
    hasAntihistamineAllergy || usesAntihistamine || (age !== null && age < 2);

  if (hasHighRiskProfile && (diagnosis.level === 'yellow' || hasKidneyRisk || hasLiverRisk || hasBloodThinner)) {
    addMedicationAdvice(prioritySuggestions, {
      id: 'medication-safety-check',
      title: '先核对基础病与现用药',
      useCase: `档案提示${riskSummary}，OTC 更适合先做成分核对。`,
      reason: '这类情况下，退烧药、复方感冒药或止咳药更容易和原有疾病/长期用药叠加，家庭处理应以短期、单一成分为主。',
      caution:
        '优先选择单一成分，不要同时叠加多种感冒药；若今天症状加重、出现气促、持续高热或明显脱水，应尽快线下评估。',
      suitable: false,
    });
  }

  if (hasCongestion && hasPseudoephedrineRisk) {
    addMedicationAdvice(prioritySuggestions, {
      id: 'decongestant-caution',
      title: '口服减充血复方先别急着选',
      useCase: '鼻塞明显时，很多复方感冒药会叠加伪麻黄碱样减充血成分。',
      reason: '档案提示血压/心血管、青光眼/排尿或长期降压药背景，这类成分更适合先核对。',
      caution:
        '先以生理盐水冲洗、补水和局部护理为主；若胸闷心悸、头痛加重或鼻塞持续不缓解，应进一步评估。',
      suitable: false,
    });
  }

  if (hasFeverPain) {
    addMedicationAdvice(suggestions, {
      id: 'acetaminophen',
      title: '对乙酰氨基酚（退热 / 止痛方向）',
      useCase: '适合轻中度发热、头痛、肌肉酸痛的短期对症缓解。',
      reason: hasLiverRisk
        ? '这一成分常见于很多退热/感冒药里；若合并肝病或长期饮酒，安全边界会更窄。'
        : hasGastricRisk || hasBloodThinner
        ? '相较 NSAID 类，通常对胃部刺激和出血风险更小，更适合作为保守的一线方向。'
        : '单一成分更容易核对剂量，适合作为短期退热止痛的保守选择。',
      caution: hasLiverRisk
        ? '档案提示肝病或饮酒风险，不建议自行默认使用；如需退热止痛，请先问医生或药师。'
        : usesAcetaminophen || usesColdCombination
        ? '当前已记录退热/感冒药，先核对是否已含对乙酰氨基酚，避免重复服用。'
        : hasPediatricContext
        ? '若这次对象是儿童，请按年龄和体重核对剂量，不要直接沿用成人剂量。'
        : '尽量按说明书短期使用，一般连续不超过 2–3 天；若反复高热或疼痛持续，应线下评估。',
      suitable: !hasAcetaminophenContraindication,
    });

    addMedicationAdvice(suggestions, {
      id: 'ibuprofen',
      title: '布洛芬（退热 / 消炎止痛方向）',
      useCase: '适合体温升高伴疼痛不适的短期缓解。',
      reason: hasIbuprofenContraindication
        ? '这类药对发热/炎症性疼痛可能有帮助，但胃、肾、血压和出血风险需要先核对。'
        : '若没有胃、肾、血压或抗凝风险，可用于发热伴疼痛的短期缓解。',
      caution: hasNsaidAllergy
        ? '档案提示曾对布洛芬或同类止痛药不耐受，不建议默认再试。'
        : hasGastricRisk || hasKidneyRisk || hasBloodThinner || hasCardioRisk || isOlderAdult
        ? '有胃病、肾功能问题、血压/心脏风险、抗凝用药或高龄时，不建议自行首选布洛芬。'
        : usesIbuprofen
        ? '当前已记录布洛芬或同类成分，避免重复服用。'
        : isYoungChild || hasPediatricContext
        ? '若这次对象是儿童，必须按体重核对剂量；6 岁以下更不建议默认自用。'
        : '建议餐后、短期按说明书使用；若发热超过 48 小时或疼痛加重，请进一步评估。',
      suitable: !hasIbuprofenContraindication,
    });
  }

  if (hasUpperRespSymptoms) {
    addMedicationAdvice(suggestions, {
      id: 'saline-and-lozenge',
      title: '生理盐水冲洗 / 润喉含片',
      useCase: '适合咽部刺激、鼻塞流涕、轻度上呼吸道不适。',
      reason: hasCardioRisk || hasPediatricContext
        ? '局部处理更保守，不容易和慢病用药或儿童剂量问题冲突。'
        : '这类对症处理安全边界更清晰，适合作为短期辅助，而不会掩盖明显重症信号。',
      caution:
        hasCardioRisk || hasGlaucomaOrUrinaryRisk
          ? '鼻塞时尽量先用生理盐水，不要默认叠加含伪麻黄碱的复方感冒药；若气促或吞咽困难，应尽快线下就医。'
          : '若出现持续高热、气促、咳喘加重或咽痛明显吞咽困难，应尽快线下就医。',
      suitable: true,
    });
  }

  if (hasDryCough) {
    addMedicationAdvice(suggestions, {
      id: 'honey-and-hydration',
      title: '蜂蜜（1 岁以上）/ 温水 / 加湿',
      useCase: '适合咽痒、轻度干咳、夜间刺激性咳嗽时先做家庭处理。',
      reason: '这类方式比直接叠加止咳复方更保守，也更适合先观察症状走向。',
      caution: hasDiabetes
        ? '若合并糖尿病，请少量尝试并留意血糖；1 岁以下婴儿不建议用蜂蜜。'
        : '1 岁以下婴儿不建议用蜂蜜；若咳嗽伴喘鸣、胸痛或持续高热，应线下评估。',
      suitable: !isInfant,
    });
  }

  if (hasProductiveCough) {
    addMedicationAdvice(suggestions, {
      id: 'guaifenesin',
      title: '单一成分祛痰药（如愈创甘油醚）',
      useCase: '适合痰多、痰黏、咳后稍有缓解的短期辅助。',
      reason: '若主要困扰是痰液黏稠，优先单一成分比直接用复方止咳感冒药更容易核对安全性。',
      caution: isYoungChild || hasPediatricContext
        ? '儿童尤其 6 岁以下不建议默认自行购买止咳祛痰复方；若呼吸急促或喘鸣应尽快就医。'
        : hasRespiratoryRisk
        ? '已有哮喘或慢阻肺时，如夜间气促、喘鸣或痰中带血，不要只靠 OTC。'
        : '若痰色加深、发热不退、胸闷或咳嗽超过 1 周，请线下评估。',
      suitable: !isYoungChild,
    });
  }

  if (hasDiabetes && (hasDryCough || hasProductiveCough)) {
    addMedicationAdvice(trailingSuggestions, {
      id: 'diabetes-cough-syrup-caution',
      title: '止咳糖浆先核对含糖量',
      useCase: '合并糖尿病或血糖管理需求时，糖浆类止咳药更适合先核对配方。',
      reason: '部分糖浆类产品会带来额外糖负担，也容易和其他复方感冒药一起重复用药。',
      caution: '优先问药师是否有无糖或单一成分版本；若咳嗽伴高热、气促或持续加重，应尽快线下评估。',
      suitable: false,
    });
  }

  if (hasAllergyLikeSymptoms) {
    addMedicationAdvice(suggestions, {
      id: 'second-gen-antihistamine',
      title: '第二代抗过敏药（如氯雷他定 / 西替利嗪）',
      useCase: '更适合打喷嚏、流清涕、鼻痒、眼痒等偏过敏表现。',
      reason: '相较复方感冒药，单一成分更容易判断是否有效，也更容易避免重复用药。',
      caution: hasAntihistamineAllergy
        ? '档案提示对相关抗过敏药有过敏或不耐受，不建议默认自行使用。'
        : usesAntihistamine
        ? '当前已记录同类抗过敏药，通常不建议再叠加第二种同类成分。'
        : hasCardioRisk || hasGlaucomaOrUrinaryRisk
        ? '鼻塞时尽量先用生理盐水，不要自行叠加含伪麻黄碱的复方感冒药；老年人也要警惕嗜睡。'
        : hasPediatricContext
        ? '若这次对象是儿童，请先核对年龄分层与剂量；年龄太小或症状持续时更建议儿科确认。'
        : '部分人会犯困，首次使用后避免驾车；若喘鸣或呼吸困难，应尽快就医。',
      suitable: !hasAntihistamineContraindication,
    });
  }

  if (hasGiSymptoms) {
    addMedicationAdvice(suggestions, {
      id: 'ors',
      title: '口服补液盐 / 补液方向',
      useCase: '适合轻度腹泻、恶心后的补液和电解质支持。',
      reason: '胃肠道症状很多时候先要避免脱水，补液通常比盲目止泻更重要。',
      caution: hasFluidBalanceRisk
        ? '若有肾病或心衰，请少量多次补液并关注尿量；如出现浮肿、尿少或无法进水，应尽快就医。'
        : hasDiabetes
        ? '补液比止泻更重要，但若合并糖尿病，也要同时留意血糖变化。'
        : '如伴持续呕吐、明显腹痛、血便或无法进水，应尽快到消化内科或急诊。',
      suitable: true,
    });

    addMedicationAdvice(suggestions, {
      id: 'montmorillonite',
      title: '蒙脱石散（腹泻方向）',
      useCase: '更适合无高热、无血便的短期腹泻对症支持。',
      reason: '若主要困扰是水样便或次数增多，补液之外可短期考虑吸附方向，但仍要先看是否存在感染或脱水信号。',
      caution: hasSevereGiRedFlag
        ? '若伴血便、黑便、剧烈腹痛、明显脱水或持续高热，不建议只靠止泻类 OTC。'
        : '不要长期连续自行使用；若 24-48 小时仍明显腹泻或尿量变少，应尽快就医。',
      suitable: !hasSevereGiRedFlag,
    });
  }

  if (hasRefluxLikeSymptoms) {
    addMedicationAdvice(suggestions, {
      id: 'antacid',
      title: '抗酸剂 / 藻酸盐（反酸方向）',
      useCase: '适合饭后反酸、烧心、胃部灼热的短期缓解。',
      reason: '若主要不适来自反酸，先用短期抗酸方向往往比随意吃止痛药更合适。',
      caution: hasKidneyRisk
        ? '肾功能不好时，不建议默认使用含镁/铝的抗酸剂；若黑便、呕血或胸痛需尽快就医。'
        : '若反复夜间症状、黑便、吞咽困难或胸痛，不能只靠 OTC。',
      suitable: !hasKidneyRisk,
    });
  }

  if (hasStomachDiscomfort) {
    addMedicationAdvice(suggestions, {
      id: 'simethicone',
      title: '西甲硅油（胀气方向）',
      useCase: '更适合饭后腹胀、胀气、打嗝明显的短期缓解。',
      reason: '若主要不适来自胀气而不是剧烈腹痛，先做更保守的局部对症处理通常更合适。',
      caution: includesAny(lowerText, ['黑便', '停止排气', '持续呕吐'])
        ? '若腹胀伴黑便、停止排气排便、持续呕吐或剧烈腹痛，不建议只按胀气处理。'
        : '若腹胀反复、腹痛加重或影响进食，建议进一步到消化内科评估。',
      suitable: !includesAny(lowerText, ['黑便', '停止排气', '持续呕吐']),
    });
  }

  if (hasConstipation) {
    addMedicationAdvice(suggestions, {
      id: 'constipation-osmotic-laxative',
      title: '聚乙二醇 / 乳果糖（便秘方向）',
      useCase: '更适合短期排便干结、排便费力、几天未解大便的情况。',
      reason: '这类方向通常比刺激性泻药更保守，更适合作为先尝试的家庭处理方案。',
      caution: includesAny(lowerText, ['便血', '黑便', '剧烈腹痛', '持续呕吐'])
        ? '若伴便血、黑便、剧烈腹痛或持续呕吐，不建议只按便秘自行处理。'
        : isOlderAdult
        ? '高龄者要同时关注饮水、活动量和是否突然加重；若便秘反复或明显腹胀，建议线下评估。'
        : '先配合补水、膳食纤维和活动；若连续数天仍无缓解，应进一步评估。',
      suitable: !includesAny(lowerText, ['便血', '黑便', '剧烈腹痛', '持续呕吐']),
    });
  }

  if (hasNauseaOrMotion) {
    addMedicationAdvice(suggestions, {
      id: 'nausea-self-care',
      title: '少量多次补液 / 清淡饮食',
      useCase: '适合轻度恶心、反胃、食欲差时先做家庭处理。',
      reason: '很多轻度胃肠不适更重要的是少量多次补液和清淡饮食，而不是立刻叠加多种药物。',
      caution:
        '若持续呕吐、完全喝不下水、伴剧烈腹痛或精神明显变差，应尽快到消化内科或急诊评估。',
      suitable: !includesAny(lowerText, ['持续呕吐', '剧烈腹痛', '明显脱水']),
    });
  }

  if (hasMotionSickness) {
    addMedicationAdvice(suggestions, {
      id: 'motion-sickness-direction',
      title: '抗晕药方向（旅途前使用）',
      useCase: '更适合晕车、晕船这类与旅途明确相关的恶心不适。',
      reason: '若恶心与乘车乘船关系明确，可优先考虑短期抗晕方向，而不是按持续胃病处理。',
      caution: hasTravelMedicationRisk
        ? '儿童、高龄或青光眼/排尿困难人群不建议默认自行使用这类药；服后也可能犯困。'
        : '服后可能犯困，避免驾车；若不是旅途相关恶心，先别默认按晕车处理。',
      suitable: !hasTravelMedicationRisk,
    });
  }

  if (hasRashOrItch) {
    addMedicationAdvice(suggestions, {
      id: 'calamine',
      title: '冷敷 / 炉甘石（局部瘙痒方向）',
      useCase: '适合轻度皮肤瘙痒、虫咬样刺激或局限性皮疹时先做家庭处理。',
      reason: '局部处理相对更保守，通常比直接口服多种药物更容易把控。',
      caution: '若出现嘴唇或眼周肿胀、呼吸困难、大片蔓延、水疱或发热，请尽快线下就医；破损皮肤不建议乱涂。',
      suitable: true,
    });
  }

  if (hasAllergyHistory) {
    addMedicationAdvice(trailingSuggestions, {
      id: 'allergy-flag',
      title: '过敏史提醒',
      useCase: `档案中已记录：${profile?.allergies?.trim()}`,
      reason: '后续无论是 OTC 还是线下开药，都应先核对成分，避免与既往过敏或不耐受成分接触。',
      caution: hasPenicillinAllergy
        ? '若后续医生考虑抗生素，务必主动说明青霉素过敏；不要自行尝试来路不明的抗生素。'
        : '第一次尝试新药后若出现皮疹、口唇肿胀或喘憋，应立即停用并就医。',
      suitable: false,
    });
  }

  let combinedSuggestions = [...prioritySuggestions, ...suggestions, ...trailingSuggestions];

  if (!combinedSuggestions.some((item) => item.suitable)) {
    addMedicationAdvice(suggestions, {
      id: 'general-self-care',
      title: '家庭观察与单一成分优先',
      useCase: '适合当前没有明显 OTC 优势，或档案提示用药需要更谨慎时的短期处理。',
      reason: '现阶段更重要的是补水、休息、记录体温和症状变化，并避免同时叠加多种复方药物。',
      caution: hasHighRiskProfile
        ? `档案提示${riskSummary}；若 24 小时内没有改善或更严重，应尽快线下复核。`
        : '一旦症状持续不缓解、明显加重或出现新的红旗信号，请及时就医。',
      suitable: true,
    });
  }

  combinedSuggestions = [...prioritySuggestions, ...suggestions, ...trailingSuggestions];

  if (combinedSuggestions.length === 0) {
    addMedicationAdvice(suggestions, {
      id: 'general-self-care',
      title: '家庭观察与补水',
      useCase: '适合当前未出现明确高危信号时的短期自我处理。',
      reason: '现阶段更重要的是记录体温、症状变化、补水和休息，结合问诊结果判断是否需要转诊。',
      caution: '一旦症状持续不缓解、明显加重或出现新的红旗信号，请及时就医。',
      suitable: true,
    });
  }

  return [...prioritySuggestions, ...suggestions, ...trailingSuggestions].slice(0, 5);
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
      title: profile?.profileMode === 'demo' ? '当前使用常见场景' : '你的健康画像',
      summary:
        profile?.profileMode === 'demo'
          ? '已为你载入一组可编辑的场景资料和历史记录，方便快速感受个性化建议会如何变化。'
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
