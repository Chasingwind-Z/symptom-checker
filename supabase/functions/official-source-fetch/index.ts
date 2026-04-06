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
  cities?: string[];
  priority?: number;
}

interface SearchRequestBody {
  query?: string;
  city?: string;
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
  'wjw.suzhou.gov.cn',
  'www.szcdc.cn',
  'wjw.beijing.gov.cn',
  'wsjkw.sh.gov.cn',
  'wjw.gz.gov.cn',
  'wjw.sz.gov.cn',
  'wjw.nanjing.gov.cn',
  'wsjkw.hangzhou.gov.cn',
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

const OFFICIAL_SYNC_LABEL = '官方公开资料同步';
const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY') ?? Deno.env.get('VITE_TAVILY_API_KEY');

const SUPPORTED_CITY_ALIASES: Record<string, string[]> = {
  苏州: ['苏州', '苏州市'],
  北京: ['北京', '北京市'],
  上海: ['上海', '上海市'],
  广州: ['广州', '广州市'],
  深圳: ['深圳', '深圳市'],
  南京: ['南京', '南京市'],
  杭州: ['杭州', '杭州市'],
};

const SEEDED_OFFICIAL_SOURCES: OfficialSourceSeed[] = [
  {
    id: 'china-cdc-flu-weekly',
    title: '中国疾控中心：流感与急性呼吸道传染病专题',
    sourceLabel: '中国疾病预防控制中心',
    sourceType: '疾控专题',
    status: '官方资料',
    lastUpdated: '2025-01-12T09:00:00+08:00',
    summary:
      '适合对照发热、咳嗽、咽痛等呼吸道症状的季节性变化；若出现持续高热、气促或精神状态变差，应尽快线下就医。',
    url: 'https://www.chinacdc.cn/jkzt/crb/lxxgm/',
    linkLabel: '查看流感专题原文',
    topics: ['发热', '咳嗽', '咽痛', '流感', '呼吸道', '鼻塞'],
    departments: ['呼吸内科', '感染科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
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
    linkLabel: '进入发热门诊查询',
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
      '涵盖常见呼吸道、消化道传染病的预防知识，适合继续核对手卫生、口罩佩戴、居家隔离与就医时机。',
    url: 'https://www.chinacdc.cn/jkzt/crb/',
    linkLabel: '查看疾控健康知识',
    topics: ['呼吸道', '发热', '咳嗽', '传染病', '预防'],
    departments: ['呼吸内科', '儿科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
    priority: 4,
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
    priority: 4,
  },
  {
    id: 'stroke-fast',
    title: '国家卫健委：脑卒中 FAST 快速识别法',
    sourceLabel: '国家卫生健康委百万减残工程',
    sourceType: '急救指南',
    status: '急症识别',
    lastUpdated: '2024-10-16T09:00:00+08:00',
    summary: '若出现口角歪斜、单侧无力、言语不清等急性神经系统症状，应立即拨打 120，不建议等待观察。',
    url: 'https://www.chinacdc.cn/jkzt/mxfcrjbhsh/nzcfjkjy/',
    linkLabel: '查看卒中 FAST 识别',
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
    linkLabel: '查看胸痛急救要点',
    topics: ['胸痛', '胸闷', '心慌', '呼吸困难', '大汗'],
    departments: ['心内科', '急诊科'],
    levels: ['orange', 'red'],
    priority: 5,
  },
  {
    id: 'suzhou-health-service',
    title: '苏州市卫健委：本地就医服务与健康公告',
    sourceLabel: '苏州市卫生健康委员会',
    sourceType: '苏州就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合在苏州场景下继续核对发热门诊、门急诊安排、医疗服务公告与本地健康提醒，作为线下就医前的官方入口。',
    url: 'http://wjw.suzhou.gov.cn/',
    linkLabel: '进入苏州卫健委入口',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    cities: ['苏州'],
    priority: 4,
  },
  {
    id: 'suzhou-cdc-alerts',
    title: '苏州疾控：季节性传染病与健康提醒',
    sourceLabel: '苏州市疾病预防控制中心',
    sourceType: '苏州疾控提醒',
    status: '本地防护参考',
    lastUpdated: '2025-01-14T08:30:00+08:00',
    summary:
      '适合在苏州场景下继续核对流感、诺如等季节性疾病提醒与个人防护建议，帮助判断是否需要进一步线下咨询。',
    url: 'http://www.szcdc.cn/',
    linkLabel: '查看苏州疾控提醒',
    topics: ['流感', '呼吸道', '发热', '咳嗽', '腹泻', '呕吐', '预防'],
    departments: ['呼吸内科', '感染科', '消化内科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
    cities: ['苏州'],
    priority: 4,
  },
  {
    id: 'beijing-health-service',
    title: '北京市卫健委：医疗服务与健康信息发布',
    sourceLabel: '北京市卫生健康委员会',
    sourceType: '北京就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合在北京场景下继续核对发热门诊、医疗机构服务与市级健康公告，帮助更快找到本地官方入口。',
    url: 'https://wjw.beijing.gov.cn/',
    linkLabel: '进入北京卫健委入口',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    cities: ['北京'],
    priority: 3,
  },
  {
    id: 'shanghai-health-service',
    title: '上海市卫健委：医疗服务与健康公告',
    sourceLabel: '上海市卫生健康委员会',
    sourceType: '上海就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合在上海场景下继续核对门急诊服务、发热就诊提示与市级卫生公告，帮助尽快进入本地官方信息链路。',
    url: 'https://wsjkw.sh.gov.cn/',
    linkLabel: '进入上海卫健委入口',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    cities: ['上海'],
    priority: 3,
  },
  {
    id: 'guangzhou-health-service',
    title: '广州市卫健委：医疗服务与健康公告',
    sourceLabel: '广州市卫生健康委员会',
    sourceType: '广州就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合在广州场景下继续核对发热就诊提示、门急诊服务与市级健康公告，帮助更快进入本地官方入口。',
    url: 'http://wjw.gz.gov.cn/',
    linkLabel: '进入广州卫健委入口',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    cities: ['广州'],
    priority: 3,
  },
  {
    id: 'shenzhen-health-service',
    title: '深圳市卫健委：医疗服务与健康公告',
    sourceLabel: '深圳市卫生健康委员会',
    sourceType: '深圳就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合在深圳场景下继续核对发热门诊、医疗机构服务与最新健康公告，帮助尽快进入本地官方信息入口。',
    url: 'https://wjw.sz.gov.cn/',
    linkLabel: '进入深圳卫健委入口',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    cities: ['深圳'],
    priority: 3,
  },
  {
    id: 'nanjing-health-service',
    title: '南京市卫健委：医疗服务与健康公告',
    sourceLabel: '南京市卫生健康委员会',
    sourceType: '南京就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合在南京场景下继续核对门急诊服务、发热就诊提示与市级健康公告，帮助快速找到本地官方入口。',
    url: 'https://wjw.nanjing.gov.cn/',
    linkLabel: '进入南京卫健委入口',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    cities: ['南京'],
    priority: 3,
  },
  {
    id: 'hangzhou-health-service',
    title: '杭州市卫健委：医疗服务与健康公告',
    sourceLabel: '杭州市卫生健康委员会',
    sourceType: '杭州就医入口',
    status: '本地官方入口',
    lastUpdated: '2025-01-15T09:00:00+08:00',
    summary:
      '适合在杭州场景下继续核对发热门诊、门急诊安排与市级健康公告，帮助更顺畅地进入本地官方就医入口。',
    url: 'http://wsjkw.hangzhou.gov.cn/',
    linkLabel: '进入杭州卫健委入口',
    topics: ['发热门诊', '门诊', '急诊', '就医', '医疗服务', '发热'],
    departments: ['全科医学科', '急诊科', '呼吸内科'],
    levels: ['yellow', 'orange', 'red'],
    cities: ['杭州'],
    priority: 3,
  },
];

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
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

function createKeywordText(body: SearchRequestBody): string {
  return [
    body.city ?? '',
    body.query ?? '',
    body.reason ?? '',
    ...toStringArray(body.departments),
    ...toStringArray(body.focusSymptoms),
  ]
    .join(' ')
    .toLowerCase();
}

function scoreSeededSource(source: OfficialSourceSeed, body: SearchRequestBody): number {
  const keywordText = createKeywordText(body);
  let score = source.priority ?? 0;

  if (source.cities?.length) {
    score += body.city && source.cities.includes(body.city) ? 5 : -3;
  }

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
  const normalizedBody = {
    ...body,
    city:
      normalizeCityName(body.city) ??
      normalizeCityName(
        [body.query ?? '', body.reason ?? '', ...toStringArray(body.departments), ...toStringArray(body.focusSymptoms)].join(' ')
      ),
  };

  return uniqueById(
    [...SEEDED_OFFICIAL_SOURCES].sort(
      (a, b) => scoreSeededSource(b, normalizedBody) - scoreSeededSource(a, normalizedBody)
    )
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

    if (host.includes('wjw.suzhou.gov.cn')) {
      return { sourceLabel: '苏州市卫生健康委员会', sourceType: '地方卫健委', host };
    }

    if (host.includes('szcdc.cn')) {
      return { sourceLabel: '苏州市疾病预防控制中心', sourceType: '地方疾控', host };
    }

    if (host.includes('wjw.beijing.gov.cn')) {
      return { sourceLabel: '北京市卫生健康委员会', sourceType: '地方卫健委', host };
    }

    if (host.includes('wsjkw.sh.gov.cn')) {
      return { sourceLabel: '上海市卫生健康委员会', sourceType: '地方卫健委', host };
    }

    if (host.includes('wjw.gz.gov.cn')) {
      return { sourceLabel: '广州市卫生健康委员会', sourceType: '地方卫健委', host };
    }

    if (host.includes('wjw.sz.gov.cn')) {
      return { sourceLabel: '深圳市卫生健康委员会', sourceType: '地方卫健委', host };
    }

    if (host.includes('wjw.nanjing.gov.cn')) {
      return { sourceLabel: '南京市卫生健康委员会', sourceType: '地方卫健委', host };
    }

    if (host.includes('wsjkw.hangzhou.gov.cn')) {
      return { sourceLabel: '杭州市卫生健康委员会', sourceType: '地方卫健委', host };
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

  const city =
    normalizeCityName(body.city) ??
    normalizeCityName([body.reason ?? '', ...toStringArray(body.focusSymptoms), ...toStringArray(body.departments)].join(' '));

  return [city ?? '', ...focusTerms, body.reason ?? '', riskHint, city ? `${city} 本地就医` : '', '官方', '卫健委', '疾控']
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
    note: '当前先展示已核对的官方资料卡；如稍后获取到更多公开页面，会自动补充更新。',
    records,
    results: buildResultItems(records),
    syncStatus: createSyncStatus({
      mode: 'seeded-local',
      fallbackActive: true,
      configured: Boolean(TAVILY_API_KEY),
      lastSyncTime: fetchedAt,
      latestRecordTime: deriveLatestRecordTime(records),
      summary: reason,
      note: '当前以已核对的官方资料卡为主，便于持续提供稳定可信的对照链接。',
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
      note: 'POST /search 可按症状、风险等级或城市补充官方公开资料摘要；如暂未命中新结果，会自动保留已核对资料卡。',
      syncStatus: createSyncStatus({
        mode: TAVILY_API_KEY ? 'server-live' : 'seeded-local',
        fallbackActive: !TAVILY_API_KEY,
        configured: Boolean(TAVILY_API_KEY),
        summary: TAVILY_API_KEY ? '已就绪，可同步更多官方公开资料。' : '当前以已核对的官方资料卡为主，可继续稳定提供对照。',
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
          '当前暂时无法连接更多官方公开页面，先展示已核对的官方资料卡。'
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
          `官方公开资料检索暂时失败（HTTP ${upstream.status}），已回退到已核对的官方资料卡。`,
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
        ? '已连接官方检索通道，但本次未命中新增结果，继续保留已核对的官方资料卡。'
        : `已通过服务端同步 ${cloudRecords.length} 条官方公开摘要。`,
      note: fallbackActive
        ? '当前结果以已核对资料卡为主；后续如命中更多官方网页，会自动补充更新。'
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
          ? '已连接服务端通道，但本次未命中更多官方内容，先展示最近可用的资料卡。'
          : `已通过服务端从官方域名抓取 ${cloudRecords.length} 条公开摘要。`,
        note: fallbackActive
          ? '如果官方网页短期内没有可提炼的新摘要，会继续显示已核对的稳定卡片。'
          : '目前只返回公开网页摘要与链接，不会替代线下医生诊断。',
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return jsonResponse(
      createFallbackPayload(
        {},
        '官方资料同步过程中出现异常，已回退到已核对的官方资料卡。',
        message
      )
    );
  }
});
