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
import { callGatewayJson, hasGatewayRoute } from './serverGateway';

export interface OfficialSourceContext {
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

const OFFICIAL_SOURCE_CACHE_PREFIX = 'symptom_official_source_sync_v2';
const OFFICIAL_SOURCE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ITEMS = 3;
const DEFAULT_SOURCE_LABEL = '官方公开资料对照';
const gatewayAvailable = hasGatewayRoute('official-source-fetch');

const officialSourceMemoryCache = new Map<string, OfficialSourceBundle>();
const officialSourceRequestCache = new Map<string, Promise<OfficialSourceBundle>>();

const SEEDED_OFFICIAL_SOURCES: SeededOfficialSource[] = [
  {
    id: 'china-cdc-flu-weekly',
    title: '中国疾控中心：流感与呼吸道传染病专题',
    sourceLabel: '中国疾病预防控制中心',
    sourceType: '疾控专题',
    status: '官方资料',
    lastUpdated: '2025-01-12T09:00:00+08:00',
    summary:
      '适合对照发热、咳嗽、咽痛等症状的季节性变化；若出现持续高热、气促或精神状态变差，应尽快线下就医。',
    url: 'https://www.chinacdc.cn/jkzt/crb/lxxgm/',
    linkLabel: '查看疾控流感专题',
    topics: ['发热', '咳嗽', '咽痛', '流感', '呼吸道', '鼻塞'],
    departments: ['呼吸内科', '感染科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
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
    url: 'http://bmfw.www.gov.cn/yljgcx/index.html',
    linkLabel: '查询附近发热门诊',
    topics: ['高热', '呼吸困难', '发热', '咳嗽', '胸闷'],
    departments: ['呼吸内科', '急诊科', '感染科'],
    levels: ['yellow', 'orange', 'red'],
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
      '涵盖常见呼吸道、消化道传染病的预防知识，包括手卫生、口罩佩戴、居家隔离与就医时机判断。',
    url: 'https://www.chinacdc.cn/jkzt/crb/',
    linkLabel: '查看传染病防治专题',
    topics: ['呼吸道', '发热', '咳嗽', '传染病', '预防'],
    departments: ['呼吸内科', '儿科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
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
      '用于理解全球季节性流感和急性呼吸道感染的公共卫生背景，帮助判断趋势，但不替代个体诊断。',
    url: 'https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)',
    linkLabel: '查看 WHO 流感概述',
    topics: ['流感', '呼吸道', '发热', '疲劳', '咳嗽'],
    departments: ['呼吸内科', '感染科'],
    levels: ['green', 'yellow', 'orange'],
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
      '若腹泻、呕吐、腹痛伴脱水风险，应及时补液，并留意是否需要消化内科或急诊进一步评估。',
    url: 'https://www.chinacdc.cn/jkzt/crb/nrbdyzgr/',
    linkLabel: '查看诺如防控指南',
    topics: ['腹泻', '呕吐', '腹痛', '恶心', '肠胃'],
    departments: ['消化内科', '急诊科'],
    levels: ['green', 'yellow', 'orange'],
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
    linkLabel: '查看卒中防治知识',
    topics: ['头晕', '头痛', '言语不清', '肢体无力', '卒中'],
    departments: ['神经内科', '急诊科'],
    levels: ['orange', 'red'],
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
    linkLabel: '查看心血管急救知识',
    topics: ['胸痛', '胸闷', '心慌', '呼吸困难', '大汗'],
    departments: ['心内科', '急诊科'],
    levels: ['orange', 'red'],
    priority: 5,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createKeywordText(context: OfficialSourceContext): string {
  return [context.reason ?? '', ...(context.departments ?? []), ...(context.focusSymptoms ?? [])]
    .join(' ')
    .toLowerCase();
}

function scoreSource(source: SeededOfficialSource, context: OfficialSourceContext): number {
  const keywordText = createKeywordText(context);
  let score = source.priority ?? 0;

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

function uniqueById(records: OfficialSourceRecord[]): OfficialSourceRecord[] {
  return Array.from(new Map(records.map((record) => [record.id, record])).values());
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
      '用于与趋势参考交叉阅读，帮助核对防护建议、就医路径与疾病背景，不替代医生诊疗。',
    lastSyncTime,
    latestRecordTime,
    fallbackActive,
    configured: overrides.configured ?? gatewayAvailable,
    fetchedAt: overrides.fetchedAt ?? Date.now(),
    error: overrides.error,
  };
}

function normalizeContext(context: OfficialSourceContext): OfficialSourceContext {
  return {
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

    const latestRecordTime = deriveLatestRecordTime(parsed.records);
    return {
      records: parsed.records,
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
              : '当前无法刷新时，会继续展示最近一次可用的公开资料摘要。',
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

  return [...focusTerms, normalized.reason ?? '', riskHint, '官方', '卫健委', '疾控']
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

  return {
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
        ? '查看原文'
        : undefined,
  };
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
          ? '如检测到更新的公开资料，会自动补充到此处；当前内容仍可作为权威对照层。'
          : '当前以已核对的公开资料作为权威对照层，便于与趋势信号交叉阅读。'),
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
  const records = uniqueById([...fromRecords, ...fromResults, ...fallbackBundle.records]).slice(
    0,
    maxItems
  );

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
      ? '当前继续展示已核对的公开资料，便于与趋势参考共同判断。'
      : '仅摘录官方公开网页摘要，请以原文和线下医生意见为准。';

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
        note: '如本次刷新失败，会继续保留最近一次可用的官方公开资料摘要。',
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
    .sort((a, b) => scoreSource(b, normalized) - scoreSource(a, normalized))
    .slice(0, maxItems + 2);

  const fallbacks = SEEDED_OFFICIAL_SOURCES.filter((record) => record.featuredOnDashboard);
  return uniqueById([...ranked, ...fallbacks, ...SEEDED_OFFICIAL_SOURCES]).slice(0, maxItems);
}

export function getDashboardOfficialSources(focusSymptoms: string[] = []): OfficialSourceRecord[] {
  return getOfficialSourceComparison({
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
  const context = useMemo(
    () => ({
      level: 'yellow' as const,
      departments: ['呼吸内科', '全科医学科'],
      focusSymptoms,
      maxItems: 3,
    }),
    [focusSymptoms]
  );

  return useOfficialSourceComparison(context);
}
