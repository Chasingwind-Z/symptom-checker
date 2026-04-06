import type { RiskLevel, ToolCall } from '../types';
import type { ChatToolCall, ChatToolDefinition } from './aiClient';
import { getActiveCity, getCityOverview, getDistrictRiskData, mergeLocalReports } from './epidemicDataEngine';
import { fetchWeather } from './geolocation';
import { searchMedicalKnowledge } from './medicalKnowledge';
import { getRecommendedHospitals, hospitals as mockHospitals } from './mockHospitals';
import { searchNearbyHospitals } from './nearbyHospitals';
import { callGatewayJson, hasGatewayRoute } from './serverGateway';

interface ToolContext {
  location?: { lat: number; lon: number } | null;
  diagnosis?: {
    level: RiskLevel;
    departments: string[];
  } | null;
}

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY as string | undefined;
const OFFICIAL_SOURCE_DOMAINS = [
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
];

export const AGENT_TOOLS: ChatToolDefinition[] = [
  {
      type: 'function',
      function: {
        name: 'search_symptom_knowledge',
        description:
          '检索本地医学知识文档（当前以关键词扩展 + chunk 混合召回为主），返回危险信号、重点人群提示、建议科室和高相关证据片段。',
        parameters: {
          type: 'object',
          properties: {
          query: { type: 'string', description: '用户当前描述的症状或问题' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取用户当前城市附近的实时天气和就医出行建议。',
      parameters: {
        type: 'object',
        properties: {
          lat: { type: 'number', description: '纬度坐标，可选' },
          lon: { type: 'number', description: '经度坐标，可选' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_hospitals',
      description: '搜索附近医院或诊所，用于给出就医落地建议。',
      parameters: {
        type: 'object',
        properties: {
          level: {
            type: 'string',
            enum: ['green', 'yellow', 'orange', 'red'],
            description: '当前分诊等级',
          },
          query: {
            type: 'string',
            description: '医院名称、区域或需求关键词，例如“儿科”“附近三甲”',
          },
          lat: { type: 'number', description: '纬度坐标，可选' },
          lon: { type: 'number', description: '经度坐标，可选' },
          departments: {
            type: 'array',
            items: { type: 'string' },
            description: '推荐科室数组，可选',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_epidemic_snapshot',
      description: '获取当前城市或指定区的公共卫生风险快照，用于增强预警说明。',
      parameters: {
        type: 'object',
        properties: {
          district: { type: 'string', description: '想要查询的区域名称，如海淀区' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: '按需搜索近期官方或新闻资讯，用于补充实时背景信息。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '需要联网检索的问题或关键词' },
        },
        required: ['query'],
      },
    },
  },
];

export const agentTools = AGENT_TOOLS;

export function getAgentToolsByNames(names?: string[]): ChatToolDefinition[] {
  if (!names || names.length === 0) {
    return AGENT_TOOLS;
  }

  const allowed = new Set(names);
  return AGENT_TOOLS.filter((tool) => allowed.has(tool.function.name));
}

export function getToolDisplayName(name: string): string {
  switch (name) {
    case 'search_symptom_knowledge':
      return '检索医学知识';
    case 'get_weather':
      return '查询天气';
    case 'search_hospitals':
      return '搜索附近医院';
    case 'get_epidemic_snapshot':
      return '查看区域预警';
    case 'search_web':
      return '联网检索';
    default:
      return '调用工具';
  }
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeRiskLevel(value: unknown, fallback: RiskLevel = 'yellow'): RiskLevel {
  if (value === 'green' || value === 'yellow' || value === 'orange' || value === 'red') {
    return value;
  }
  return fallback;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function filterHospitals<T extends {
  name: string;
  type: string;
  address: string;
  departments: string[];
}>(
  hospitals: T[],
  query: string,
  departments: string[]
) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedDepartments = departments.map((item) => item.toLowerCase());

  return hospitals.filter((hospital) => {
    const matchesQuery =
      !normalizedQuery ||
      hospital.name.toLowerCase().includes(normalizedQuery) ||
      hospital.type.toLowerCase().includes(normalizedQuery) ||
      hospital.address.toLowerCase().includes(normalizedQuery) ||
      hospital.departments.some((dept) => dept.toLowerCase().includes(normalizedQuery));

    const matchesDepartments =
      normalizedDepartments.length === 0 ||
      hospital.departments.some((dept) =>
        normalizedDepartments.some((target) => dept.toLowerCase().includes(target))
      );

    return matchesQuery && matchesDepartments;
  });
}

function summarizeToolPayload(toolName: string, payload?: Record<string, unknown>): string {
  if (!payload) return '已返回可用结果';

  if (toolName === 'search_symptom_knowledge') {
    const matchCount = Array.isArray(payload.matches) ? payload.matches.length : 0;
    const documentCount = Array.isArray(payload.documents) ? payload.documents.length : 0;
    const focusPopulation =
      typeof payload.focusPopulation === 'string' ? ` · ${payload.focusPopulation}` : '';
    const retrievalLabel =
      typeof payload.retrievalLabel === 'string' && payload.retrievalLabel.trim()
        ? ` · ${payload.retrievalLabel}`
        : '';
    const storageLabel =
      typeof payload.storageMode === 'string'
        ? payload.storageMode.includes('supabase')
          ? ' · 云端知识库'
          : ' · 本地知识库'
        : '';

    if (documentCount > 0 || matchCount > 0) {
      return `已连接医学知识库 · 展示 ${documentCount || matchCount} 条相关资料${focusPopulation}${storageLabel}${retrievalLabel}`;
    }

    return '已返回基础分诊规则';
  }

  if (toolName === 'get_weather') {
    if (payload.temp && payload.text) {
      return `${String(payload.temp)} · ${String(payload.text)}`;
    }
    return typeof payload.message === 'string' ? payload.message : '天气服务暂不可用';
  }

  if (toolName === 'search_hospitals' && Array.isArray(payload.hospitals)) {
    const firstHospital = payload.hospitals[0] as Record<string, unknown> | undefined;
    return firstHospital?.name
      ? `已找到 ${String(firstHospital.name)} 等机构`
      : '已返回附近医院结果';
  }

  if (toolName === 'get_epidemic_snapshot' && payload.focusDistrict) {
    const district = payload.focusDistrict as Record<string, unknown>;
    return district.district
      ? `${String(district.district)} 风险 ${String(district.riskLevel ?? '')}`
      : '已返回区域风险快照';
  }

  if (toolName === 'search_web') {
    if (Array.isArray(payload.results)) {
      return `已检索 ${payload.results.length} 条近期资讯`;
    }
    return typeof payload.message === 'string' ? payload.message : '当前未启用联网搜索';
  }

  return '已返回可用结果';
}

function isToolPayloadError(payload?: Record<string, unknown>): boolean {
  return Boolean(payload && 'ok' in payload && payload.ok === false);
}

export function toToolCallState(
  toolCall: ChatToolCall,
  status: ToolCall['status'],
  payload?: Record<string, unknown>
): ToolCall {
  const resolvedStatus = status === 'done' && isToolPayloadError(payload) ? 'error' : status;

  return {
    id: toolCall.id,
    name: toolCall.function.name,
    displayName: getToolDisplayName(toolCall.function.name),
    status: resolvedStatus,
    arguments: parseArgs(toolCall.function.arguments),
    result: payload,
    summary:
      resolvedStatus === 'running'
        ? '处理中…'
        : resolvedStatus === 'error'
        ? typeof payload?.message === 'string'
          ? payload.message
          : '工具暂不可用，已自动降级'
        : summarizeToolPayload(toolCall.function.name, payload),
  };
}

export async function searchWebSources(query: string): Promise<{
  ok: boolean;
  sourceLabel: string;
  fetchedAt: string;
  query?: string;
  message?: string;
  officialDomains?: string[];
  results?: { title: string; url: string; snippet: string }[];
}> {
  const raw = await runWebSearch(query);
  return JSON.parse(raw) as {
    ok: boolean;
    sourceLabel: string;
    fetchedAt: string;
    query?: string;
    message?: string;
    officialDomains?: string[];
    results?: { title: string; url: string; snippet: string }[];
  };
}

async function runWebSearch(query: string): Promise<string> {
  if (hasGatewayRoute('official-source-fetch')) {
    try {
      const payload = await callGatewayJson<Record<string, unknown>>('official-source-fetch', {
        method: 'POST',
        path: 'search',
        body: { query },
      });

      return JSON.stringify(payload);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Official Source Gateway] 服务端检索失败，尝试浏览器降级。', error);
      }
    }
  }

  if (!TAVILY_API_KEY) {
    return JSON.stringify({
      ok: false,
      source: 'tavily',
      sourceLabel: '官方公开资料检索',
      fetchedAt: new Date().toISOString(),
      message: '数据来源：官方公开资料。',
      officialDomains: OFFICIAL_SOURCE_DOMAINS,
    });
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      topic: 'general',
      search_depth: 'advanced',
      max_results: 3,
      include_domains: OFFICIAL_SOURCE_DOMAINS,
    }),
  });

  if (!response.ok) {
    throw new Error(`联网搜索失败: ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data.results)
    ? data.results.slice(0, 3).map((item: Record<string, unknown>) => ({
        title: typeof item.title === 'string' ? item.title : '未命名结果',
        url: typeof item.url === 'string' ? item.url : '',
        snippet:
          typeof item.content === 'string'
            ? item.content.slice(0, 120)
            : typeof item.snippet === 'string'
              ? item.snippet.slice(0, 120)
              : '',
      }))
    : [];

  return JSON.stringify({
    ok: true,
    source: 'tavily',
    sourceLabel: 'Tavily 联网检索',
    fetchedAt: new Date().toISOString(),
    query,
    results,
  });
}

export async function executeAgentTool(
  toolName: string,
  rawArgs: string,
  context: ToolContext = {}
): Promise<Record<string, unknown>> {
  const args = parseArgs(rawArgs);

  switch (toolName) {
    case 'search_symptom_knowledge': {
      const query =
        typeof args.query === 'string' && args.query.trim()
          ? args.query.trim()
          : '发烧 咳嗽';
      const knowledge = searchMedicalKnowledge(query, { limit: 4 });
      const matches = knowledge.symptomMatches.slice(0, 3);

      return {
        ok: true,
        source:
          knowledge.storageMode === 'supabase-public' ? 'rag_lite_supabase' : 'rag_lite_seeded_local',
        sourceLabel: knowledge.sourceLabel,
        storageMode: knowledge.storageMode,
        retrievalMode: knowledge.retrievalMode,
        retrievalLabel: knowledge.retrievalLabel,
        supabaseTable: knowledge.supabaseTable,
        lastUpdated: knowledge.lastUpdated,
        fetchedAt: new Date().toISOString(),
        query,
        focusPopulation: knowledge.focusPopulation,
        queryExpansions: knowledge.queryExpansions,
        matches: matches.map((item) => ({
          name: item.name,
          default_min_level: item.default_min_level,
          danger_signs: item.danger_signs.slice(0, 3),
          departments: item.departments.slice(0, 3),
          self_care: item.self_care.slice(0, 3),
          when_to_worry: item.when_to_worry,
        })),
        documents: knowledge.documents.map((item) => ({
          id: item.document.id,
          title: item.document.title,
          category: item.document.category,
          audience: item.document.audience,
          triageLevel: item.document.triageLevel,
          summary: item.document.summary,
          snippet: item.snippet,
          score: Number(item.score.toFixed(2)),
          departments: item.document.departments.slice(0, 3),
          dangerSigns: item.document.dangerSigns.slice(0, 3),
          matchedTerms: item.matchedTerms,
          whyRelevant: item.reasons,
        })),
        chunkMatches: knowledge.chunkMatches.map((item) => ({
          id: item.chunk.id,
          title: item.document.title,
          heading: item.chunk.heading,
          snippet: item.snippet,
          score: Number(item.score.toFixed(2)),
          lexicalScore: Number(item.lexicalScore.toFixed(2)),
          semanticScore: Number(item.semanticScore.toFixed(2)),
          vectorScore: item.vectorScore,
          matchedTerms: item.matchedTerms,
          whyRelevant: item.reasons,
        })),
        evidence: knowledge.documents.map((item) => `${item.document.title}：${item.snippet}`),
      };
    }

    case 'get_weather': {
      const lat = typeof args.lat === 'number' ? args.lat : context.location?.lat;
      const lon = typeof args.lon === 'number' ? args.lon : context.location?.lon;

      if (typeof lat !== 'number' || typeof lon !== 'number') {
        return {
          ok: false,
          error: 'no_location',
          source: 'qweather',
          sourceLabel: '实时天气服务',
          fetchedAt: new Date().toISOString(),
          message: '暂时没有用户定位，无法查询实时天气。',
        };
      }

      const weather = await fetchWeather(lat, lon);
      return weather
        ? {
            ok: true,
            source: 'qweather',
            sourceLabel: '实时天气服务',
            fetchedAt: new Date().toISOString(),
            ...weather,
          }
        : {
            ok: false,
            error: 'weather_unavailable',
            source: 'qweather',
            sourceLabel: '实时天气服务',
            fetchedAt: new Date().toISOString(),
            message: '天气接口暂时不可用，请按室内外温差注意增减衣物。',
          };
    }

    case 'search_hospitals': {
      const level = normalizeRiskLevel(args.level, context.diagnosis?.level ?? 'yellow');
      const query = typeof args.query === 'string' ? args.query.trim() : '';
      const lat = typeof args.lat === 'number' ? args.lat : context.location?.lat;
      const lon = typeof args.lon === 'number' ? args.lon : context.location?.lon;
      const departments = toStringArray(args.departments).length
        ? toStringArray(args.departments)
        : context.diagnosis?.departments ?? [];

      try {
        if (typeof lat === 'number' && typeof lon === 'number') {
          const hospitals = await searchNearbyHospitals(lon, lat, level);
          const filtered = filterHospitals(hospitals, query, departments);
          return {
            ok: true,
            sourceLabel: '附近医疗机构检索',
            fetchedAt: new Date().toISOString(),
            level,
            hospitals: (filtered.length > 0 ? filtered : hospitals).slice(0, 3).map((hospital) => ({
              name: hospital.name,
              type: hospital.type,
              distance: hospital.distance,
              address: hospital.address,
              phone: hospital.phone,
              departments: hospital.departments,
              waitTime: hospital.waitTime,
            })),
          };
        }
      } catch {
        // Fall through to mock fallback below.
      }

      const fallbackHospitals = getRecommendedHospitals(level, departments);
      const filteredFallback = filterHospitals(
        fallbackHospitals.length > 0 ? fallbackHospitals : mockHospitals,
        query,
        departments
      );
      return {
        ok: true,
        sourceLabel: typeof lat === 'number' && typeof lon === 'number' ? '附近医疗机构检索' : '本地医院推荐库',
        fetchedAt: new Date().toISOString(),
        fallback: true,
        level,
        hospitals: (filteredFallback.length > 0 ? filteredFallback : fallbackHospitals)
          .slice(0, 3)
          .map((hospital) => ({
          name: hospital.name,
          type: hospital.type,
          distance: hospital.distance,
          address: hospital.address,
          phone: hospital.phone,
          departments: hospital.departments,
          waitTime: hospital.waitTime,
          })),
      };
    }

    case 'get_epidemic_snapshot': {
      const districts = mergeLocalReports(getDistrictRiskData());
      const overview = getCityOverview();
      const requestedDistrict =
        typeof args.district === 'string'
          ? districts.find((item) => item.district.includes(args.district as string))
          : undefined;
      const focusDistrict =
        requestedDistrict ?? [...districts].sort((a, b) => b.riskScore - a.riskScore)[0];

      return {
        ok: true,
        city: getActiveCity(),
        sourceLabel: '匿名问诊上报 + OTC 购药热度 + 天气/环境协同因子',
        fetchedAt: new Date().toISOString(),
        overview,
        focusDistrict: focusDistrict
          ? {
              district: focusDistrict.district,
              riskLevel: focusDistrict.riskLevel,
              riskScore: Math.round(focusDistrict.riskScore),
              topSymptoms: focusDistrict.topSymptoms,
              alertReasons: focusDistrict.alertReasons,
              sourceNote: focusDistrict.sourceNote,
              lastUpdated: focusDistrict.lastUpdated,
            }
          : null,
      };
    }

    case 'search_web': {
      const query =
        typeof args.query === 'string' && args.query.trim()
          ? args.query.trim()
          : '北京 流感 官方通报';
      const result = await runWebSearch(query);
      return parseArgs(result);
    }

    default:
      return {
        ok: false,
        error: 'unknown_tool',
        message: `未知工具：${toolName}`,
      };
  }
}
