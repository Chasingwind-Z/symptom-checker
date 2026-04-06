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
  scope?: 'local' | 'national' | 'international';
  city?: string;
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
  'wsjkw.suzhou.gov.cn',
  'www.szcdc.cn',
  'wjw.beijing.gov.cn',
  'jkbj.wjw.beijing.gov.cn',
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
    url: 'https://www.chinacdc.cn/jksj/jksj04_14275/',
    linkLabel: '查看呼吸道监测原文',
    topics: ['发热', '咳嗽', '咽痛', '流感', '呼吸道', '鼻塞'],
    departments: ['呼吸内科', '感染科', '全科医学科'],
    levels: ['green', 'yellow', 'orange'],
    scope: 'national',
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
    summary: '若出现口角歪斜、单侧无力、言语不清等急性神经系统症状，应立即拨打 120，不建议等待观察。',
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

function getOfficialSourceRecordPriority(
  record: OfficialSourceRecord,
  body: SearchRequestBody = {}
): number {
  const normalizedBody = {
    ...body,
    city:
      normalizeCityName(body.city) ??
      normalizeCityName(
        [body.query ?? '', body.reason ?? '', ...toStringArray(body.departments), ...toStringArray(body.focusSymptoms)].join(' ')
      ),
  };
  const enriched = enrichOfficialSourceRecord(record);
  let score = getUrlSpecificityScore(enriched.url);

  if (normalizedBody.city && enriched.city === normalizedBody.city) {
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
  body: SearchRequestBody = {}
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
      getOfficialSourceRecordPriority(record, body) >
      getOfficialSourceRecordPriority(existing, body)
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
  body: SearchRequestBody = {}
): OfficialSourceRecord[] {
  return [...uniqueOfficialSourceRecords(records, body)].sort((left, right) => {
    const scoreDiff =
      getOfficialSourceRecordPriority(right, body) -
      getOfficialSourceRecordPriority(left, body);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return right.lastUpdated.localeCompare(left.lastUpdated);
  });
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

function selectFallbackRecords(body: SearchRequestBody, maxItems: number): OfficialSourceRecord[] {
  const normalizedBody = {
    ...body,
    city:
      normalizeCityName(body.city) ??
      normalizeCityName(
        [body.query ?? '', body.reason ?? '', ...toStringArray(body.departments), ...toStringArray(body.focusSymptoms)].join(' ')
      ),
  };

  return sortOfficialSourceRecords(
    [...SEEDED_OFFICIAL_SOURCES].sort(
      (a, b) => {
        const scoreDiff = scoreSeededSource(b, normalizedBody) - scoreSeededSource(a, normalizedBody);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return (
          getOfficialSourceRecordPriority(b, normalizedBody) -
          getOfficialSourceRecordPriority(a, normalizedBody)
        );
      }
    ),
    normalizedBody
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

    if (host.includes('wsjkw.suzhou.gov.cn') || host.includes('wjw.suzhou.gov.cn')) {
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
    id: record.id,
    title: record.title,
    url: record.url ?? '',
    snippet: record.summary,
    host: getHostMeta(record.url ?? '').host,
    sourceLabel: record.sourceLabel,
    sourceType: record.sourceType,
    status: record.status,
    lastUpdated: record.lastUpdated,
    linkLabel: record.linkLabel,
    scope: record.scope,
    city: record.city,
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
    note: '当前先展示已核对的官方资料卡；卡片会优先直达原始发布页或服务页，后续如命中更多官方页面会自动补充。',
    records,
    results: buildResultItems(records),
    syncStatus: createSyncStatus({
      mode: 'seeded-local',
      fallbackActive: true,
      configured: Boolean(TAVILY_API_KEY),
      lastSyncTime: fetchedAt,
      latestRecordTime: deriveLatestRecordTime(records),
      summary: reason,
      note: '当前以已核对的官方资料卡为主，便于持续提供稳定可信且更直接的原始链接。',
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
              linkLabel: rawUrl ? '打开原始页面' : undefined,
            } satisfies OfficialSourceRecord;
          })
          .filter((item): item is OfficialSourceRecord => Boolean(item))
      : [];

    const records = sortOfficialSourceRecords([...cloudRecords, ...fallbackRecords], {
      ...body,
      query,
    }).slice(0, maxItems);
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
        ? '当前结果以已核对资料卡为主；卡片会优先直达原始发布页或服务页，后续如命中更多官方网页会自动补充更新。'
        : '仅摘录官方公开网页摘要，卡片会尽量直达原始页面；仍建议以原文和医生意见为准。',
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
          ? '如果官方网页短期内没有可提炼的新摘要，会继续显示已核对且更直接的稳定卡片。'
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
