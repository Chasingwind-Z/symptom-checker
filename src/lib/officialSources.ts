import { useEffect, useMemo, useState } from 'react';
import type {
  OfficialSourceBundle,
  OfficialSourceFetchState,
  OfficialSourceFreshness,
  OfficialSourceRecord,
  OfficialSourceSyncMode,
  OfficialSourceSyncStatus,
  RiskLevel,
} from '../types';
import { getActiveCity } from './epidemicDataEngine';
import { callGatewayJson, hasGatewayRoute } from './serverGateway';

export interface OfficialSourceContext {
  city?: string;
  level?: RiskLevel;
  departments?: string[];
  reason?: string;
  focusSymptoms?: string[];
  maxItems?: number;
}

interface SeededOfficialSource extends OfficialSourceRecord {
  topics: string[];
  departments: string[];
  levels?: RiskLevel[];
  cities?: string[];
  featuredOnDashboard?: boolean;
  priority?: number;
}

interface PersistedOfficialSourceBundle {
  records: OfficialSourceRecord[];
  syncStatus: Partial<OfficialSourceSyncStatus>;
}

interface OfficialSourceGatewayPayload {
  ok?: boolean;
  configured?: boolean;
  fallbackActive?: boolean;
  sourceLabel?: string;
  message?: string;
  note?: string;
  fetchedAt?: string;
  lastSyncTime?: string;
  records?: unknown[];
  results?: unknown[];
  syncStatus?: Partial<OfficialSourceSyncStatus>;
}

const OFFICIAL_SOURCE_CACHE_PREFIX = 'symptom_official_source_sync_v4';
const OFFICIAL_SOURCE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ITEMS = 3;
const DEFAULT_SOURCE_LABEL = '官方公开资料对照';
const gatewayAvailable = hasGatewayRoute('official-source-fetch');

const SUPPORTED_CITY_ALIASES: Record<string, string[]> = {
  苏州: ['苏州', '苏州市'],
  北京: ['北京', '北京市'],
  上海: ['上海', '上海市'],
  广州: ['广州', '广州市'],
  深圳: ['深圳', '深圳市'],
  南京: ['南京', '南京市'],
  杭州: ['杭州', '杭州市'],
};

function normalizeUrlKey(rawUrl?: string): string {
  if (!rawUrl) {
    return '';
  }

  try {
    const parsed = new URL(rawUrl);
    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin.toLowerCase()}${normalizedPath}${parsed.search}`.toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

function getUrlSpecificityScore(rawUrl?: string): number {
  if (!rawUrl) {
    return -3;
  }

  try {
    const parsed = new URL(rawUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return -2;
    }

    let score = Math.min(6, segments.length * 2);
    if (!/^index(\.\w+)?$/i.test(segments.at(-1) ?? '')) {
      score += 1;
    }
    if (parsed.search) {
      score += 1;
    }

    return score;
  } catch {
    return 0;
  }
}

function inferRecordCity(record: OfficialSourceRecord): string | undefined {
  return normalizeCityName(record.city ?? `${record.sourceLabel} ${record.title}`);
}

function inferRecordScope(record: OfficialSourceRecord): OfficialSourceRecord['scope'] {
  const scopeText = `${record.sourceLabel} ${record.title} ${record.sourceType}`;

  if (/WHO|World Health Organization/i.test(scopeText)) {
    return 'international';
  }

  if (inferRecordCity(record) && /卫健委|疾病预防控制中心|CDC|疾控/u.test(scopeText)) {
    return 'local';
  }

  return 'national';
}

function enrichOfficialSourceRecord(record: OfficialSourceRecord): OfficialSourceRecord {
  const city = record.city ?? inferRecordCity(record);

  return {
    ...record,
    city,
    scope: record.scope ?? inferRecordScope({ ...record, city }),
  };
}

function getOfficialSourceRecordPriority(
  record: OfficialSourceRecord,
  context: OfficialSourceContext = {}
): number {
  const normalized = normalizeContext(context);
  const enriched = enrichOfficialSourceRecord(record);
  let score = getUrlSpecificityScore(enriched.url);

  if (normalized.city && enriched.city === normalized.city) {
    score += 6;
  }

  if (enriched.scope === 'local') {
    score += 4;
  } else if (enriched.scope === 'national') {
    score += 2;
  } else {
    score += 1;
  }

  if (/本地官方入口|就医查询|急症识别|急症须知/u.test(enriched.status)) {
    score += 2;
  }

  if (/发热门诊|医疗机构|就医|门急诊|公告|目录|汇总|查询|专题|指南/u.test(
    `${enriched.title} ${enriched.linkLabel ?? ''}`
  )) {
    score += 1;
  }

  return score;
}

function getOfficialSourceRecordKey(record: OfficialSourceRecord): string {
  const urlKey = normalizeUrlKey(record.url);
  if (urlKey) {
    return `url:${urlKey}`;
  }

  return `title:${record.sourceLabel.trim().toLowerCase()}|${record.title.trim().toLowerCase()}`;
}

function uniqueOfficialSourceRecords(
  records: OfficialSourceRecord[],
  context: OfficialSourceContext = {}
): OfficialSourceRecord[] {
  const orderedKeys: string[] = [];
  const deduped = new Map<string, OfficialSourceRecord>();

  records.map(enrichOfficialSourceRecord).forEach((record) => {
    const key = getOfficialSourceRecordKey(record);
    const existing = deduped.get(key);

    if (!existing) {
      orderedKeys.push(key);
      deduped.set(key, record);
      return;
    }

    if (
      getOfficialSourceRecordPriority(record, context) >
      getOfficialSourceRecordPriority(existing, context)
    ) {
      deduped.set(key, record);
    }
  });

  return orderedKeys
    .map((key) => deduped.get(key))
    .filter((record): record is OfficialSourceRecord => Boolean(record));
}

function sortOfficialSourceRecords(
  records: OfficialSourceRecord[],
  context: OfficialSourceContext = {}
): OfficialSourceRecord[] {
  return [...uniqueOfficialSourceRecords(records, context)].sort((left, right) => {
    const scoreDiff =
      getOfficialSourceRecordPriority(right, context) -
      getOfficialSourceRecordPriority(left, context);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return right.lastUpdated.localeCompare(left.lastUpdated);
  });
}

const officialSourceMemoryCache = new Map<string, OfficialSourceBundle>();
const officialSourceRequestCache = new Map<string, Promise<OfficialSourceBundle>>();

const SEEDED_OFFICIAL_SOURCES: SeededOfficialSource[] = [
  {
    id: 'china-cdc-flu-weekly',
    title: '中国疾控中心：流感与急性呼吸道传染病专题',
    sourceLabel: '中国疾病预防控制中心',
    sourceType: '疾控专题',
    status: '官方资料',
    lastUpdated: '2025-01-12T09:00:00+08:00',
    summary:
      '适合对照发热、咳嗽、咽痛等呼吸道症状的季节性变化；若出现持续高热、气促或精神状态变差，应尽快线下就医。',
    url: 'https://www.chinacdc.cn/jksj/jksj04_14275/',
    linkLabel: '查看呼吸道监测原文',
    topics: ['发热', '咳嗽', '咽痛', '流感', '呼吸道', '鼻塞'],
    departments: ['呼吸内科', '感染科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
    scope: 'national',
    featuredOnDashboard: true,
    priority: 4,
  },
  {
    id: 'nhc-fever-guidance',
    title: '国家卫健委：全国医疗机构与发热门诊查询',
    sourceLabel: '国家卫生健康委员会',
    sourceType: '卫健委服务',
    status: '就医查询',
    lastUpdated: '2025-01-08T10:00:00+08:00',
    summary:
      '当出现高热不退、气促、基础病加重，或老人、儿童持续不适时，建议优先前往发热门诊或急诊评估。',
    url: 'https://zwfw.nhc.gov.cn/cxx/',
    linkLabel: '打开卫健委查询原文',
    topics: ['高热', '呼吸困难', '发热', '咳嗽', '胸闷'],
    departments: ['呼吸内科', '急诊科', '感染科'],
    levels: ['yellow', 'orange', 'red'],
    scope: 'national',
    priority: 5,
  },
  {
    id: 'cdc-health-knowledge',
    title: '中国疾控中心：传染病防治健康知识',
    sourceLabel: '中国疾病预防控制中心',
    sourceType: '疾控科普',
    status: '健康知识',
    lastUpdated: '2025-01-11T08:30:00+08:00',
    summary:
      '涵盖常见呼吸道、消化道传染病的预防知识，适合继续核对手卫生、口罩佩戴、居家隔离与就医时机。',
    url: 'https://www.chinacdc.cn/jkzt/crb/',
    linkLabel: '查看疾控健康知识',
    topics: ['呼吸道', '发热', '咳嗽', '传染病', '预防'],
    departments: ['呼吸内科', '儿科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
    scope: 'national',
    featuredOnDashboard: true,
    priority: 4,
  },
  {
    id: 'who-seasonal-influenza',
    title: 'WHO：季节性流感概述',
    sourceLabel: 'World Health Organization',
    sourceType: '国际参考',
    status: '背景资料',
    lastUpdated: '2024-12-19T12:00:00+08:00',
    summary:
      '适合补充了解全球季节性流感与急性呼吸道感染背景，帮助理解趋势，但不替代个体诊断。',
    url: 'https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)',
    linkLabel: '查看 WHO 官方说明',
    topics: ['流感', '呼吸道', '发热', '疲劳', '咳嗽'],
    departments: ['呼吸内科', '感染科'],
    levels: ['green', 'yellow', 'orange'],
    scope: 'international',
    featuredOnDashboard: true,
    priority: 3,
  },
  {
    id: 'china-cdc-gastroenteritis',
    title: '中国疾控中心：诺如病毒感染防控指南',
    sourceLabel: '中国疾病预防控制中心',
    sourceType: '疾控指南',
    status: '防控参考',
    lastUpdated: '2024-11-28T09:30:00+08:00',
    summary:
      '若腹泻、呕吐、腹痛伴脱水风险，应及时补液，并继续核对是否需要消化内科或急诊进一步评估。',
    url: 'https://www.chinacdc.cn/jkzt/crb/nrbdyzgr/',
    linkLabel: '查看诺如防护要点',
    topics: ['腹泻', '呕吐', '腹痛', '恶心', '肠胃'],
    departments: ['消化内科', '急诊科'],
    levels: ['green', 'yellow', 'orange'],
    scope: 'national',
    priority: 4,
  },
  {
    id: 'stroke-fast',
    title: '国家卫健委：脑卒中 FAST 快速识别法',
    sourceLabel: '国家卫生健康委百万减残工程',
    sourceType: '急救指南',
    status: '急症识别',
    lastUpdated: '2024-10-16T09:00:00+08:00',
    summary:
      '若出现口角歪斜、单侧无力、言语不清等急性神经系统症状，应立即拨打 120，不建议等待观察。',
    url: 'https://www.chinacdc.cn/jkzt/mxfcrjbhsh/nzcfjkjy/',
    linkLabel: '查看卒中 FAST 识别',
    topics: ['头晕', '头痛', '言语不清', '肢体无力', '卒中'],
    departments: ['神经内科', '急诊科'],
    levels: ['orange', 'red'],
    scope: 'national',
    priority: 5,
  },
  {
    id: 'chest-pain-emergency',
    title: '急性胸痛与心梗急救常识',
    sourceLabel: '中国疾病预防控制中心慢病中心',
    sourceType: '急救常识',
    status: '急症须知',
    lastUpdated: '2024-09-25T08:00:00+08:00',
    summary:
      '胸痛持续、伴大汗或呼吸困难时，应尽快启动急诊绿色通道，不建议自行驾车或延误观察。',
    url: 'https://www.chinacdc.cn/jkzt/mxfcrjbhsh/xxgjbfzjkjy/',
    linkLabel: '查看胸痛急救要点',
    topics: ['胸痛', '胸闷', '心慌', '呼吸困难', '大汗'],
    departments: ['心内科', '急诊科'],
    levels: ['orange', 'red'],
    scope: 'national',
    priority: 5,
  },
  {
    id: 'suzhou-health-service',
    title: '苏州疾控重要提醒',
    sourceLabel: '苏州市人民政府',
    sourceType: '苏州本地提醒',
    status: '本地官方原文',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合继续核对苏州本地呼吸道疾病提醒、季节性防护要点与就医前准备，优先查看原始发布页而不是栏目首页。',
    url: 'https://www.suzhou.gov.cn/szsrmzf/mszx/202503/0e436c984cfa4af5b44537f06a382a15.shtml',
    linkLabel: '查看苏州本地提醒原文',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    scope: 'local',
    city: '苏州',
    cities: ['苏州'],
    featuredOnDashboard: true,
    priority: 4,
  },
  {
    id: 'suzhou-cdc-alerts',
    title: '苏州疾控：季节性传染病与防护提醒',
    sourceLabel: '苏州市人民政府',
    sourceType: '苏州疾控提醒',
    status: '本地官方原文',
    lastUpdated: '2025-01-14T08:30:00+08:00',
    summary:
      '适合继续核对苏州本地流感、呼吸道与季节性传染病防护提醒，优先直达原始发布页。',
    url: 'https://www.suzhou.gov.cn/szsrmzf/jbfk/202603/c91161d62a864e468e5a4061e81817e2.shtml',
    linkLabel: '查看苏州疾控原文',
    topics: ['流感', '呼吸道', '发热', '咳嗽', '腹泻', '呕吐', '预防'],
    departments: ['呼吸内科', '感染科', '消化内科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
    scope: 'local',
    city: '苏州',
    cities: ['苏州'],
    featuredOnDashboard: true,
    priority: 4,
  },
  {
    id: 'beijing-health-service',
    title: '北京疾控提醒您：预防流感等呼吸道传染病',
    sourceLabel: '北京市人民政府',
    sourceType: '北京本地提醒',
    status: '本地官方原文',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合继续核对北京冬春季呼吸道疾病防护建议、口罩佩戴、通风与就医提醒，优先直达原始提醒页。',
    url: 'https://www.beijing.gov.cn/fuwu/bmfw/sy/jrts/tzxx/202412/t20241219_3969320.html',
    linkLabel: '查看北京疾控原文',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    scope: 'local',
    city: '北京',
    cities: ['北京'],
    featuredOnDashboard: true,
    priority: 3,
  },
  {
    id: 'shanghai-health-service',
    title: '上海市卫健委：医疗机构目录与就医服务',
    sourceLabel: '上海市卫生健康委员会',
    sourceType: '上海就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '可继续核对上海医疗机构目录、就医资源与官方服务入口，适合在就诊前确认机构信息和服务安排。',
    url: 'http://wsjkw.sh.gov.cn/yqfw_17502/yzml/index.html',
    linkLabel: '打开上海医疗机构目录',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    scope: 'local',
    city: '上海',
    cities: ['上海'],
    priority: 3,
  },
  {
    id: 'guangzhou-health-service',
    title: '广州市卫健委：发热门诊机构信息',
    sourceLabel: '广州市卫生健康委员会',
    sourceType: '广州就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '直接查看广州发热门诊机构信息与服务指引，适合发热、呼吸道不适或需线下评估时快速确认就诊点。',
    url: 'https://wjw.gz.gov.cn/fwxx/content/post_8993187.html',
    linkLabel: '打开广州发热门诊信息',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    scope: 'local',
    city: '广州',
    cities: ['广州'],
    priority: 3,
  },
  {
    id: 'shenzhen-health-service',
    title: '深圳市卫健委：发热门诊医疗机构信息汇总',
    sourceLabel: '深圳市卫生健康委员会',
    sourceType: '深圳就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '直接查看深圳发热门诊医疗机构汇总与官方通知，适合需要尽快确认线下就医入口时使用。',
    url: 'https://wjw.sz.gov.cn/yqxx/zwxx/content/post_8791029.html',
    linkLabel: '打开深圳发热门诊汇总',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    scope: 'local',
    city: '深圳',
    cities: ['深圳'],
    priority: 3,
  },
  {
    id: 'nanjing-health-service',
    title: '南京市卫健委：发热门诊机构名单',
    sourceLabel: '南京市卫生健康委员会',
    sourceType: '南京就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '可直接查看南京发热门诊机构名单与就医提示，适合发热或感染症状下快速确认本地接诊点。',
    url: 'http://wjw.nanjing.gov.cn/njswshjhsywyh/202101/t20210111_2788505.html',
    linkLabel: '打开南京发热门诊名单',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    scope: 'local',
    city: '南京',
    cities: ['南京'],
    priority: 3,
  },
  {
    id: 'hangzhou-health-service',
    title: '杭州市卫健委：便民查询与就医服务',
    sourceLabel: '杭州市卫生健康委员会',
    sourceType: '杭州就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '可继续核对杭州便民查询、医院目录与居民健康服务入口，适合本地就医前先确认机构与服务资源。',
    url: 'https://wsjkw.hangzhou.gov.cn/col/col1229005221/index.html',
    linkLabel: '打开杭州便民查询',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    scope: 'local',
    city: '杭州',
    cities: ['杭州'],
    priority: 3,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeCityName(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return Object.entries(SUPPORTED_CITY_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalized.includes(alias))
  )?.[0];
}

function createKeywordText(context: OfficialSourceContext): string {
  return [context.city ?? '', context.reason ?? '', ...(context.departments ?? []), ...(context.focusSymptoms ?? [])]
    .join(' ')
    .toLowerCase();
}

function scoreSource(source: SeededOfficialSource, context: OfficialSourceContext): number {
  const keywordText = createKeywordText(context);
  let score = source.priority ?? 0;

  if (source.cities?.length) {
    score += context.city && source.cities.includes(context.city) ? 5 : -3;
  }

  if (context.level && source.levels?.includes(context.level)) {
    score += 3;
  }

  source.topics.forEach((topic) => {
    if (keywordText.includes(topic.toLowerCase())) {
      score += 3;
    }
  });

  source.departments.forEach((department) => {
    if ((context.departments ?? []).some((item) => item.includes(department) || department.includes(item))) {
      score += 2;
    }
  });

  if (source.featuredOnDashboard) {
    score += 1;
  }

  return score;
}

function uniqueById(
  records: OfficialSourceRecord[],
  context: OfficialSourceContext = {}
): OfficialSourceRecord[] {
  return uniqueOfficialSourceRecords(records, context);
}

function deriveLatestRecordTime(records: OfficialSourceRecord[]): string {
  const timestamps = records
    .map((record) => {
      const parsed = new Date(record.lastUpdated);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    })
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => left.localeCompare(right));

  return timestamps.at(-1) ?? '';
}

function deriveFreshness(value: string, fallbackActive: boolean): OfficialSourceFreshness {
  if (fallbackActive) {
    return 'seeded';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'stale';
  }

  const ageHours = Math.max(0, Date.now() - parsed.getTime()) / (1000 * 60 * 60);
  if (ageHours <= 24) {
    return 'fresh';
  }

  if (ageHours <= 24 * 7) {
    return 'recent';
  }

  return 'stale';
}

function createSyncStatus(
  state: OfficialSourceFetchState,
  overrides: Partial<OfficialSourceSyncStatus> = {}
): OfficialSourceSyncStatus {
  const lastSyncTime = overrides.lastSyncTime ?? '';
  const latestRecordTime = overrides.latestRecordTime ?? '';
  const fallbackActive = overrides.fallbackActive ?? false;

  return {
    state,
    mode: overrides.mode ?? 'seeded-local',
    freshness:
      overrides.freshness ?? deriveFreshness(lastSyncTime || latestRecordTime, fallbackActive),
    sourceLabel: overrides.sourceLabel ?? DEFAULT_SOURCE_LABEL,
    summary: overrides.summary ?? '已整理相关官方公开资料。',
    note:
      overrides.note ??
      '用于与趋势参考交叉阅读，帮助核对防护建议、就医路径与疾病背景；卡片会优先直达原始发布页或服务页，不替代医生诊疗。',
    lastSyncTime,
    latestRecordTime,
    fallbackActive,
    configured: overrides.configured ?? gatewayAvailable,
    fetchedAt: overrides.fetchedAt ?? Date.now(),
    error: overrides.error,
  };
}

function normalizeContext(context: OfficialSourceContext): OfficialSourceContext {
  const city = normalizeCityName(
    context.city ??
      [context.reason ?? '', ...(context.departments ?? []), ...(context.focusSymptoms ?? [])].join(' ')
  );

  return {
    city,
    level: context.level,
    departments: Array.from(new Set((context.departments ?? []).filter(Boolean))),
    reason: context.reason?.trim() ?? '',
    focusSymptoms: Array.from(new Set((context.focusSymptoms ?? []).filter(Boolean))),
    maxItems: Math.max(1, Math.min(context.maxItems ?? DEFAULT_MAX_ITEMS, 5)),
  };
}

function getContextKey(context: OfficialSourceContext): string {
  const normalized = normalizeContext(context);

  return JSON.stringify({
    city: normalized.city ?? '',
    level: normalized.level ?? '',
    departments: normalized.departments ?? [],
    reason: normalized.reason ?? '',
    focusSymptoms: normalized.focusSymptoms ?? [],
    maxItems: normalized.maxItems ?? DEFAULT_MAX_ITEMS,
  });
}

function buildStorageKey(contextKey: string): string {
  return `${OFFICIAL_SOURCE_CACHE_PREFIX}:${encodeURIComponent(contextKey)}`;
}

function readPersistedBundle(contextKey: string): OfficialSourceBundle | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(buildStorageKey(contextKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedOfficialSourceBundle;
    if (!Array.isArray(parsed.records) || parsed.records.length === 0) {
      return null;
    }

    const persistedRecords = uniqueOfficialSourceRecords(parsed.records);
    const latestRecordTime = deriveLatestRecordTime(persistedRecords);
    return {
      records: persistedRecords,
      syncStatus: createSyncStatus(
        typeof parsed.syncStatus?.state === 'string'
          ? (parsed.syncStatus.state as OfficialSourceFetchState)
          : 'ready',
        {
          mode:
            typeof parsed.syncStatus?.mode === 'string'
              ? (parsed.syncStatus.mode as OfficialSourceSyncMode)
              : 'server-cache',
          freshness:
            typeof parsed.syncStatus?.freshness === 'string'
              ? (parsed.syncStatus.freshness as OfficialSourceFreshness)
              : deriveFreshness(
                  typeof parsed.syncStatus?.lastSyncTime === 'string'
                    ? parsed.syncStatus.lastSyncTime
                    : latestRecordTime,
                  Boolean(parsed.syncStatus?.fallbackActive)
                ),
          sourceLabel:
            typeof parsed.syncStatus?.sourceLabel === 'string'
              ? parsed.syncStatus.sourceLabel
              : DEFAULT_SOURCE_LABEL,
          summary:
            typeof parsed.syncStatus?.summary === 'string'
              ? parsed.syncStatus.summary
              : '显示最近一次已核对的官方公开资料摘要。',
           note:
             typeof parsed.syncStatus?.note === 'string'
               ? parsed.syncStatus.note
               : '当前无法刷新时，会继续展示最近一次可用的公开资料摘要，并尽量直达原始页面。',
          lastSyncTime:
            typeof parsed.syncStatus?.lastSyncTime === 'string' ? parsed.syncStatus.lastSyncTime : '',
          latestRecordTime,
          fallbackActive: Boolean(parsed.syncStatus?.fallbackActive),
          configured:
            typeof parsed.syncStatus?.configured === 'boolean'
              ? parsed.syncStatus.configured
              : gatewayAvailable,
          fetchedAt:
            typeof parsed.syncStatus?.fetchedAt === 'number'
              ? parsed.syncStatus.fetchedAt
              : Date.now(),
          error:
            typeof parsed.syncStatus?.error === 'string' ? parsed.syncStatus.error : undefined,
        }
      ),
    };
  } catch {
    return null;
  }
}

function persistBundle(contextKey: string, bundle: OfficialSourceBundle) {
  if (typeof window === 'undefined' || bundle.records.length === 0) return;

  try {
    const persisted: PersistedOfficialSourceBundle = {
      records: bundle.records,
      syncStatus: bundle.syncStatus,
    };

    localStorage.setItem(buildStorageKey(contextKey), JSON.stringify(persisted));
  } catch {
    // 本地缓存失败时静默回退，不影响当前页面渲染
  }
}

function buildOfficialSourceQuery(context: OfficialSourceContext): string {
  const normalized = normalizeContext(context);
  const focusTerms = Array.from(
    new Set([...(normalized.focusSymptoms ?? []), ...(normalized.departments ?? [])])
  ).slice(0, 4);

  const riskHint =
    normalized.level === 'red'
      ? '急诊 危险信号'
      : normalized.level === 'orange'
      ? '及时就医'
      : normalized.level === 'yellow'
      ? '就医提示'
      : '健康提醒';

  return [
    normalized.city ?? '',
    ...focusTerms,
    normalized.reason ?? '',
    riskHint,
    normalized.city ? `${normalized.city} 本地就医` : '',
    '官方',
    '卫健委',
    '疾控',
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toOfficialSourceRecord(value: unknown, index: number): OfficialSourceRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!title) {
    return null;
  }

  const summary =
    typeof value.summary === 'string' && value.summary.trim()
      ? value.summary.trim()
      : typeof value.snippet === 'string' && value.snippet.trim()
      ? value.snippet.trim()
      : '请前往官方原文查看完整说明。';

  const url =
    typeof value.url === 'string' && value.url.trim()
      ? value.url.trim()
      : typeof value.link === 'string' && value.link.trim()
      ? value.link.trim()
      : undefined;

  return enrichOfficialSourceRecord({
    id:
      typeof value.id === 'string' && value.id.trim()
        ? value.id.trim()
        : `official-cloud-${index}-${title}`,
    title,
    sourceLabel:
      typeof value.sourceLabel === 'string' && value.sourceLabel.trim()
        ? value.sourceLabel.trim()
        : typeof value.host === 'string' && value.host.trim()
        ? value.host.trim()
        : '官方公开来源',
    sourceType:
      typeof value.sourceType === 'string' && value.sourceType.trim()
        ? value.sourceType.trim()
        : '公开摘要',
    status:
      typeof value.status === 'string' && value.status.trim()
        ? value.status.trim()
        : url
        ? '公开资料'
        : '摘要摘录',
    lastUpdated:
      typeof value.lastUpdated === 'string' && value.lastUpdated.trim()
        ? value.lastUpdated.trim()
        : typeof value.fetchedAt === 'string' && value.fetchedAt.trim()
        ? value.fetchedAt.trim()
        : new Date().toISOString(),
    summary,
    url,
    linkLabel:
      typeof value.linkLabel === 'string' && value.linkLabel.trim()
        ? value.linkLabel.trim()
        : url
        ? '打开原始页面'
        : undefined,
    scope:
      value.scope === 'local' || value.scope === 'national' || value.scope === 'international'
        ? value.scope
        : undefined,
    city: typeof value.city === 'string' && value.city.trim() ? normalizeCityName(value.city) : undefined,
  });
}

function createSeededBundle(
  context: OfficialSourceContext,
  overrides: Partial<OfficialSourceSyncStatus> = {}
): OfficialSourceBundle {
  const records = getOfficialSourceComparison(context);
  const latestRecordTime = deriveLatestRecordTime(records);
  const state =
    overrides.state ??
    (gatewayAvailable && !overrides.error && overrides.mode !== 'seeded-local' ? 'loading' : 'ready');

  return {
    records,
    syncStatus: createSyncStatus(state, {
      mode: 'seeded-local',
      freshness: 'seeded',
      sourceLabel: overrides.sourceLabel ?? '官方公开资料',
      summary:
        overrides.summary ??
        (gatewayAvailable
          ? '正在更新官方公开资料，当前先展示已核对的公开摘要。'
          : '当前展示已核对的官方公开资料摘要。'),
      note:
        overrides.note ??
        (gatewayAvailable
          ? '如检测到更新的公开资料，会自动补充到此处；当前卡片会优先直达原始发布页或服务页。'
          : '当前以已核对的公开资料作为权威对照层，卡片会优先直达原始发布页或服务页。'),
      lastSyncTime: overrides.lastSyncTime ?? '',
      latestRecordTime,
      fallbackActive: overrides.fallbackActive ?? true,
      configured: overrides.configured ?? gatewayAvailable,
      fetchedAt: overrides.fetchedAt ?? Date.now(),
      error: overrides.error,
    }),
  };
}

function normalizeGatewayBundle(
  payload: OfficialSourceGatewayPayload,
  context: OfficialSourceContext,
  fallbackBundle: OfficialSourceBundle
): OfficialSourceBundle {
  const payloadStatus = isRecord(payload.syncStatus) ? payload.syncStatus : undefined;
  const fromRecords = Array.isArray(payload.records)
    ? payload.records
        .map((item, index) => toOfficialSourceRecord(item, index))
        .filter((item): item is OfficialSourceRecord => Boolean(item))
    : [];

  const fromResults = Array.isArray(payload.results)
    ? payload.results
        .map((item, index) => toOfficialSourceRecord(item, index + fromRecords.length))
        .filter((item): item is OfficialSourceRecord => Boolean(item))
    : [];

  const maxItems = normalizeContext(context).maxItems ?? DEFAULT_MAX_ITEMS;
  const records = sortOfficialSourceRecords(
    [...fromRecords, ...fromResults, ...fallbackBundle.records],
    context
  ).slice(0, maxItems);

  const fallbackActive =
    typeof payloadStatus?.fallbackActive === 'boolean'
      ? payloadStatus.fallbackActive
      : typeof payload.fallbackActive === 'boolean'
      ? payload.fallbackActive
      : payload.ok === false || fromRecords.length === 0;

  const lastSyncTime =
    typeof payloadStatus?.lastSyncTime === 'string'
      ? payloadStatus.lastSyncTime
      : typeof payload.lastSyncTime === 'string'
      ? payload.lastSyncTime
      : typeof payload.fetchedAt === 'string'
      ? payload.fetchedAt
      : fallbackBundle.syncStatus.lastSyncTime;

  const latestRecordTime =
    typeof payloadStatus?.latestRecordTime === 'string'
      ? payloadStatus.latestRecordTime
      : deriveLatestRecordTime(records);

  const mode =
    typeof payloadStatus?.mode === 'string'
      ? (payloadStatus.mode as OfficialSourceSyncMode)
      : fallbackActive
      ? 'seeded-local'
      : 'server-live';

  const summary =
    typeof payloadStatus?.summary === 'string' && payloadStatus.summary.trim()
      ? payloadStatus.summary
      : typeof payload.message === 'string' && payload.message.trim()
      ? payload.message
      : fallbackActive
      ? '当前暂未获取到新的公开资料，先保留已核对的官方资料卡。'
      : `已同步 ${records.length} 条官方公开资料摘要。`;

  const note =
    typeof payloadStatus?.note === 'string' && payloadStatus.note.trim()
      ? payloadStatus.note
      : typeof payload.note === 'string' && payload.note.trim()
      ? payload.note
      : fallbackActive
      ? '当前继续展示已核对的公开资料，卡片会优先直达原始发布页或服务页。'
      : '仅摘录官方公开网页摘要，卡片会尽量直达原始页面；请以原文和线下医生意见为准。';

  return {
    records,
    syncStatus: createSyncStatus('ready', {
      mode,
      freshness:
        typeof payloadStatus?.freshness === 'string'
          ? (payloadStatus.freshness as OfficialSourceFreshness)
          : deriveFreshness(lastSyncTime || latestRecordTime, fallbackActive),
      sourceLabel:
        typeof payloadStatus?.sourceLabel === 'string' && payloadStatus.sourceLabel.trim()
          ? payloadStatus.sourceLabel
          : typeof payload.sourceLabel === 'string' && payload.sourceLabel.trim()
          ? payload.sourceLabel
          : fallbackBundle.syncStatus.sourceLabel,
      summary,
      note,
      lastSyncTime,
      latestRecordTime,
      fallbackActive,
      configured:
        typeof payloadStatus?.configured === 'boolean'
          ? payloadStatus.configured
          : typeof payload.configured === 'boolean'
          ? payload.configured
          : gatewayAvailable,
      fetchedAt:
        typeof payloadStatus?.fetchedAt === 'number'
          ? payloadStatus.fetchedAt
          : Number.isNaN(Date.parse(lastSyncTime))
          ? Date.now()
          : Date.parse(lastSyncTime),
      error:
        typeof payloadStatus?.error === 'string'
          ? payloadStatus.error
          : payload.ok === false && typeof payload.message === 'string'
          ? payload.message
          : undefined,
    }),
  };
}

function getCachedBundle(contextKey: string): OfficialSourceBundle | null {
  const inMemory = officialSourceMemoryCache.get(contextKey);
  if (inMemory) {
    return inMemory;
  }

  const persisted = readPersistedBundle(contextKey);
  if (persisted) {
    officialSourceMemoryCache.set(contextKey, persisted);
    return persisted;
  }

  return null;
}

function createInitialBundle(context: OfficialSourceContext): OfficialSourceBundle {
  const contextKey = getContextKey(context);
  const cached = getCachedBundle(contextKey);

  if (cached) {
    const isFresh = Date.now() - cached.syncStatus.fetchedAt < OFFICIAL_SOURCE_TTL_MS;
    if (isFresh) {
      return cached;
    }

    return {
      ...cached,
      syncStatus: createSyncStatus('loading', {
        ...cached.syncStatus,
        mode: cached.syncStatus.mode === 'server-live' ? 'server-cache' : cached.syncStatus.mode,
        summary: '正在核对较新的官方公开资料，当前先展示最近一次结果。',
        note: '如本次刷新失败，会继续保留最近一次可用的官方公开资料摘要，并尽量直达原始页面。',
        fallbackActive: true,
        freshness: 'stale',
      }),
    };
  }

  return createSeededBundle(context, {
    state: gatewayAvailable ? 'loading' : 'ready',
  });
}

export function formatOfficialSourceTime(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getOfficialSourceComparison(context: OfficialSourceContext): OfficialSourceRecord[] {
  const normalized = normalizeContext(context);
  const maxItems = normalized.maxItems ?? DEFAULT_MAX_ITEMS;
  const ranked = [...SEEDED_OFFICIAL_SOURCES]
    .sort((a, b) => {
      const scoreDiff = scoreSource(b, normalized) - scoreSource(a, normalized);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return (
        getOfficialSourceRecordPriority(b, normalized) -
        getOfficialSourceRecordPriority(a, normalized)
      );
    })
    .slice(0, maxItems + 2);

  const fallbacks = SEEDED_OFFICIAL_SOURCES.filter((record) => record.featuredOnDashboard);
  return uniqueById([...ranked, ...fallbacks, ...SEEDED_OFFICIAL_SOURCES], normalized).slice(
    0,
    maxItems
  );
}

export function getDashboardOfficialSources(focusSymptoms: string[] = []): OfficialSourceRecord[] {
  return getOfficialSourceComparison({
    city: getActiveCity(),
    level: 'yellow',
    departments: ['呼吸内科', '全科医学科'],
    focusSymptoms,
    maxItems: 3,
  });
}

export async function syncOfficialSourceBundle(
  context: OfficialSourceContext,
  options: { force?: boolean } = {}
): Promise<OfficialSourceBundle> {
  const normalized = normalizeContext(context);
  const contextKey = getContextKey(normalized);
  const cached = getCachedBundle(contextKey);

  if (
    !options.force &&
    cached &&
    cached.syncStatus.mode !== 'seeded-local' &&
    Date.now() - cached.syncStatus.fetchedAt < OFFICIAL_SOURCE_TTL_MS
  ) {
    return cached;
  }

  if (!gatewayAvailable) {
    const fallback = createSeededBundle(normalized);
    officialSourceMemoryCache.set(contextKey, fallback);
    return fallback;
  }

  const inflight = officialSourceRequestCache.get(contextKey);
  if (inflight) {
    return inflight;
  }

  const request = (async () => {
    const fallbackBundle = cached ?? createSeededBundle(normalized, { state: 'loading' });

    try {
      const payload = await callGatewayJson<OfficialSourceGatewayPayload>('official-source-fetch', {
        method: 'POST',
        path: 'search',
        body: {
          query: buildOfficialSourceQuery(normalized),
          maxItems: normalized.maxItems ?? DEFAULT_MAX_ITEMS,
          maxResults: normalized.maxItems ?? DEFAULT_MAX_ITEMS,
          city: normalized.city ?? '',
          level: normalized.level,
          departments: normalized.departments ?? [],
          focusSymptoms: normalized.focusSymptoms ?? [],
          reason: normalized.reason ?? '',
        },
      });

      const bundle = normalizeGatewayBundle(payload, normalized, fallbackBundle);
      officialSourceMemoryCache.set(contextKey, bundle);
      persistBundle(contextKey, bundle);
      return bundle;
    } catch (error) {
      const message = error instanceof Error ? error.message : '官方公开资料更新失败';

      if (cached) {
        const staleBundle: OfficialSourceBundle = {
          ...cached,
          syncStatus: createSyncStatus('error', {
            ...cached.syncStatus,
            mode: cached.syncStatus.mode === 'server-live' ? 'server-cache' : cached.syncStatus.mode,
            fallbackActive: true,
            freshness: 'stale',
            summary: '更新较新的官方公开资料失败，当前展示最近一次结果。',
            note: '网络暂不可用时，会继续保留最近一次可用的官方公开资料摘要。',
            error: message,
          }),
        };

        officialSourceMemoryCache.set(contextKey, staleBundle);
        return staleBundle;
      }

      const fallback = createSeededBundle(normalized, {
        state: 'error',
        summary: '暂时无法更新较新的官方公开资料，当前展示已核对摘要。',
        note: '当前未能完成刷新，不影响继续查看已整理的官方公开资料卡。',
        error: message,
      });
      officialSourceMemoryCache.set(contextKey, fallback);
      return fallback;
    } finally {
      officialSourceRequestCache.delete(contextKey);
    }
  })();

  officialSourceRequestCache.set(contextKey, request);
  return request;
}

export function useOfficialSourceComparison(context: OfficialSourceContext): OfficialSourceBundle {
  const normalizedContext = useMemo(() => normalizeContext(context), [context]);
  const contextKey = useMemo(() => getContextKey(normalizedContext), [normalizedContext]);
  const initialBundle = useMemo(() => createInitialBundle(normalizedContext), [normalizedContext]);
  const [bundleState, setBundleState] = useState<{ key: string; bundle: OfficialSourceBundle }>(
    () => ({
      key: contextKey,
      bundle: initialBundle,
    })
  );

  useEffect(() => {
    let cancelled = false;

    if (!gatewayAvailable) {
      return () => {
        cancelled = true;
      };
    }

    void syncOfficialSourceBundle(normalizedContext).then((nextBundle) => {
      if (!cancelled) {
        setBundleState({
          key: contextKey,
          bundle: nextBundle,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [contextKey, normalizedContext]);

  return bundleState.key === contextKey ? bundleState.bundle : initialBundle;
}

export function useDashboardOfficialSources(focusSymptoms: string[] = []): OfficialSourceBundle {
  const city = getActiveCity();
  const context = useMemo(
    () => ({
      city,
      level: 'yellow' as const,
      departments: ['呼吸内科', '全科医学科'],
      focusSymptoms,
      maxItems: 3,
    }),
    [city, focusSymptoms]
  );

  return useOfficialSourceComparison(context);
}
