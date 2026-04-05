import { corsHeaders, jsonResponse } from '../_shared/http.ts';

type RiskLevel = 'green' | 'yellow' | 'orange' | 'red';

interface OfficialSourceRecord {
  id: string;
  title: string;
  sourceLabel: string;
  sourceType: string;
  status: string;
  lastUpdated: string;
  summary: string;
  url?: string;
  linkLabel?: string;
}

interface OfficialSourceSeed extends OfficialSourceRecord {
  topics: string[];
  departments: string[];
  levels?: RiskLevel[];
  priority?: number;
}

interface SearchRequestBody {
  query?: string;
  maxResults?: number;
  maxItems?: number;
  level?: RiskLevel;
  departments?: string[];
  focusSymptoms?: string[];
  reason?: string;
}

const DEFAULT_OFFICIAL_DOMAINS = [
  'www.nhc.gov.cn',
  'www.chinacdc.cn',
  'www.who.int',
  'wjw.beijing.gov.cn',
  'www.cdc.gov',
];

const OFFICIAL_DOMAINS = Array.from(
  new Set(
    (Deno.env.get('OFFICIAL_SOURCE_DOMAINS') ?? DEFAULT_OFFICIAL_DOMAINS.join(','))
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  )
);

const OFFICIAL_SYNC_LABEL = 'Supabase 官方信源同步';
const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY') ?? Deno.env.get('VITE_TAVILY_API_KEY');

const SEEDED_OFFICIAL_SOURCES: OfficialSourceSeed[] = [
  {
    id: 'china-cdc-flu-weekly',
    title: '流感样病例监测周报',
    sourceLabel: '中国疾病预防控制中心',
    sourceType: '官方监测',
    status: '公开摘要',
    lastUpdated: '2025-01-12T09:00:00+08:00',
    summary: '适合对照发热、咳嗽、咽痛等症状的季节性活跃度；若持续高热或呼吸困难，仍应线下就医。',
    url: 'https://www.chinacdc.cn/jkzt/crb/',
    linkLabel: '查看疾控专题',
    topics: ['发热', '咳嗽', '咽痛', '流感', '呼吸道', '鼻塞'],
    departments: ['呼吸内科', '感染科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
    priority: 4,
  },
  {
    id: 'nhc-fever-guidance',
    title: '发热门诊与呼吸道就诊提示',
    sourceLabel: '国家卫生健康委员会',
    sourceType: '官方发布',
    status: '就医指引',
    lastUpdated: '2025-01-08T10:00:00+08:00',
    summary: '当出现高热不退、气促、基础病加重或老人儿童持续不适时，应优先前往发热门诊或急诊评估。',
    url: 'https://www.nhc.gov.cn/',
    linkLabel: '查看卫健委入口',
    topics: ['高热', '呼吸困难', '发热', '咳嗽', '胸闷'],
    departments: ['呼吸内科', '急诊科', '感染科'],
    levels: ['yellow', 'orange', 'red'],
    priority: 5,
  },
  {
    id: 'beijing-winter-reminder',
    title: '北京市冬春季呼吸道感染防护提醒',
    sourceLabel: '北京市卫生健康委员会',
    sourceType: '地方卫健委',
    status: '本地提醒',
    lastUpdated: '2025-01-11T08:30:00+08:00',
    summary: '结合本地就诊高峰与校园场景提醒做好通风和分流就医，适合作为北京地区的补充参考。',
    url: 'https://wjw.beijing.gov.cn/',
    linkLabel: '查看北京卫健委',
    topics: ['呼吸道', '发热', '咳嗽', '学校', '北京'],
    departments: ['呼吸内科', '儿科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
    priority: 4,
  },
  {
    id: 'china-cdc-gastroenteritis',
    title: '急性胃肠炎 / 诺如病毒防护提示',
    sourceLabel: '中国疾病预防控制中心',
    sourceType: '官方科普',
    status: '症状对照',
    lastUpdated: '2024-11-28T09:30:00+08:00',
    summary: '若腹泻、呕吐、腹痛伴脱水风险，应及时补液并关注是否需要消化内科或急诊进一步评估。',
    url: 'https://www.chinacdc.cn/',
    linkLabel: '查看疾控中心',
    topics: ['腹泻', '呕吐', '腹痛', '恶心', '肠胃'],
    departments: ['消化内科', '急诊科'],
    levels: ['green', 'yellow', 'orange'],
    priority: 4,
  },
  {
    id: 'stroke-fast',
    title: '卒中 FAST 识别与 120 提示',
    sourceLabel: '国家卫生健康委脑卒中防治相关公开指南',
    sourceType: '权威指南',
    status: '急症识别',
    lastUpdated: '2024-10-16T09:00:00+08:00',
    summary: '若出现口角歪斜、单侧无力、言语不清等急性神经系统症状，应立即拨打 120，不建议等待观察。',
    url: 'https://www.nhc.gov.cn/',
    linkLabel: '查看急救信息',
    topics: ['头晕', '头痛', '言语不清', '肢体无力', '卒中'],
    departments: ['神经内科', '急诊科'],
    levels: ['orange', 'red'],
    priority: 5,
  },
];

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function createKeywordText(body: SearchRequestBody): string {
  return [body.query ?? '', body.reason ?? '', ...toStringArray(body.departments), ...toStringArray(body.focusSymptoms)]
    .join(' ')
    .toLowerCase();
}

function scoreSeededSource(source: OfficialSourceSeed, body: SearchRequestBody): number {
  const keywordText = createKeywordText(body);
  let score = source.priority ?? 0;

  if (body.level && source.levels?.includes(body.level)) {
    score += 3;
  }

  source.topics.forEach((topic) => {
    if (keywordText.includes(topic.toLowerCase())) {
      score += 3;
    }
  });

  source.departments.forEach((department) => {
    if (toStringArray(body.departments).some((item) => item.includes(department) || department.includes(item))) {
      score += 2;
    }
  });

  return score;
}

function uniqueById(records: OfficialSourceRecord[]): OfficialSourceRecord[] {
  return Array.from(new Map(records.map((record) => [record.id, record])).values());
}

function selectFallbackRecords(body: SearchRequestBody, maxItems: number): OfficialSourceRecord[] {
  return uniqueById(
    [...SEEDED_OFFICIAL_SOURCES].sort((a, b) => scoreSeededSource(b, body) - scoreSeededSource(a, body))
  ).slice(0, maxItems);
}

function deriveLatestRecordTime(records: OfficialSourceRecord[]): string {
  const values = records
    .map((record) => {
      const parsed = new Date(record.lastUpdated);
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
    })
    .filter(Boolean)
    .sort();

  return values.length > 0 ? values[values.length - 1] : '';
}

function getHostMeta(rawUrl: string): { sourceLabel: string; sourceType: string; host: string } {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, '');

    if (host.includes('nhc.gov.cn')) {
      return { sourceLabel: '国家卫生健康委员会', sourceType: '官方发布', host };
    }

    if (host.includes('chinacdc.cn')) {
      return { sourceLabel: '中国疾病预防控制中心', sourceType: '官方监测', host };
    }

    if (host.includes('who.int')) {
      return { sourceLabel: 'World Health Organization', sourceType: '国际机构', host };
    }

    if (host.includes('wjw.beijing.gov.cn')) {
      return { sourceLabel: '北京市卫生健康委员会', sourceType: '地方卫健委', host };
    }

    return { sourceLabel: host, sourceType: '官方公开来源', host };
  } catch {
    return { sourceLabel: '官方公开来源', sourceType: '云端摘要', host: 'official-source' };
  }
}

function buildQuery(body: SearchRequestBody): string {
  const provided = body.query?.trim();
  if (provided) {
    return provided;
  }

  const focusTerms = Array.from(new Set([...toStringArray(body.focusSymptoms), ...toStringArray(body.departments)])).slice(0, 4);
  const riskHint =
    body.level === 'red' ? '急诊 危险信号' : body.level === 'orange' ? '及时就医' : body.level === 'yellow' ? '就医提示' : '健康提醒';

  return [...focusTerms, body.reason ?? '', riskHint, '官方', '卫健委', '疾控']
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildResultItems(records: OfficialSourceRecord[]) {
  return records.map((record) => ({
    title: record.title,
    url: record.url ?? '',
    snippet: record.summary,
    host: getHostMeta(record.url ?? '').host,
  }));
}

function createSyncStatus(params: {
  mode: 'seeded-local' | 'server-cache' | 'server-live';
  fallbackActive: boolean;
  configured: boolean;
  lastSyncTime?: string;
  latestRecordTime?: string;
  summary: string;
  note: string;
  error?: string;
}) {
  return {
    state: params.error ? 'error' : 'ready',
    mode: params.mode,
    freshness: params.fallbackActive ? 'seeded' : 'fresh',
    sourceLabel: OFFICIAL_SYNC_LABEL,
    summary: params.summary,
    note: params.note,
    lastSyncTime: params.lastSyncTime ?? '',
    latestRecordTime: params.latestRecordTime ?? '',
    fallbackActive: params.fallbackActive,
    configured: params.configured,
    fetchedAt: Date.now(),
    ...(params.error ? { error: params.error } : {}),
  };
}

function createFallbackPayload(body: SearchRequestBody, reason: string, error?: string) {
  const maxItems = Math.max(1, Math.min(body.maxItems ?? 3, 5));
  const records = selectFallbackRecords(body, maxItems);
  const fetchedAt = new Date().toISOString();

  return {
    ok: !error,
    service: 'official-source-fetch',
    configured: Boolean(TAVILY_API_KEY),
    fallbackActive: true,
    source: 'official-source-fallback',
    sourceLabel: OFFICIAL_SYNC_LABEL,
    fetchedAt,
    lastSyncTime: fetchedAt,
    query: buildQuery(body),
    officialDomains: OFFICIAL_DOMAINS,
    message: reason,
    note: '当前展示人工维护的公开资料摘要；待配置 Edge Function secrets 或网络恢复后，会自动尝试云端同步。',
    records,
    results: buildResultItems(records),
    syncStatus: createSyncStatus({
      mode: 'seeded-local',
      fallbackActive: true,
      configured: Boolean(TAVILY_API_KEY),
      lastSyncTime: fetchedAt,
      latestRecordTime: deriveLatestRecordTime(records),
      summary: reason,
      note: '当前以人工维护的官方公开资料卡为主，确保没有外部配置时页面仍然稳定可信。',
      error,
    }),
    ...(error ? { error: 'upstream_failed' } : {}),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  if (req.method === 'GET') {
    return jsonResponse({
      ok: true,
      service: 'official-source-fetch',
      configured: Boolean(TAVILY_API_KEY),
      allowedDomains: OFFICIAL_DOMAINS,
      note: 'POST /search 可按症状或科室拉取官方公开资料摘要；未配置密钥时会自动回退到内置参考卡。',
      syncStatus: createSyncStatus({
        mode: TAVILY_API_KEY ? 'server-live' : 'seeded-local',
        fallbackActive: !TAVILY_API_KEY,
        configured: Boolean(TAVILY_API_KEY),
        summary: TAVILY_API_KEY ? '已就绪，可发起服务端官方资料检索。' : '尚未配置 Tavily 密钥，当前将回退到内置官方资料卡。',
        note: '此接口只返回官方公开网页摘要，不做诊断结论。',
      }),
      path: url.pathname,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
  }

  try {
    const body = ((await req.json()) as SearchRequestBody | null) ?? {};
    const query = buildQuery(body);

    if (!query) {
      return jsonResponse({ ok: false, error: 'query_required' }, 400);
    }

    if (!TAVILY_API_KEY) {
      return jsonResponse(
        createFallbackPayload(
          { ...body, query },
          '未配置 TAVILY_API_KEY，当前改为展示内置官方公开资料摘要。'
        )
      );
    }

    const maxItems = Math.max(1, Math.min(body.maxItems ?? 3, 5));
    const fallbackRecords = selectFallbackRecords({ ...body, query }, maxItems);

    const upstream = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        topic: 'general',
        search_depth: 'advanced',
        max_results: Math.min(body.maxResults ?? Math.max(maxItems + 1, 3), 5),
        include_domains: OFFICIAL_DOMAINS,
      }),
    });

    if (!upstream.ok) {
      return jsonResponse(
        createFallbackPayload(
          { ...body, query },
          `官方信源上游检索暂时失败（HTTP ${upstream.status}），已回退到内置公开资料摘要。`,
          `Tavily 请求失败：${upstream.status}`
        )
      );
    }

    const data = await upstream.json();
    const fetchedAt = new Date().toISOString();
    const cloudRecords = Array.isArray(data.results)
      ? data.results
          .map((item: Record<string, unknown>, index: number) => {
            const title = typeof item.title === 'string' ? item.title.trim() : '';
            const rawUrl = typeof item.url === 'string' ? item.url : '';
            const snippet =
              typeof item.content === 'string'
                ? item.content.slice(0, 180)
                : typeof item.snippet === 'string'
                ? item.snippet.slice(0, 180)
                : '';

            if (!title) {
              return null;
            }

            const hostMeta = getHostMeta(rawUrl);

            return {
              id: `cloud-${index}-${title}`,
              title,
              sourceLabel: hostMeta.sourceLabel,
              sourceType: hostMeta.sourceType,
              status: '云端同步',
              lastUpdated: fetchedAt,
              summary: snippet || '已同步官方公开网页摘要，请点击原文查看完整说明。',
              url: rawUrl || undefined,
              linkLabel: rawUrl ? '查看官方原文' : undefined,
            } satisfies OfficialSourceRecord;
          })
          .filter((item): item is OfficialSourceRecord => Boolean(item))
      : [];

    const records = uniqueById([...cloudRecords, ...fallbackRecords]).slice(0, maxItems);
    const fallbackActive = cloudRecords.length === 0;

    return jsonResponse({
      ok: true,
      service: 'official-source-fetch',
      configured: true,
      fallbackActive,
      source: fallbackActive ? 'official-source-fallback' : 'tavily-official',
      sourceLabel: OFFICIAL_SYNC_LABEL,
      fetchedAt,
      lastSyncTime: fetchedAt,
      query,
      officialDomains: OFFICIAL_DOMAINS,
      message: fallbackActive
        ? '已成功访问官方检索通道，但本次未命中新增结果，继续保留内置公开资料摘要。'
        : `已通过服务端同步 ${cloudRecords.length} 条官方公开摘要。`,
      note: fallbackActive
        ? '当前结果以人工维护卡片为主，适合稳态展示；后续如命中更多官方网页，会自动替换为云端摘要。'
        : '仅摘录官方公开网页摘要，仍建议以原文和医生意见为准。',
      records,
      results: buildResultItems(records),
      syncStatus: createSyncStatus({
        mode: fallbackActive ? 'server-cache' : 'server-live',
        fallbackActive,
        configured: true,
        lastSyncTime: fetchedAt,
        latestRecordTime: deriveLatestRecordTime(records),
        summary: fallbackActive
          ? '已连接服务端通道，但本次未命中更多官方内容，先展示最近可用摘要。'
          : `已通过服务端从官方域名抓取 ${cloudRecords.length} 条公开摘要。`,
        note: fallbackActive
          ? '如果官方网页短期内没有可提炼的新摘要，会继续显示内置稳定卡片。'
          : '目前只返回公开网页摘要与链接，不会替代线下医生诊断。',
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return jsonResponse(
      createFallbackPayload(
        {},
        '官方数据同步过程中出现异常，已回退到内置公开资料摘要。',
        message
      )
    );
  }
});
