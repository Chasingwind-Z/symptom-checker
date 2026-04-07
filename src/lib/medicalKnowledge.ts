import type { RiskLevel, SymptomInfo } from '../types';
import { isSupabaseConfigured } from './supabase';
import {
  getCloudMedicalKnowledgeSnapshot,
  primeCloudMedicalKnowledgeDocuments,
} from './medicalKnowledgeRepository';
import { searchSymptomKB, symptomKB } from './symptomKB';

export type MedicalKnowledgeCategory =
  | 'symptom_guidance'
  | 'danger_signs'
  | 'department_guidance'
  | 'population_guidance'
  | 'self_care';

export type MedicalKnowledgeAudience = '通用' | '儿童' | '老年人' | '慢病患者' | '孕产妇';
export type MedicalKnowledgeStorageMode =
  | 'seeded-local'
  | 'seeded-local-supabase-ready'
  | 'supabase-public'
  | 'supabase-fallback-local';

export type MedicalKnowledgeRetrievalMode =
  | 'keyword'
  | 'hybrid-local'
  | 'hybrid-cloud'
  | 'hybrid-cloud-vector-ready';

export interface MedicalKnowledgeChunkMetadata {
  category?: MedicalKnowledgeCategory;
  audience?: MedicalKnowledgeAudience;
  triageLevel?: RiskLevel;
  tags?: string[];
  searchTerms?: string[];
  semanticHints?: string[];
  sourceLabel?: string;
  embeddingModel?: string | null;
  embeddingDimensions?: number | null;
  embeddingStatus?: 'pending' | 'ready' | 'failed' | 'skipped' | string;
  vectorScore?: number | null;
}

export interface MedicalKnowledgeDocument {
  id: string;
  title: string;
  category: MedicalKnowledgeCategory;
  audience: MedicalKnowledgeAudience;
  triageLevel: RiskLevel;
  summary: string;
  guidance: string[];
  dangerSigns: string[];
  departments: string[];
  tags: string[];
  keywords: string[];
  sourceLabel: string;
  updatedAt: string;
}

export interface MedicalKnowledgeChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  heading: string | null;
  content: string;
  tokenCount: number | null;
  metadata: MedicalKnowledgeChunkMetadata;
  sourceLabel: string;
  updatedAt: string;
}

export interface MedicalKnowledgeMatch {
  document: MedicalKnowledgeDocument;
  score: number;
  matchedTerms: string[];
  reasons: string[];
  snippet: string;
}

export interface MedicalKnowledgeChunkMatch {
  chunk: MedicalKnowledgeChunk;
  document: MedicalKnowledgeDocument;
  score: number;
  lexicalScore: number;
  semanticScore: number;
  vectorScore: number | null;
  matchedTerms: string[];
  reasons: string[];
  snippet: string;
}

export interface MedicalKnowledgeSearchResult {
  query: string;
  sourceLabel: string;
  storageMode: MedicalKnowledgeStorageMode;
  retrievalMode: MedicalKnowledgeRetrievalMode;
  retrievalLabel: string;
  supabaseTable: string;
  lastUpdated: string;
  focusPopulation: MedicalKnowledgeAudience | null;
  queryExpansions: string[];
  symptomMatches: SymptomInfo[];
  chunkMatches: MedicalKnowledgeChunkMatch[];
  documents: MedicalKnowledgeMatch[];
}

const KNOWLEDGE_UPDATED_AT = '2026-04-05';
const SOURCE_LABEL = '医学资料库';
const SUPABASE_TABLE_NAME = 'medical_knowledge_documents';

const RISK_PRIORITY: Record<RiskLevel, number> = {
  red: 4,
  orange: 3,
  yellow: 2,
  green: 1,
};

const POPULATION_RULES: Array<{
  audience: MedicalKnowledgeAudience;
  regex: RegExp;
  hints: string[];
}> = [
  {
    audience: '儿童',
    regex: /(孩子|宝宝|婴儿|幼儿|儿童|小孩|儿科)/,
    hints: ['孩子', '宝宝', '婴儿', '幼儿', '儿童', '小孩', '儿科'],
  },
  {
    audience: '老年人',
    regex: /(老人|老年|爷爷|奶奶|外公|外婆|65岁|70岁|高龄)/,
    hints: ['老人', '老年', '高龄', '65岁以上'],
  },
  {
    audience: '慢病患者',
    regex: /(慢病|高血压|糖尿病|冠心病|心脏病|哮喘|慢阻肺|肾病|肿瘤|免疫低下)/,
    hints: ['慢病', '高血压', '糖尿病', '冠心病', '哮喘', '慢阻肺', '肾病'],
  },
  {
    audience: '孕产妇',
    regex: /(怀孕|孕妇|妊娠|产后|哺乳期)/,
    hints: ['怀孕', '孕妇', '妊娠', '产后', '哺乳期'],
  },
];

const QUERY_EXPANSION_RULES: Array<{
  regex: RegExp;
  terms: string[];
}> = [
  {
    regex: /(发烧|发热|高热|低烧|体温)/,
    terms: ['发烧', '发热', '高热', '体温'],
  },
  {
    regex: /(咳嗽|干咳|咳痰|咽痛|喉咙痛)/,
    terms: ['咳嗽', '干咳', '咳痰', '咽痛'],
  },
  {
    regex: /(胸痛|胸闷|心口痛|心悸|心慌)/,
    terms: ['胸痛', '胸闷', '心悸', '放射痛'],
  },
  {
    regex: /(呼吸困难|气短|喘不过气|憋气|喘)/,
    terms: ['呼吸困难', '气短', '喘不过气', '胸闷'],
  },
  {
    regex: /(腹痛|肚子痛|胃痛|腹部疼痛)/,
    terms: ['腹痛', '肚子痛', '胃痛'],
  },
  {
    regex: /(腹泻|拉肚子|稀便|水样便)/,
    terms: ['腹泻', '拉肚子', '稀便', '脱水'],
  },
  {
    regex: /(恶心呕吐|想吐|呕吐|反胃)/,
    terms: ['恶心呕吐', '想吐', '反胃', '脱水'],
  },
  {
    regex: /(头痛|头疼|偏头痛)/,
    terms: ['头痛', '头疼', '偏头痛'],
  },
  {
    regex: /(头晕|眩晕|站不稳)/,
    terms: ['头晕', '眩晕', '站不稳'],
  },
  {
    regex: /(皮疹|红疹|瘙痒|过敏)/,
    terms: ['皮疹', '红疹', '瘙痒', '过敏'],
  },
  {
    regex: /(挂号|科室|门诊|医院|去哪看)/,
    terms: ['挂号科室', '科室', '门诊', '急诊'],
  },
  {
    regex: /(危险|警惕|严重吗|何时就医|急诊|120)/,
    terms: ['危险信号', '急诊', '120', '尽快就医'],
  },
];

const RETRIEVAL_MODE_LABELS: Record<MedicalKnowledgeRetrievalMode, string> = {
  keyword: '关键词匹配',
  'hybrid-local': '资料匹配',
  'hybrid-cloud': '已同步资料匹配',
  'hybrid-cloud-vector-ready': '已同步资料匹配',
};

export const MEDICAL_KNOWLEDGE_SOURCE = {
  sourceLabel: SOURCE_LABEL,
  storageMode: (isSupabaseConfigured
    ? 'seeded-local-supabase-ready'
    : 'seeded-local') as MedicalKnowledgeStorageMode,
  supabaseTable: SUPABASE_TABLE_NAME,
  updatedAt: KNOWLEDGE_UPDATED_AT,
} as const;

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function normalizeChineseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/发热/g, '发烧')
    .replace(/高烧/g, '发烧')
    .replace(/低烧/g, '发烧')
    .replace(/胸口痛|心口痛|胸部疼痛/g, '胸痛')
    .replace(/肚子痛|胃痛|腹部疼痛/g, '腹痛')
    .replace(/气喘|喘不过气|喘不上气|憋气/g, '呼吸困难')
    .replace(/拉肚子|稀便|水样便/g, '腹泻')
    .replace(/想吐|吐了|反胃/g, '恶心呕吐')
    .replace(/头疼/g, '头痛')
    .replace(/晕眩|头昏/g, '头晕')
    .replace(/挂什么科|看什么科/g, '挂号科室')
    .replace(/[，。！？；：、“”‘’（）()[\]【】,.!?;:/\\|+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDocumentSearchTerms(document: MedicalKnowledgeDocument): string[] {
  return uniqueStrings([
    document.title,
    document.audience,
    ...document.tags,
    ...document.keywords,
    ...document.dangerSigns,
    ...document.departments,
  ])
    .map(normalizeChineseText)
    .filter((item) => item.length >= 2);
}

function getRetrievalModeLabel(mode: MedicalKnowledgeRetrievalMode): string {
  return RETRIEVAL_MODE_LABELS[mode] ?? RETRIEVAL_MODE_LABELS.keyword;
}

function buildNgrams(value: string): string[] {
  const compact = normalizeChineseText(value).replace(/\s+/g, '');
  if (compact.length < 2) return [];

  const grams = new Set<string>();

  for (let size = 2; size <= 3; size += 1) {
    for (let i = 0; i <= compact.length - size; i += 1) {
      const gram = compact.slice(i, i + size);
      if (gram.trim().length === size) {
        grams.add(gram);
      }
    }
  }

  return Array.from(grams);
}

function detectPopulation(query: string): MedicalKnowledgeAudience | null {
  return POPULATION_RULES.find((rule) => rule.regex.test(query))?.audience ?? null;
}

function expandQueryTerms(
  query: string,
  symptomMatches: SymptomInfo[],
  population: MedicalKnowledgeAudience | null,
  intentTags: Set<string>
): string[] {
  const expanded = new Set<string>(
    normalizeChineseText(query)
      .split(' ')
      .map((item) => item.trim())
      .filter((item) => item.length >= 2)
  );

  QUERY_EXPANSION_RULES.forEach((rule) => {
    if (rule.regex.test(query)) {
      rule.terms.forEach((term) => expanded.add(normalizeChineseText(term)));
    }
  });

  if (population) {
    const rule = POPULATION_RULES.find((item) => item.audience === population);
    rule?.hints.forEach((hint) => expanded.add(normalizeChineseText(hint)));
  }

  if (intentTags.has('danger')) {
    ['危险信号', '急诊', '120'].forEach((term) => expanded.add(normalizeChineseText(term)));
  }

  if (intentTags.has('department')) {
    ['挂号科室', '门诊', '急诊'].forEach((term) => expanded.add(normalizeChineseText(term)));
  }

  if (intentTags.has('self-care')) {
    ['居家观察', '补水', '休息', '记录症状'].forEach((term) =>
      expanded.add(normalizeChineseText(term))
    );
  }

  symptomMatches.forEach((symptom) => {
    [symptom.name, ...symptom.aliases]
      .map(normalizeChineseText)
      .filter((term) => term.length >= 2)
      .forEach((term) => expanded.add(term));
  });

  return Array.from(expanded).slice(0, 18);
}

function detectIntentTags(query: string): Set<string> {
  const intentTags = new Set<string>();

  if (/(危险|警惕|何时就医|什么时候去医院|马上去医院|急诊|120|严重吗)/.test(query)) {
    intentTags.add('danger');
  }

  if (/(挂号科室|挂号|科室|去哪看|医院|门诊)/.test(query)) {
    intentTags.add('department');
  }

  if (/(怎么护理|居家|在家观察|注意什么|怎么处理|先做什么)/.test(query)) {
    intentTags.add('self-care');
  }

  if (/(发烧|咳嗽|胸痛|腹痛|头痛|头晕|恶心呕吐|腹泻|呼吸困难)/.test(query)) {
    intentTags.add('symptom');
  }

  return intentTags;
}

function buildSearchText(document: MedicalKnowledgeDocument): string {
  return normalizeChineseText(
    [
      document.title,
      document.summary,
      document.audience,
      ...document.guidance,
      ...document.dangerSigns,
      ...document.departments,
      ...document.tags,
      ...document.keywords,
    ].join(' ')
  );
}

function countSharedTerms(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

function toSymptomKnowledgeDocument(symptom: SymptomInfo): MedicalKnowledgeDocument {
  return {
    id: `symptom-${symptom.id}`,
    title: `${symptom.name}初步分诊指引`,
    category: 'symptom_guidance',
    audience: '通用',
    triageLevel: symptom.default_min_level,
    summary: symptom.when_to_worry,
    guidance: [
      `居家先做：${symptom.self_care.slice(0, 3).join('；')}`,
      `建议优先咨询：${symptom.departments.slice(0, 3).join('、')}`,
      `若出现 ${symptom.danger_signs.slice(0, 2).join('、')}，请尽快线下评估。`,
      ...(symptom.source ? [`${symptom.source}`] : []),
    ],
    dangerSigns: symptom.danger_signs,
    departments: symptom.departments,
    tags: [symptom.name, ...symptom.aliases.slice(0, 6)],
    keywords: [...symptom.aliases, ...symptom.departments, ...symptom.self_care],
    sourceLabel: symptom.source || SOURCE_LABEL,
    updatedAt: KNOWLEDGE_UPDATED_AT,
  };
}

const CURATED_DOCUMENTS: MedicalKnowledgeDocument[] = [
  {
    id: 'danger-emergency-red-flags',
    title: '立即急诊的危险信号',
    category: 'danger_signs',
    audience: '通用',
    triageLevel: 'red',
    summary:
      '胸痛伴大汗/放射痛、静息呼吸困难、意识改变、抽搐、大量出血或单侧肢体无力，都应按急症处理。',
    guidance: [
      '若患者胸痛超过 15 分钟、呼吸明显费力、嘴唇发紫或叫不醒，应立即拨打 120。',
      '等待急救期间尽量停止活动，保持半坐位或侧卧位，不要强行喂水喂药。',
      '老年人、孕妇、儿童和慢病患者对同样症状更应提前就医，不要拖到“非常难受”再处理。',
    ],
    dangerSigns: ['胸痛伴大汗或左臂放射痛', '静息呼吸困难或嘴唇发紫', '意识改变或抽搐', '单侧肢体无力/言语不清'],
    departments: ['急诊科', '心内科', '呼吸科', '神经内科'],
    tags: ['危险信号', '急诊', '120', '胸痛', '呼吸困难', '意识改变', '偏瘫'],
    keywords: ['胸闷', '喘不过气', '口角歪斜', '叫不醒', '抽搐', '大出血'],
    sourceLabel: SOURCE_LABEL,
    updatedAt: KNOWLEDGE_UPDATED_AT,
  },
  {
    id: 'department-selection-guide',
    title: '常见症状挂号科室速查',
    category: 'department_guidance',
    audience: '通用',
    triageLevel: 'yellow',
    summary:
      '胸痛/心悸优先心内科或急诊；咳嗽/气短多看呼吸科；腹痛/腹泻/呕吐多看消化内科；皮疹/过敏优先皮肤科。',
    guidance: [
      '胸痛、呼吸困难、意识改变等高危症状不要纠结“挂什么科”，优先急诊。',
      '发烧、咳嗽、气短以呼吸科/内科为主；腹痛、腹泻、呕吐以消化内科为主。',
      '孩子优先儿科，老人或多病共存者可先挂全科/老年医学科，再由医院分诊。',
    ],
    dangerSigns: ['任何高危症状先急诊', '持续加重或无法进食饮水', '出现晕厥或意识障碍'],
    departments: ['急诊科', '呼吸科', '消化内科', '心内科', '儿科', '皮肤科'],
    tags: ['挂什么科', '挂号', '科室', '医院', '门诊'],
    keywords: ['急诊', '呼吸科', '消化内科', '心内科', '儿科', '皮肤科', '全科'],
    sourceLabel: SOURCE_LABEL,
    updatedAt: KNOWLEDGE_UPDATED_AT,
  },
  {
    id: 'home-observation-guide',
    title: '居家观察与就医升级要点',
    category: 'self_care',
    audience: '通用',
    triageLevel: 'yellow',
    summary:
      '若症状暂未达到急诊标准，可先补水、休息、记录体温/症状变化；但一旦持续加重、无法进食饮水或出现新的危险信号，应尽快就医。',
    guidance: [
      '建议记录起病时间、体温、疼痛程度、伴随症状和是否越来越重，方便后续问诊或线下就医。',
      '发热、腹泻、呕吐时重点防脱水；咳嗽和喉咙痛时注意补水、休息、避免刺激性环境。',
      '如果 24-48 小时内没有明显好转，或原本轻微的症状变得更频繁、更严重，应升级处理。',
    ],
    dangerSigns: ['无法进食饮水', '反复呕吐或明显脱水', '症状快速加重', '出现胸痛/气短/意识改变'],
    departments: ['全科医学科', '内科', '急诊科'],
    tags: ['居家观察', '在家怎么办', '注意什么', '怎么处理'],
    keywords: ['补水', '休息', '记录症状', '多久去医院', '何时升级'],
    sourceLabel: SOURCE_LABEL,
    updatedAt: KNOWLEDGE_UPDATED_AT,
  },
  {
    id: 'children-fever-respiratory',
    title: '儿童发热/呼吸道症状重点提示',
    category: 'population_guidance',
    audience: '儿童',
    triageLevel: 'orange',
    summary:
      '儿童发热、咳嗽、呕吐更容易出现脱水和精神差；高热 >39℃、呼吸费力、拒水拒食时应当天就医。',
    guidance: [
      '儿童若出现精神反应差、持续高热、抽搐、皮疹、尿量明显减少，应尽快去儿科或急诊。',
      '发热伴咳喘时要留意呼吸频率、鼻翼扇动、凹陷呼吸等“呼吸费力”表现。',
      '婴幼儿病情变化快，若家长难以判断或症状夜间明显加重，宁可提前线下评估。',
    ],
    dangerSigns: ['高热 >39℃ 持续不退', '拒水拒食或尿量明显减少', '呼吸费力、口唇发紫', '抽搐或精神萎靡'],
    departments: ['儿科', '急诊科'],
    tags: ['孩子', '宝宝', '儿童', '发烧', '咳嗽', '精神差'],
    keywords: ['婴儿', '幼儿', '儿科', '高热惊厥', '拒奶', '呼吸急促'],
    sourceLabel: SOURCE_LABEL,
    updatedAt: KNOWLEDGE_UPDATED_AT,
  },
  {
    id: 'elderly-escalation-guide',
    title: '老年人症状分级要更保守',
    category: 'population_guidance',
    audience: '老年人',
    triageLevel: 'orange',
    summary:
      '老人胸闷、乏力、头晕、食欲差、精神状态波动往往提示更高风险，即使疼痛/发热不明显也建议更早评估。',
    guidance: [
      '老年人常常“症状不典型”，一旦出现突然乏力、站不稳、意识模糊、食欲明显下降，应比年轻人更早就医。',
      '伴有冠心病、高血压、糖尿病、慢阻肺时，胸闷气短和发热的容错空间更小，建议当天处理。',
      '若老人独居或夜间症状波动，尽量安排家属陪同，带上慢病用药清单。',
    ],
    dangerSigns: ['突然意识模糊', '持续胸闷气短', '站不稳/跌倒', '进食饮水明显减少'],
    departments: ['急诊科', '老年医学科', '全科医学科', '心内科'],
    tags: ['老人', '老年', '高龄', '慢病', '胸闷', '乏力'],
    keywords: ['爷爷', '奶奶', '老年医学科', '独居', '食欲差', '跌倒'],
    sourceLabel: SOURCE_LABEL,
    updatedAt: KNOWLEDGE_UPDATED_AT,
  },
  {
    id: 'chronic-disease-precaution',
    title: '慢病患者出现新症状需提前升级',
    category: 'population_guidance',
    audience: '慢病患者',
    triageLevel: 'orange',
    summary:
      '高血压、糖尿病、冠心病、哮喘/COPD、肾病等慢病患者出现感染、胸闷、气短、浮肿或持续呕吐时，应更早线下评估。',
    guidance: [
      '慢病患者更容易因感染、脱水或用药变化迅速恶化，不要把“原有老毛病”当作新症状的全部解释。',
      '若伴血糖明显波动、血压持续很高/很低、胸痛、气短或尿量减少，建议当天就医。',
      '就诊时尽量带上既往检查结果和目前正在使用的药物清单，方便医生判断。',
    ],
    dangerSigns: ['胸痛或气短加重', '血压/血糖异常波动', '尿量减少或全身水肿', '持续呕吐无法进食'],
    departments: ['内科', '心内科', '呼吸科', '内分泌科', '肾内科'],
    tags: ['慢病', '高血压', '糖尿病', '冠心病', '哮喘', '慢阻肺'],
    keywords: ['肾病', '免疫低下', '心衰', '血糖高', '血压高', '基础疾病'],
    sourceLabel: SOURCE_LABEL,
    updatedAt: KNOWLEDGE_UPDATED_AT,
  },
  {
    id: 'stroke-fast-warning',
    title: '卒中/脑血管意外快速识别',
    category: 'danger_signs',
    audience: '通用',
    triageLevel: 'red',
    summary:
      '突然口角歪斜、单侧肢体无力/麻木、言语不清、剧烈眩晕或视物异常时，应按脑卒中流程立即急诊。',
    guidance: [
      '符合“脸歪、手抬不起来、说话不清”中的任意一项，都不建议继续观察，应立即就医。',
      '不要自行开车；记录症状开始时间，便于医院判断是否存在溶栓/介入时窗。',
      '即便症状几分钟后缓解，也可能是短暂性脑缺血发作，需要尽快评估。',
    ],
    dangerSigns: ['口角歪斜', '单侧肢体无力或麻木', '言语不清', '突发视力改变或剧烈眩晕'],
    departments: ['急诊科', '神经内科', '卒中中心'],
    tags: ['脑卒中', '偏瘫', '言语不清', '口角歪斜', 'FAST'],
    keywords: ['单侧无力', '麻木', '看不清', '突发眩晕', '卒中中心'],
    sourceLabel: SOURCE_LABEL,
    updatedAt: KNOWLEDGE_UPDATED_AT,
  },
];

const KNOWLEDGE_CORPUS: MedicalKnowledgeDocument[] = [
  ...CURATED_DOCUMENTS,
  ...symptomKB.map(toSymptomKnowledgeDocument),
];

export function toMedicalKnowledgeChunks(document: MedicalKnowledgeDocument): MedicalKnowledgeChunk[] {
  const chunkSeeds = [
    {
      heading: 'summary',
      content: `${document.title}：${document.summary}`,
    },
    ...document.guidance.map((item, index) => ({
      heading: `guidance_${index + 1}`,
      content: item,
    })),
    {
      heading: 'triage_focus',
      content: `危险信号：${document.dangerSigns.join('；')}。建议科室：${document.departments.join('、')}`,
    },
  ].filter((chunk) => chunk.content.trim().length > 0);

  const searchTerms = buildDocumentSearchTerms(document).slice(0, 20);
  const semanticHints = uniqueStrings([
    document.title,
    document.summary,
    ...document.tags,
    ...document.keywords,
    ...document.dangerSigns,
    ...document.departments,
  ]).slice(0, 20);

  return chunkSeeds.map((chunk, index) => ({
    id: `${document.id}::${index}`,
    documentId: document.id,
    chunkIndex: index,
    heading: chunk.heading,
    content: chunk.content,
    tokenCount: chunk.content.length,
    metadata: {
      category: document.category,
      audience: document.audience,
      triageLevel: document.triageLevel,
      tags: uniqueStrings([...document.tags, ...document.keywords]).slice(0, 12),
      searchTerms,
      semanticHints,
      sourceLabel: document.sourceLabel,
      embeddingStatus: 'pending',
      embeddingModel: null,
      embeddingDimensions: null,
    },
    sourceLabel: document.sourceLabel,
    updatedAt: document.updatedAt,
  }));
}

interface IndexedKnowledgeDocument {
  document: MedicalKnowledgeDocument;
  searchText: string;
  searchTerms: string[];
  ngrams: string[];
}

interface IndexedKnowledgeChunk {
  chunk: MedicalKnowledgeChunk;
  document: MedicalKnowledgeDocument;
  searchText: string;
  searchTerms: string[];
  ngrams: string[];
}

interface KnowledgeIndexBundle {
  documents: IndexedKnowledgeDocument[];
  chunks: IndexedKnowledgeChunk[];
  vectorReady: boolean;
}

function buildKnowledgeIndex(
  corpus: MedicalKnowledgeDocument[],
  chunkCorpus?: MedicalKnowledgeChunk[]
): KnowledgeIndexBundle {
  const documents = corpus.map((document) => ({
    document,
    searchText: buildSearchText(document),
    searchTerms: buildDocumentSearchTerms(document),
    ngrams: buildNgrams(buildSearchText(document)),
  }));

  const documentMap = new Map(corpus.map((document) => [document.id, document]));
  const rawChunks = chunkCorpus && chunkCorpus.length > 0 ? chunkCorpus : corpus.flatMap(toMedicalKnowledgeChunks);
  const chunks = rawChunks
    .map((chunk) => {
      const document = documentMap.get(chunk.documentId);
      if (!document) return null;

      const searchTerms = uniqueStrings([
        ...(chunk.metadata.searchTerms ?? []),
        ...(chunk.metadata.tags ?? []),
        ...(chunk.metadata.semanticHints ?? []),
        chunk.heading ?? '',
        chunk.content,
        document.title,
      ])
        .map(normalizeChineseText)
        .filter((item) => item.length >= 2);

      const searchText = normalizeChineseText(
        [
          document.title,
          chunk.heading ?? '',
          chunk.content,
          ...(chunk.metadata.tags ?? []),
          ...(chunk.metadata.semanticHints ?? []),
        ].join(' ')
      );

      return {
        chunk,
        document,
        searchText,
        searchTerms,
        ngrams: buildNgrams(searchText),
      };
    })
    .filter((item): item is IndexedKnowledgeChunk => Boolean(item));

  const vectorReady = chunks.some((chunk) => {
    const metadata = chunk.chunk.metadata;
    return (
      metadata.embeddingStatus === 'ready' ||
      typeof metadata.embeddingModel === 'string' ||
      typeof metadata.vectorScore === 'number'
    );
  });

  return {
    documents,
    chunks,
    vectorReady,
  };
}

const KNOWLEDGE_INDEX = buildKnowledgeIndex(KNOWLEDGE_CORPUS);

function pickSnippet(
  document: MedicalKnowledgeDocument,
  query: string,
  intentTags: Set<string>,
  population: MedicalKnowledgeAudience | null
): string {
  const matchingDangerSign = document.dangerSigns.find((item) =>
    query.includes(normalizeChineseText(item))
  );

  if (matchingDangerSign) {
    return `重点危险信号：${matchingDangerSign}`;
  }

  if (population && document.audience === population) {
    return document.guidance[0] ?? document.summary;
  }

  if (intentTags.has('department') && document.departments.length > 0) {
    return `建议优先咨询：${document.departments.slice(0, 3).join('、')}`;
  }

  return document.guidance[0] ?? document.summary;
}

function buildSnippetText(value: string, maxLength = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}…` : normalized;
}

function rankKnowledgeChunk(
  indexed: IndexedKnowledgeChunk,
  query: string,
  expandedTerms: string[],
  symptomMatches: SymptomInfo[],
  intentTags: Set<string>,
  population: MedicalKnowledgeAudience | null,
  queryNgrams: string[]
): MedicalKnowledgeChunkMatch | null {
  const matchedTerms = new Set<string>();
  const reasons = new Set<string>();
  let lexicalScore = 0;

  for (const term of expandedTerms) {
    if (!term || term.length < 2 || !indexed.searchText.includes(term)) continue;

    matchedTerms.add(term);
    lexicalScore += term.length >= 4 ? 7 : 5;
  }

  for (const symptom of symptomMatches) {
    const symptomTerms = [symptom.name, ...symptom.aliases].map(normalizeChineseText);
    if (symptomTerms.some((term) => term && indexed.searchText.includes(term))) {
      lexicalScore += 12;
      matchedTerms.add(symptom.name);
      reasons.add(`覆盖症状：${symptom.name}`);
    }
  }

  if (population && indexed.document.audience === population) {
    lexicalScore += 14;
    reasons.add(`适用于${population}`);
  } else if (population && indexed.document.audience === '通用') {
    lexicalScore += 4;
  }

  if (intentTags.has('danger') && indexed.document.category === 'danger_signs') {
    lexicalScore += 12;
    reasons.add('危险信号片段');
  }

  if (intentTags.has('department') && indexed.document.category === 'department_guidance') {
    lexicalScore += 10;
    reasons.add('挂号/就医科室提示');
  }

  if (intentTags.has('self-care') && indexed.document.category === 'self_care') {
    lexicalScore += 10;
    reasons.add('居家处理建议');
  }

  if (
    /(120|急诊|叫不醒|嘴唇发紫|偏瘫|言语不清|胸痛|呼吸困难)/.test(query) &&
    (indexed.document.triageLevel === 'red' || indexed.document.triageLevel === 'orange')
  ) {
    lexicalScore += 8;
  }

  const sharedNgrams = countSharedTerms(queryNgrams, indexed.ngrams);
  const semanticScore =
    sharedNgrams > 0
      ? Number(
          (
            Math.min(16, sharedNgrams * 1.5) +
            (queryNgrams.length > 0 ? (sharedNgrams / queryNgrams.length) * 8 : 0)
          ).toFixed(2)
        )
      : 0;

  const vectorScore =
    typeof indexed.chunk.metadata.vectorScore === 'number' ? indexed.chunk.metadata.vectorScore : null;

  if (vectorScore !== null) {
    reasons.add('保留向量分数字段');
  } else if (indexed.chunk.metadata.embeddingStatus === 'ready') {
    reasons.add('向量字段已就绪');
  }

  const score = Number((lexicalScore + semanticScore + (vectorScore ?? 0) * 20).toFixed(2));
  if (score < 10) {
    return null;
  }

  return {
    chunk: indexed.chunk,
    document: indexed.document,
    score,
    lexicalScore: Number(lexicalScore.toFixed(2)),
    semanticScore,
    vectorScore,
    matchedTerms: Array.from(matchedTerms).slice(0, 6),
    reasons: Array.from(reasons).slice(0, 4),
    snippet: buildSnippetText(indexed.chunk.content),
  };
}

function rankDocument(
  indexed: IndexedKnowledgeDocument,
  query: string,
  symptomMatches: SymptomInfo[],
  intentTags: Set<string>,
  population: MedicalKnowledgeAudience | null,
  queryNgrams: string[]
): MedicalKnowledgeMatch | null {
  const matchedTerms = new Set<string>();
  const reasons = new Set<string>();
  let score = 0;

  for (const term of indexed.searchTerms) {
    if (!term || term.length < 2 || !query.includes(term)) continue;

    matchedTerms.add(term);
    score += 10;
  }

  for (const symptom of symptomMatches) {
    const symptomTerms = [symptom.name, ...symptom.aliases].map(normalizeChineseText);
    if (symptomTerms.some((term) => term && indexed.searchText.includes(term))) {
      score += 16;
      matchedTerms.add(symptom.name);
      reasons.add(`覆盖症状：${symptom.name}`);
    }
  }

  if (population && indexed.document.audience === population) {
    score += 24;
    reasons.add(`适用于${population}`);
  } else if (population && indexed.document.audience === '通用') {
    score += 4;
  }

  if (intentTags.has('danger') && indexed.document.category === 'danger_signs') {
    score += 20;
    reasons.add('匹配危险信号解释');
  }

  if (intentTags.has('department') && indexed.document.category === 'department_guidance') {
    score += 18;
    reasons.add('匹配挂号/就医科室问题');
  }

  if (intentTags.has('self-care') && indexed.document.category === 'self_care') {
    score += 16;
    reasons.add('匹配居家处理问题');
  }

  if (intentTags.has('symptom') && indexed.document.category === 'symptom_guidance') {
    score += 8;
  }

  const sharedNgrams = countSharedTerms(queryNgrams, indexed.ngrams);
  if (sharedNgrams > 0) {
    score += Math.min(12, sharedNgrams * 2);
  }

  if (
    /(120|急诊|叫不醒|嘴唇发紫|偏瘫|言语不清|胸痛|呼吸困难)/.test(query) &&
    (indexed.document.triageLevel === 'red' || indexed.document.triageLevel === 'orange')
  ) {
    score += 8;
  }

  if (score < 12) {
    return null;
  }

  return {
    document: indexed.document,
    score,
    matchedTerms: Array.from(matchedTerms).slice(0, 5),
    reasons: Array.from(reasons).slice(0, 3),
    snippet: pickSnippet(indexed.document, query, intentTags, population),
  };
}

export function getMedicalKnowledgeCorpus(): MedicalKnowledgeDocument[] {
  return KNOWLEDGE_CORPUS;
}

export function toMedicalKnowledgeRow(document: MedicalKnowledgeDocument): Record<string, unknown> {
  const cloudSourceLabel = document.sourceLabel.includes('Supabase')
    ? document.sourceLabel
    : `${document.sourceLabel}（Supabase 云端）`;

  return {
    id: document.id,
    locale: 'zh-CN',
    title: document.title,
    category: document.category,
    audience: document.audience,
    triage_level: document.triageLevel,
    summary: document.summary,
    guidance: document.guidance,
    danger_signs: document.dangerSigns,
    departments: document.departments,
    tags: uniqueStrings(document.tags),
    keywords: uniqueStrings(document.keywords),
    source_label: cloudSourceLabel,
    source_url: null,
    version: document.updatedAt,
    is_active: true,
    is_seeded: true,
    metadata: {
      updated_at: document.updatedAt,
      origin_source_label: document.sourceLabel,
      search_terms: uniqueStrings([
        document.title,
        ...document.tags,
        ...document.keywords,
        ...document.dangerSigns,
        ...document.departments,
      ]),
    },
  };
}

export function toMedicalKnowledgeChunkRows(
  document: MedicalKnowledgeDocument
): Array<Record<string, unknown>> {
  const cloudSourceLabel = document.sourceLabel.includes('Supabase')
    ? document.sourceLabel
    : `${document.sourceLabel}（Supabase 云端）`;

  return toMedicalKnowledgeChunks(document).map((chunk) => ({
    document_id: chunk.documentId,
    chunk_index: chunk.chunkIndex,
    heading: chunk.heading,
    content: chunk.content,
    token_count: chunk.tokenCount,
    search_terms: chunk.metadata.searchTerms ?? [],
    semantic_text: uniqueStrings([
      chunk.content,
      ...(chunk.metadata.semanticHints ?? []),
      document.summary,
    ]).join('；'),
    embedding_status: chunk.metadata.embeddingStatus ?? 'pending',
    embedding_model: chunk.metadata.embeddingModel ?? null,
    embedding_dimensions: chunk.metadata.embeddingDimensions ?? null,
    metadata: {
      category: document.category,
      audience: document.audience,
      triage_level: document.triageLevel,
      tags: uniqueStrings([...document.tags, ...document.keywords]).slice(0, 12),
      source_label: cloudSourceLabel,
      search_terms: chunk.metadata.searchTerms ?? [],
      semantic_hints: chunk.metadata.semanticHints ?? [],
      embedding_status: chunk.metadata.embeddingStatus ?? 'pending',
    },
  }));
}

export function buildMedicalKnowledgeSyncPayload() {
  const documents = getMedicalKnowledgeCorpus().map(toMedicalKnowledgeRow);
  const chunks = getMedicalKnowledgeCorpus().flatMap(toMedicalKnowledgeChunkRows);

  return {
    sourceLabel: SOURCE_LABEL,
    generatedAt: new Date().toISOString(),
    replaceExisting: false,
    documents,
    chunks,
  };
}

export function primeMedicalKnowledgeCorpus() {
  return primeCloudMedicalKnowledgeDocuments();
}

function getActiveKnowledgeSource() {
  const cloudSnapshot = getCloudMedicalKnowledgeSnapshot();

  if (cloudSnapshot.state === 'ready' && cloudSnapshot.documents.length > 0) {
    const knowledgeIndex = buildKnowledgeIndex(cloudSnapshot.documents, cloudSnapshot.chunks);
    return {
      knowledgeIndex,
      sourceLabel: cloudSnapshot.sourceLabel,
      storageMode: 'supabase-public' as MedicalKnowledgeStorageMode,
      lastUpdated: cloudSnapshot.lastUpdated,
      retrievalMode:
        knowledgeIndex.vectorReady || cloudSnapshot.vectorReady
          ? ('hybrid-cloud-vector-ready' as MedicalKnowledgeRetrievalMode)
          : ('hybrid-cloud' as MedicalKnowledgeRetrievalMode),
    };
  }

  if (isSupabaseConfigured) {
    void primeCloudMedicalKnowledgeDocuments();
  }

  return {
    knowledgeIndex: KNOWLEDGE_INDEX,
    sourceLabel: SOURCE_LABEL,
    storageMode: (cloudSnapshot.state === 'error' || cloudSnapshot.state === 'loading'
      ? 'supabase-fallback-local'
      : MEDICAL_KNOWLEDGE_SOURCE.storageMode) as MedicalKnowledgeStorageMode,
    lastUpdated: KNOWLEDGE_UPDATED_AT,
    retrievalMode: 'hybrid-local' as MedicalKnowledgeRetrievalMode,
  };
}

export function searchMedicalKnowledge(
  query: string,
  options: { limit?: number } = {}
): MedicalKnowledgeSearchResult {
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeChineseText(trimmedQuery);
  const symptomMatches = trimmedQuery ? searchSymptomKB(trimmedQuery).slice(0, 4) : [];
  const population = normalizedQuery ? detectPopulation(normalizedQuery) : null;
  const intentTags = normalizedQuery ? detectIntentTags(normalizedQuery) : new Set<string>();
  const queryExpansions = normalizedQuery
    ? expandQueryTerms(normalizedQuery, symptomMatches, population, intentTags)
    : [];
  const hybridQueryText = uniqueStrings([normalizedQuery, ...queryExpansions])
    .filter(Boolean)
    .join(' ');
  const queryNgrams = buildNgrams(hybridQueryText);
  const limit = Math.max(1, options.limit ?? 4);
  const activeKnowledge = getActiveKnowledgeSource();
  const chunkMatches =
    hybridQueryText.length === 0
      ? []
      : activeKnowledge.knowledgeIndex.chunks
          .map((chunk) =>
            rankKnowledgeChunk(
              chunk,
              hybridQueryText,
              queryExpansions,
              symptomMatches,
              intentTags,
              population,
              queryNgrams
            )
          )
          .filter((item): item is MedicalKnowledgeChunkMatch => Boolean(item))
          .sort((left, right) => right.score - left.score)
          .slice(0, Math.max(limit * 3, 6));

  const topChunkByDocument = new Map<string, MedicalKnowledgeChunkMatch>();
  chunkMatches.forEach((chunkMatch) => {
    const existing = topChunkByDocument.get(chunkMatch.document.id);
    if (!existing || chunkMatch.score > existing.score) {
      topChunkByDocument.set(chunkMatch.document.id, chunkMatch);
    }
  });

  const documents =
    hybridQueryText.length === 0
      ? []
      : activeKnowledge.knowledgeIndex.documents
          .map((document) => {
            const baseMatch = rankDocument(
              document,
              hybridQueryText,
              symptomMatches,
              intentTags,
              population,
              queryNgrams
            );
            const bestChunk = topChunkByDocument.get(document.document.id);

            if (!baseMatch && !bestChunk) {
              return null;
            }

            const score = Number(
              ((baseMatch?.score ?? 0) + (bestChunk ? bestChunk.score * 0.9 : 0)).toFixed(2)
            );

            return {
              document: document.document,
              score,
              matchedTerms: uniqueStrings([
                ...(baseMatch?.matchedTerms ?? []),
                ...(bestChunk?.matchedTerms ?? []),
              ]).slice(0, 6),
              reasons: uniqueStrings([
                ...(baseMatch?.reasons ?? []),
                ...(bestChunk?.reasons ?? []),
                ...(bestChunk?.chunk.heading ? [`命中片段：${bestChunk.chunk.heading}`] : []),
              ]).slice(0, 4),
              snippet:
                bestChunk?.snippet ??
                baseMatch?.snippet ??
                pickSnippet(document.document, hybridQueryText, intentTags, population),
            } satisfies MedicalKnowledgeMatch;
          })
          .filter((item): item is MedicalKnowledgeMatch => Boolean(item))
          .sort((left, right) => {
            if (right.score !== left.score) {
              return right.score - left.score;
            }

            const riskDelta =
              RISK_PRIORITY[right.document.triageLevel] - RISK_PRIORITY[left.document.triageLevel];
            if (riskDelta !== 0) {
              return riskDelta;
            }

            return left.document.title.localeCompare(right.document.title, 'zh-CN');
          })
          .slice(0, limit);

  return {
    query: trimmedQuery,
    sourceLabel: activeKnowledge.sourceLabel,
    storageMode: activeKnowledge.storageMode,
    retrievalMode: activeKnowledge.retrievalMode,
    retrievalLabel: getRetrievalModeLabel(activeKnowledge.retrievalMode),
    supabaseTable: SUPABASE_TABLE_NAME,
    lastUpdated: activeKnowledge.lastUpdated,
    focusPopulation: population,
    queryExpansions,
    symptomMatches,
    chunkMatches: chunkMatches.slice(0, Math.max(limit, 3)),
    documents,
  };
}
