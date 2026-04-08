import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Clock,
  CloudSun,
  DatabaseZap,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Pill,
  ShieldCheck,
  ShoppingCart,
  UserRoundSearch,
} from 'lucide-react';
import { HospitalCard } from './HospitalCard';
import { OfficialSourceComparison } from './OfficialSourceComparison';
import { ReportExport } from './ReportExport';
import { VisitSummaryCard } from './VisitSummaryCard';
import { AftercareTimeline } from './AftercareTimeline';
import { buildAftercarePlan } from '../lib/aftercarePlan';
import * as officialSourceHelpers from '../lib/officialSources';
import { AI_VISION_ENABLED } from '../lib/aiCapabilities';
import type { WeatherData } from '../lib/geolocation';
import {
  getMedicationGuidance,
  getPersonalizedInsights,
  hasMedicationProfileContext as hasMedicationProfileContextData,
} from '../lib/personalization';
import { buildWeatherExperienceSummary } from '../lib/weatherExperience';
import { buildJDSearchUrl, trackMedicationClick } from '../lib/jdAffiliate';
import type { OfficialSourcePreference } from '../lib/experienceSettings';
import type { MedicationAdvice } from '../lib/personalization';
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData';
import type {
  DiagnosisResult,
  Hospital,
  Message,
  OfficialSourceBundle,
  RiskLevel,
  SymptomReport,
  ToolCall,
} from '../types';

const DISTRICTS = [
  '朝阳区',
  '海淀区',
  '东城区',
  '西城区',
  '丰台区',
  '石景山区',
  '通州区',
  '顺义区',
  '昌平区',
  '大兴区',
  '房山区',
  '门头沟区',
] as const;

const ACTION_ITEMS: Record<RiskLevel, [string, string, string]> = {
  green: ['居家观察症状变化', '多休息、多补水', '若症状加重及时就医'],
  yellow: ['48小时内就诊', '记录症状变化', '备好就诊摘要'],
  orange: ['今日内前往就医', '避免独自出行', '携带既往病历或用药记录'],
  red: ['立即拨打120或前往急诊', '保持平静、勿进食饮水', '通知家人陪同并告知症状'],
};

const STORAGE_KEY = 'symptom_reports';
const FALLBACK_OFFICIAL_SOURCE_BUNDLE = {
  records: [],
  syncStatus: {
    state: 'idle',
    mode: 'seeded-local',
    freshness: 'seeded',
    sourceLabel: '官方公开资料',
    summary: '当前展示内置公开资料摘要。',
    note: '如云端同步暂不可用，会自动回退到本地整理的资料卡片。',
    lastSyncTime: '',
    latestRecordTime: '',
    fallbackActive: true,
    configured: false,
    fetchedAt: Date.now(),
  },
} satisfies OfficialSourceBundle;
const useOfficialSourceComparisonSafe =
  typeof officialSourceHelpers.useOfficialSourceComparison === 'function'
    ? officialSourceHelpers.useOfficialSourceComparison
    : () => FALLBACK_OFFICIAL_SOURCE_BUNDLE;

const RISK_LABELS: Record<RiskLevel, string> = {
  green: '低风险',
  yellow: '中风险',
  orange: '较高风险',
  red: '紧急',
};

const TABS = [
  { id: 'evidence', label: '证据', icon: <ShieldCheck size={14} /> },
  { id: 'medication', label: '用药', icon: <Pill size={14} /> },
  { id: 'hospitals', label: '医院', icon: <MapPin size={14} /> },
  { id: 'report', label: '报告', icon: <ClipboardList size={14} /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

const TOOL_EVIDENCE_META: Record<
  string,
  {
    title: string;
    source: string;
    tint: string;
    icon: React.ReactNode;
  }
> = {
  search_symptom_knowledge: {
    title: '医学知识参考',
    source: '结构化医学知识库',
    tint: 'bg-violet-50 border-violet-100 text-violet-700',
    icon: <ShieldCheck size={14} />,
  },
  get_weather: {
    title: '实时天气因素',
    source: '和风天气 API',
    tint: 'bg-sky-50 border-sky-100 text-sky-700',
    icon: <CloudSun size={14} />,
  },
  get_epidemic_snapshot: {
    title: '区域风险快照',
    source: '近期趋势参考',
    tint: 'bg-amber-50 border-amber-100 text-amber-700',
    icon: <DatabaseZap size={14} />,
  },
  search_web: {
    title: '公开资料补充',
    source: '公开网页与官方资讯',
    tint: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    icon: <Globe size={14} />,
  },
};

interface EvidenceCardItem {
  id: string;
  title: string;
  source: string;
  tint: string;
  icon: React.ReactNode;
  summary?: string;
  details: string[];
}

interface WebSourceItem {
  title: string;
  url: string;
  snippet: string;
  host: string;
}

interface MedicationSummarySection {
  key: 'matched' | 'caution';
  title: string;
  hint: string;
  containerClass: string;
  badgeClass: string;
  items: MedicationAdvice[];
  firstIndex: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function trimText(text: string, maxLength = 110): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

function buildMedicationSummarySections(advice: MedicationAdvice[]): MedicationSummarySection[] {
  const matchedItems = advice.filter((item) => item.suitable);
  const cautionItems = advice.filter((item) => !item.suitable);
  const matchedSummary = matchedItems.slice(0, cautionItems.length > 0 ? 1 : 2);
  const cautionSummary = cautionItems.slice(0, matchedItems.length > 0 ? 1 : 2);

  return [
    matchedSummary.length > 0
      ? {
          key: 'matched',
          title: '相对匹配',
          hint: '可先核对的支持方向',
          containerClass: 'border-emerald-100 bg-emerald-50/80',
          badgeClass: 'bg-emerald-100 text-emerald-700',
          items: matchedSummary,
          firstIndex: advice.findIndex((item) => item.id === matchedSummary[0]?.id),
        }
      : null,
    cautionSummary.length > 0
      ? {
          key: 'caution',
          title: '谨慎项',
          hint: '当前不适合作为优先选择',
          containerClass: 'border-amber-100 bg-amber-50/80',
          badgeClass: 'bg-amber-100 text-amber-700',
          items: cautionSummary,
          firstIndex: advice.findIndex((item) => item.id === cautionSummary[0]?.id),
        }
      : null,
  ]
    .filter((section): section is MedicationSummarySection => Boolean(section))
    .sort((left, right) => left.firstIndex - right.firstIndex);
}

function formatTimeLabel(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

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

function buildSourceLabel(toolCall: ToolCall | undefined, fallback: string): string {
  const payload = isRecord(toolCall?.result) ? toolCall.result : undefined;
  const source =
    typeof payload?.sourceLabel === 'string' && payload.sourceLabel.trim()
      ? payload.sourceLabel
      : fallback;
  const freshness = formatTimeLabel(payload?.lastUpdated ?? payload?.fetchedAt);
  return freshness ? `${source} · 更新于 ${freshness}` : source;
}

function getHostLabel(url: string): string {
  if (!url) return '来源链接';

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '来源链接';
  }
}

function saveReport(result: DiagnosisResult): void {
  const existing: SymptomReport[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  const report: SymptomReport = {
    id: Date.now().toString(),
    symptoms: result.departments,
    level: result.level,
    timestamp: Date.now(),
    district: DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)],
    summary: result.reason,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, report]));
}

interface ResultCardProps {
  result: DiagnosisResult;
  hospitals: Hospital[];
  messages: Message[];
  profile?: ProfileDraft;
  recentCases?: CaseHistoryItem[];
  weather?: WeatherData | null;
  officialSourceCity?: string | null;
  officialSourcePreference?: OfficialSourcePreference;
  hospitalSectionTitle?: string;
  hospitalSectionMeta?: string;
  consultationModeId?: string | null;
  onReport?: () => void;
  onOpenMedicationHub?: () => void;
  onToggleMap?: () => void;
}

const LEVEL_CONFIG: Record<
  RiskLevel,
  {
    bar: string;
    text: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ReactNode;
    title: string;
    pulse: boolean;
  }
> = {
  green: {
    bar: 'bg-emerald-400',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    icon: <CheckCircle size={24} />,
    title: '可居家观察',
    pulse: false,
  },
  yellow: {
    bar: 'bg-yellow-400',
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
    icon: <Clock size={24} />,
    title: '建议尽快就诊',
    pulse: false,
  },
  orange: {
    bar: 'bg-orange-400',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    icon: <AlertTriangle size={24} />,
    title: '建议今日就医',
    pulse: false,
  },
  red: {
    bar: 'bg-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    icon: <AlertOctagon size={24} />,
    title: '立即前往急诊',
    pulse: true,
  },
};

export function ResultCard({
  result,
  hospitals,
  messages,
  profile,
  recentCases = [],
  weather = null,
  officialSourceCity,
  officialSourcePreference = 'balanced',
  hospitalSectionTitle = '附近推荐医院',
  hospitalSectionMeta = '支持导航 · 电话 · 地图查看',
  consultationModeId,
  onReport,
  onOpenMedicationHub,
  onToggleMap,
}: ResultCardProps) {
  const config = LEVEL_CONFIG[result.level];
  const hospitalTabLabel: Record<RiskLevel, string> = {
    green: '就近社区诊所',
    yellow: '推荐门诊',
    orange: '三甲医院',
    red: '急诊通道',
  };
  const tieredHospitals = useMemo(
    () => filterHospitalsByRisk(hospitals, result.level),
    [hospitals, result.level],
  );
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showVisitCard, setShowVisitCard] = useState(false);
  const [reportState, setReportState] = useState<'pending' | 'done' | 'declined'>('pending');
  const [checked, setChecked] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const { evidenceCards, webSources, webSearchNote, webQuery, evidenceUpdatedAt, officialSourceContext } = useMemo(() => {
    const latestMessageWithTools = [...messages].reverse().find((message) =>
      (message.toolCalls ?? []).some((toolCall) => toolCall.status !== 'running')
    );
    const latestToolCalls = new Map<string, ToolCall>();

    messages.forEach((message) => {
      const completedToolCalls = (message.toolCalls ?? []).filter(
        (toolCall) => toolCall.status !== 'running'
      );

      if (completedToolCalls.length > 0) {
        completedToolCalls.forEach((toolCall) => {
          latestToolCalls.set(toolCall.name, toolCall);
        });
      }
    });

    const symptomTool = latestToolCalls.get('search_symptom_knowledge');
    const weatherTool = latestToolCalls.get('get_weather');
    const epidemicTool = latestToolCalls.get('get_epidemic_snapshot');
    const webTool = latestToolCalls.get('search_web');

    const cards: EvidenceCardItem[] = [];

    const symptomPayload = isRecord(symptomTool?.result) ? symptomTool.result : undefined;
    const symptomMatches = Array.isArray(symptomPayload?.matches)
      ? symptomPayload.matches.filter(isRecord)
      : [];
    const knowledgeDocuments = Array.isArray(symptomPayload?.documents)
      ? symptomPayload.documents.filter(isRecord)
      : [];
    const rankedChunks = Array.isArray(symptomPayload?.chunkMatches)
      ? symptomPayload.chunkMatches.filter(isRecord)
      : [];
    const symptomNames = symptomMatches
      .map((item) => (typeof item.name === 'string' ? item.name : ''))
      .filter(Boolean);
    const dangerSigns = Array.from(
      new Set(symptomMatches.flatMap((item) => toStringArray(item.danger_signs)))
    ).slice(0, 3);
    const selfCareTips = Array.from(
      new Set(symptomMatches.flatMap((item) => toStringArray(item.self_care)))
    ).slice(0, 2);
    const levels = Array.from(
      new Set(
        symptomMatches
          .map((item) =>
            typeof item.default_min_level === 'string' ? item.default_min_level : ''
          )
          .filter(Boolean)
      )
    );

    const symptomCardMeta = TOOL_EVIDENCE_META.search_symptom_knowledge;
    const focusPopulation =
      typeof symptomPayload?.focusPopulation === 'string' ? symptomPayload.focusPopulation : '';
    const retrievalLabel =
      typeof symptomPayload?.retrievalLabel === 'string' ? symptomPayload.retrievalLabel : '';
    const retrievalMode =
      typeof symptomPayload?.retrievalMode === 'string' ? symptomPayload.retrievalMode : '';
    const retrievalTerms = toStringArray(symptomPayload?.queryExpansions).slice(0, 5);
    const symptomDetails = [
      `当前为「${RISK_LABELS[result.level]}」分级，主要基于你的症状描述、持续情况与危险信号判断。`,
      trimText(result.reason, 96),
    ];

    if (symptomNames.length > 0) {
      symptomDetails.push(
        `知识库匹配：${symptomNames.slice(0, 3).join('、')}${
          levels.length > 0 ? `（参考警惕级别：${levels.join(' / ')}）` : ''
        }`
      );
    } else if (result.departments.length > 0) {
      symptomDetails.push(`建议优先咨询：${result.departments.join('、')}`);
    }

    if (dangerSigns.length > 0) {
      symptomDetails.push(`重点留意：${dangerSigns.join('、')}`);
    }

    if (focusPopulation) {
      symptomDetails.push(`已额外套用「${focusPopulation}」保守阈值提示。`);
    }

    if (retrievalLabel) {
      symptomDetails.push(`检索方式：${retrievalLabel}`);
    }

    if (
      retrievalMode === 'keyword' ||
      retrievalMode === 'hybrid-local' ||
      retrievalMode === 'hybrid-cloud'
    ) {
      symptomDetails.push('当前知识检索仍以关键词扩展 + chunk 混合召回为主，并非完整向量 RAG。');
    } else if (retrievalMode === 'hybrid-cloud-vector-ready') {
      symptomDetails.push(
        '即使已有向量字段，当前仍会优先保留人工可读的 chunk 证据，不会跳过可解释依据。'
      );
    }

    if (retrievalTerms.length > 0) {
      symptomDetails.push(`扩展召回词：${retrievalTerms.join('、')}`);
    }

    if (selfCareTips.length > 0 && (result.level === 'green' || result.level === 'yellow')) {
      symptomDetails.push(`居家先做：${selfCareTips.join('、')}`);
    }

    cards.push({
      id: 'symptom-basis',
      title: '症状与分级依据',
      source: buildSourceLabel(symptomTool, symptomCardMeta.source),
      tint: symptomCardMeta.tint,
      icon: symptomCardMeta.icon,
      summary:
        symptomTool?.summary ??
        (result.departments.length > 0 ? `建议科室：${result.departments.join('、')}` : '本次问诊即时生成'),
      details: symptomDetails.slice(0, 5),
    });

    const guidanceSnippets = (rankedChunks.length > 0 ? rankedChunks : knowledgeDocuments)
      .map((item) => {
        const title = typeof item.title === 'string' ? item.title : '本地指引';
        const heading =
          typeof item.heading === 'string' && item.heading.trim().length > 0
            ? ` · ${item.heading}`
            : '';
        const snippet =
          typeof item.snippet === 'string'
            ? item.snippet
            : typeof item.summary === 'string'
              ? item.summary
              : '';
        return snippet ? trimText(`${title}${heading}：${snippet}`, 92) : '';
      })
      .filter(Boolean)
      .slice(0, 3);

    if (guidanceSnippets.length > 0) {
      cards.push({
        id: 'rag-guidance',
        title: focusPopulation ? `${focusPopulation}重点提示` : '重点指导摘录',
        source: buildSourceLabel(symptomTool, symptomCardMeta.source),
        tint: symptomCardMeta.tint,
        icon: symptomCardMeta.icon,
        summary:
          retrievalLabel || '来自 chunk 级混合召回结果，便于解释“为什么这样建议”。',
        details: guidanceSnippets,
      });
    }

    const weatherPayload = isRecord(weatherTool?.result) ? weatherTool.result : undefined;
    if (weatherTool) {
      const weatherCardMeta = TOOL_EVIDENCE_META.get_weather;
      const details: string[] = [];
      const weatherHeadline = [weatherPayload?.temp, weatherPayload?.text]
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .join(' · ');

      if (weatherHeadline) {
        details.push(
          `${weatherHeadline}${
            typeof weatherPayload?.feelsLike === 'string'
              ? `，体感 ${weatherPayload.feelsLike}`
              : ''
          }`
        );
      }

      if (typeof weatherPayload?.suggestion === 'string') {
        details.push(weatherPayload.suggestion);
      } else if (typeof weatherTool.summary === 'string') {
        details.push(weatherTool.summary);
      }

      if (typeof weatherPayload?.humidity === 'string') {
        details.push(`空气湿度 ${weatherPayload.humidity}，外出就医时注意保暖与补水。`);
      }

      if (details.length > 0) {
        cards.push({
          id: 'weather-signal',
          title: '天气出行信号',
          source: buildSourceLabel(weatherTool, weatherCardMeta.source),
          tint: weatherCardMeta.tint,
          icon: weatherCardMeta.icon,
          summary: weatherTool.summary,
          details: details.slice(0, 3),
        });
      }
    }

    const epidemicPayload = isRecord(epidemicTool?.result) ? epidemicTool.result : undefined;
    const focusDistrict = isRecord(epidemicPayload?.focusDistrict)
      ? epidemicPayload.focusDistrict
      : undefined;

    if (epidemicTool) {
      const epidemicCardMeta = TOOL_EVIDENCE_META.get_epidemic_snapshot;
      const riskLabelMap: Record<string, string> = {
        low: '低',
        medium: '中',
        high: '较高',
        critical: '高',
      };
      const details: string[] = [];

      if (typeof focusDistrict?.district === 'string') {
        details.push(
          `${focusDistrict.district} 当前公共卫生风险：${
            typeof focusDistrict.riskLevel === 'string'
              ? `${riskLabelMap[focusDistrict.riskLevel] ?? focusDistrict.riskLevel}级`
              : '需持续关注'
          }${
            typeof focusDistrict.riskScore === 'number' ? `（指数 ${focusDistrict.riskScore}）` : ''
          }`
        );
      }

      const topSymptoms = toStringArray(focusDistrict?.topSymptoms);
      if (topSymptoms.length > 0) {
        details.push(`近期高频症状：${topSymptoms.slice(0, 3).join('、')}`);
      }

      const alertReasons = toStringArray(focusDistrict?.alertReasons);
      if (alertReasons.length > 0) {
        details.push(trimText(`预警提示：${alertReasons[0]}`, 88));
      }

      if (details.length > 0) {
        cards.push({
          id: 'epidemic-signal',
          title: '区域风险快照',
          source: buildSourceLabel(epidemicTool, epidemicCardMeta.source),
          tint: epidemicCardMeta.tint,
          icon: epidemicCardMeta.icon,
          summary: epidemicTool.summary,
          details: details.slice(0, 3),
        });
      }
    }

    const webPayload = isRecord(webTool?.result) ? webTool.result : undefined;
    const webResults = Array.isArray(webPayload?.results)
      ? webPayload.results.filter(isRecord)
      : [];
    const sourceItems: WebSourceItem[] = webResults
      .map((item) => {
        const url = typeof item.url === 'string' ? item.url : '';
        return {
          title: typeof item.title === 'string' ? item.title : '公开资料摘录',
          url,
          snippet:
            typeof item.snippet === 'string'
              ? trimText(item.snippet, 130)
              : typeof item.content === 'string'
              ? trimText(item.content, 130)
              : '',
          host: getHostLabel(url),
        };
      })
      .filter((item) => item.title || item.snippet || item.url);

      const webNote =
        webTool?.status === 'error'
          ? webTool.summary ?? '联网资料暂不可用，当前仍以本地知识与实时信号为主。'
          : webTool && sourceItems.length === 0
          ? webTool.summary ?? '暂未检索到可展示的公开来源。'
          : undefined;

    return {
      evidenceCards: cards,
      webSources: sourceItems,
      webSearchNote: webNote,
      webQuery: typeof webPayload?.query === 'string' ? webPayload.query : '',
      officialSourceContext: {
        city: officialSourceCity ?? profile?.city,
        level: result.level,
        departments: result.departments,
        reason: `${result.reason} ${symptomNames.join(' ')}`.trim(),
        focusSymptoms: symptomNames,
        maxItems:
          officialSourcePreference === 'official-first'
            ? 4
            : officialSourcePreference === 'brief'
              ? 2
              : 3,
      },
      evidenceUpdatedAt: latestMessageWithTools
        ? latestMessageWithTools.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : null,
    };
  }, [messages, officialSourceCity, officialSourcePreference, profile?.city, result]);
  const { records: officialSources } =
    useOfficialSourceComparisonSafe(officialSourceContext);
  const personalizedInsights = useMemo(
    () => getPersonalizedInsights({ profile, recentCases, diagnosis: result }),
    [profile, recentCases, result]
  );
  const medicationAdvice = useMemo(() => getMedicationGuidance(result, profile), [result, profile]);
  const aftercarePlan = useMemo(() => buildAftercarePlan(result, profile), [profile, result]);
  const medicationSummarySections = useMemo(
    () => buildMedicationSummarySections(medicationAdvice),
    [medicationAdvice]
  );
  const hasMedicationProfileContext = useMemo(
    () => hasMedicationProfileContextData(profile),
    [profile]
  );
  const hasMedicationSummary = medicationSummarySections.length > 0;
  const medicationPreviewTitles = useMemo(
    () => medicationAdvice.filter((item) => item.suitable).slice(0, 2).map((item) => item.title),
    [medicationAdvice]
  );
  const latestImageAttachmentCount = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.role === 'user' && (message.attachments?.length ?? 0) > 0)
        ?.attachments?.length ?? 0,
    [messages]
  );
  const medicationHubCtaTitle =
    result.level === 'green' || result.level === 'yellow'
      ? '想继续找 OTC / 附近药房？'
      : '如需补基础用品或复核现用药，可打开用药中心';
  const weatherSummary = useMemo(() => buildWeatherExperienceSummary(weather), [weather]);
  const primaryCTA = useMemo(() => {
    switch (result.level) {
      case 'green':
        return { label: '买药备着', icon: <ShoppingCart size={16} />, action: 'jd' as const };
      case 'yellow':
        return { label: '找附近诊所', icon: <MapPin size={16} />, action: 'hospital' as const };
      case 'orange':
        return { label: '今日门诊', icon: <MapPin size={16} />, action: 'hospital' as const };
      case 'red':
        return { label: '拨打120', icon: <Phone size={16} />, action: 'call120' as const };
    }
  }, [result.level]);

  const secondaryCTA = useMemo(() => {
    switch (result.level) {
      case 'green':
        return { label: '准备就诊', icon: <ClipboardList size={14} />, action: 'visit_card' as const };
      case 'yellow':
      case 'orange':
        return { label: '准备就诊', icon: <ClipboardList size={14} />, action: 'visit_card' as const };
      case 'red':
        return { label: '附近急诊', icon: <MapPin size={14} />, action: 'hospital' as const };
    }
  }, [result.level]);

  function handleCTAClick(action: string) {
    switch (action) {
      case 'jd': {
        const firstMed = medicationAdvice.find((item) => item.suitable);
        if (firstMed) {
          trackMedicationClick({
            medicationName: firstMed.title,
            diagnosisLevel: result.level,
            source: 'result_card_hero_cta',
          });
          window.open(buildJDSearchUrl(firstMed.title), '_blank', 'noopener');
        }
        break;
      }
      case 'hospital':
        setActiveTab('hospitals');
        break;
      case 'call120':
        window.open('tel:120');
        break;
      case 'visit_card':
        setShowVisitCard(true);
        break;
    }
  }

  const officialCityLabel = officialSourceCity?.trim() || profile?.city?.trim() || '';
  const hasOfficialSources = officialSources.length > 0;
  const showWebSourceHighlights =
    officialSourcePreference !== 'brief' && (webSources.length > 0 || Boolean(webSearchNote));
  const officialSourceSection = hasOfficialSources ? (
    <div className="mb-5">
      <OfficialSourceComparison
        records={officialSources}
        title={
          officialSourcePreference === 'official-first'
            ? '优先核对的权威来源'
            : officialSourcePreference === 'brief'
              ? '权威健康参考（精简）'
              : '权威健康参考'
        }
        subtitle={
          officialSourcePreference === 'official-first'
            ? officialCityLabel
              ? `已优先把 ${officialCityLabel} 本地官方入口与国家级公开资料排在前面，方便先核对正式建议。`
              : '已优先展示与当前分诊最相关的官方 / 公共来源，方便先核对正式建议。'
            : officialSourcePreference === 'brief'
              ? '仅保留最值得先看的权威公开资料，帮助快速完成最后核对。'
              : '以下资料来源于疾控中心、卫健委及 WHO 等公开渠道，供对照参考。'
        }
      />
    </div>
  ) : null;

  function toggleCheck(i: 0 | 1 | 2) {
    setChecked((prev) => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[i] = !next[i];
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-4 ${
        config.pulse ? 'animate-[pulse_2.5s_ease-in-out_infinite]' : ''
      }`}
    >
      {/* ── LAYER 1: Always Visible ── */}

      {/* Top gradient header */}
      <div className={`px-6 py-5 ${
        result.level === 'green' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100' :
        result.level === 'yellow' ? 'bg-gradient-to-r from-amber-50 to-amber-100' :
        result.level === 'orange' ? 'bg-gradient-to-r from-orange-50 to-orange-100' :
        'bg-gradient-to-r from-red-50 to-red-100'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{
            result.level === 'green' ? '✅' :
            result.level === 'yellow' ? '🟡' :
            result.level === 'orange' ? '🟠' : '🔴'
          }</span>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{
              result.level === 'green' ? '可居家观察' :
              result.level === 'yellow' ? '建议尽快就诊' :
              result.level === 'orange' ? '建议今日就医' : '请立即急诊'
            }</h2>
            <p className="text-sm text-slate-600 mt-0.5">{result.reason}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleCTAClick(primaryCTA.action)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm hover:shadow-md transition-shadow"
          >
            {primaryCTA.icon}
            {primaryCTA.label}
          </button>
          <button
            onClick={() => handleCTAClick(secondaryCTA.action)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/70 py-3 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
          >
            {secondaryCTA.icon}
            {secondaryCTA.label}
          </button>
        </div>
      </div>

      {/* Guardian mode banners */}
      {consultationModeId === 'child' && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2.5 flex items-center gap-2">
          <span className="text-sm">👶</span>
          <span className="text-xs font-semibold text-blue-700">儿童专属建议 · 14岁以下适用</span>
        </div>
      )}
      {consultationModeId === 'elderly' && (
        <div className="bg-orange-50 border-b border-orange-100 px-6 py-2.5 flex items-center gap-2">
          <span className="text-sm">🧓</span>
          <span className="text-xs font-semibold text-orange-700">老年人专属建议 · 60岁以上适用</span>
        </div>
      )}
      {consultationModeId === 'chronic' && (
        <div className="bg-purple-50 border-b border-purple-100 px-6 py-2.5 flex items-center gap-2">
          <span className="text-sm">💊</span>
          <span className="text-xs font-semibold text-purple-700">慢病患者专属建议</span>
        </div>
      )}

      <div className="p-6">
        {/* Action checklist — Layer 1 */}
        <div className={`rounded-xl px-4 py-3 mb-4 ${config.bg}`}>
          <p className={`text-xs font-semibold mb-2 ${config.text}`}>行动清单</p>
          {consultationModeId === 'child' && (
            <p className="text-xs text-blue-700 bg-blue-100/60 rounded-lg px-3 py-1.5 mb-2">
              👶 就医时携带儿童医保卡和疫苗接种本
            </p>
          )}
          {consultationModeId === 'elderly' && (
            <>
              <p className="text-xs text-orange-700 bg-orange-100/60 rounded-lg px-3 py-1.5 mb-2">
                🧓 建议家人陪同就医
              </p>
              {(result.level === 'yellow' || result.level === 'orange') && (
                <p className="text-xs text-orange-700 bg-orange-100/60 rounded-lg px-3 py-1.5 mb-2">
                  ⚠️ 老年人症状变化快，建议尽早就医而不是等待观察
                </p>
              )}
            </>
          )}
          {consultationModeId === 'chronic' && (
            <p className="text-xs text-purple-700 bg-purple-100/60 rounded-lg px-3 py-1.5 mb-2">
              💊 就医时携带当前用药清单
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {ACTION_ITEMS[result.level].map((item, i) => (
              <li key={item} className="flex items-center gap-2.5">
                <button
                  onClick={() => toggleCheck(i as 0 | 1 | 2)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    checked[i]
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-slate-300'
                  }`}
                  aria-label={checked[i] ? '取消' : '完成'}
                >
                  {checked[i] && (
                    <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm md:text-base transition-all duration-200 ${checked[i] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
          {checked.every(Boolean) && (
            <p className="text-sm text-emerald-600 font-medium mt-2 text-center">✓ 准备就绪，祝您早日康复 🌿</p>
          )}
          <button
            onClick={() => setShowVisitCard(true)}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white transition-colors border border-slate-200"
          >
            <ClipboardList size={14} />
            准备就诊（截图给医生）
          </button>
        </div>

        {/* ── LAYER 2: Tab Bar ── */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
              className={
                activeTab === tab.id
                  ? 'flex items-center gap-1.5 bg-white shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700'
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: 证据 (Evidence) ── */}
        {activeTab === 'evidence' && (
          <div className="space-y-5">
            {/* Weather health tip */}
            {weather && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">本地天气与出门提醒</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{weatherSummary.headline}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{weatherSummary.description}</p>
                  </div>
                  {onToggleMap && (
                    <button
                      type="button"
                      onClick={onToggleMap}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-white"
                    >
                      <MapPin size={13} />
                      查看附近资源
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {weatherSummary.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Personalized insights */}
            {personalizedInsights.length > 0 && (
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <UserRoundSearch size={15} className="text-cyan-700" />
                  <p className="text-sm font-semibold text-slate-800">个性化判断补充</p>
                </div>
                <div className="mt-3 space-y-2.5">
                  {personalizedInsights.map((insight) => {
                    const toneClass =
                      insight.tone === 'emerald'
                        ? 'border-emerald-100 bg-emerald-50'
                        : insight.tone === 'amber'
                        ? 'border-amber-100 bg-amber-50'
                        : insight.tone === 'violet'
                        ? 'border-violet-100 bg-violet-50'
                        : insight.tone === 'rose'
                        ? 'border-rose-100 bg-rose-50'
                        : 'border-cyan-100 bg-white';

                    return (
                      <div key={insight.id} className={`rounded-xl border px-3 py-3 ${toneClass}`}>
                        <p className="text-sm font-medium text-slate-800">{insight.title}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.summary}</p>
                        <ul className="mt-2 space-y-1.5">
                          {insight.details.map((detail) => (
                            <li key={detail} className="flex gap-2 text-[11px] text-slate-600 leading-relaxed">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Official source comparison */}
            {officialSourcePreference === 'official-first' && officialSourceSection}

            {/* Judgment basis panel */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-slate-800">为什么这样建议</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    结论结合分诊规则、相关资料、危险信号和公开来源综合整理
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {evidenceUpdatedAt ? `刚刚更新 · ${evidenceUpdatedAt}` : '本次问诊即时生成'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {evidenceCards.map((card) => (
                  <div key={card.id} className={`rounded-xl border px-3 py-3 ${card.tint}`}>
                    <div className="flex items-center gap-2">
                      {card.icon}
                      <span className="text-xs font-semibold">{card.title}</span>
                    </div>
                    {card.summary && (
                      <p className="text-xs leading-relaxed mt-2 text-slate-700">{card.summary}</p>
                    )}
                    <ul className="mt-2 space-y-1.5">
                      {card.details.map((detail) => (
                        <li key={detail} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] mt-2 text-slate-500">来源：{card.source}</p>
                  </div>
                ))}
              </div>

              {showWebSourceHighlights && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-800">外部公开资料摘录</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        若已触发联网检索，会在此展示外部来源摘要
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {buildSourceLabel(
                        messages
                          .flatMap((message) => message.toolCalls ?? [])
                          .filter((toolCall) => toolCall.name === 'search_web')
                          .slice(-1)[0],
                        TOOL_EVIDENCE_META.search_web.source
                      )}
                    </span>
                  </div>

                  {webQuery && (
                    <p className="text-[11px] text-slate-500 mt-2">检索关键词：{webQuery}</p>
                  )}

                  {webSearchNote && (
                    <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      {webSearchNote}
                    </div>
                  )}

                  {webSources.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2">
                      {webSources.map((source) => {
                        const content = (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-slate-700">
                                  {trimText(source.title, 58)}
                                </p>
                                {source.snippet && (
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    {source.snippet}
                                  </p>
                                )}
                              </div>
                              {source.url && (
                                <ExternalLink
                                  size={14}
                                  className="text-slate-400 flex-shrink-0 mt-0.5"
                                />
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                {source.host}
                              </span>
                              <span>仅作背景参考，不替代医生诊断</span>
                            </div>
                          </>
                        );

                        return source.url ? (
                          <a
                            key={`${source.host}-${source.title}`}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl border border-slate-200 px-3 py-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                          >
                            {content}
                          </a>
                        ) : (
                          <div
                            key={`${source.host}-${source.title}`}
                            className="rounded-xl border border-slate-200 px-3 py-2"
                          >
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {officialSourcePreference !== 'official-first' && officialSourceSection}
          </div>
        )}

        {/* ── Tab: 用药 (Medication) ── */}
        {activeTab === 'medication' && (
          <div className="space-y-5">
            {hasMedicationSummary ? (
              <>
                {/* Medication summary */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Pill size={15} className="text-violet-700 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">用药支持摘要</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          仅保留更值得优先核对的 1–2 个方向，帮助快速区分相对匹配项与谨慎项。
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">
                      仅作支持参考
                    </span>
                  </div>
                  {hasMedicationProfileContext && (
                    <div className="mt-2 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2 text-[11px] text-violet-700 leading-relaxed">
                      已结合年龄、慢病、过敏史和现用药做过筛选，以下仅保留更贴近当前档案的方向。
                    </div>
                  )}
                  <div className="mt-3 space-y-2.5">
                    {medicationSummarySections.map((section) => (
                      <div
                        key={section.key}
                        className={`rounded-xl border px-3 py-3 ${section.containerClass}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${section.badgeClass}`}
                          >
                            {section.title}
                          </span>
                          <p className="text-[11px] text-slate-500">{section.hint}</p>
                        </div>
                        <div className="mt-2 space-y-2">
                          {section.items.map((item, index) => (
                            <div
                              key={item.id}
                              className={index > 0 ? 'border-t border-white/70 pt-2' : undefined}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    {trimText(item.useCase, 46)}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                    提醒：{trimText(item.caution, 58)}
                                  </p>
                                </div>
                                {item.suitable && (
                                  <button
                                    type="button"
                                    className="flex shrink-0 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 transition-colors mt-0.5"
                                    onClick={() => {
                                      trackMedicationClick({
                                        medicationName: item.title,
                                        diagnosisLevel: result.level,
                                        source: 'result_card_summary',
                                      });
                                      window.open(buildJDSearchUrl(item.title), '_blank', 'noopener');
                                    }}
                                  >
                                    <ShoppingCart size={11} />
                                    京东购买
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                    仅作对症支持参考，不替代医生诊断或处方；若症状加重，请优先按上方行动清单处理。
                  </p>
                </div>

                {/* Quick medication actions */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">马上去做</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {result.level === 'red'
                          ? '当前应优先线下急诊 / 急救，不建议把注意力放在购药上。'
                          : '把买药、说明书核对和回问诊复核的入口放在一起，先完成最紧要的一步。'}
                      </p>
                    </div>
                    {medicationPreviewTitles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {medicationPreviewTitles.map((title) => (
                          <span
                            key={title}
                            className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {onOpenMedicationHub && result.level !== 'red' && (
                      <button
                        type="button"
                        onClick={onOpenMedicationHub}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                      >
                        <Pill size={14} />
                        打开买药 / 复核入口
                        <ArrowRight size={13} />
                      </button>
                    )}
                    {onToggleMap && (
                      <button
                        type="button"
                        onClick={onToggleMap}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <MapPin size={14} />
                        {result.level === 'red'
                          ? '查看急诊 / 医院入口'
                          : result.level === 'orange'
                            ? '去找今日就医入口'
                            : '去找附近门诊 / 药房'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Medication hub CTA */}
                {onOpenMedicationHub && (
                  <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/80 px-4 py-4">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Pill size={16} className="text-blue-600 shrink-0" />
                          <p className="text-sm font-semibold text-slate-800">{medicationHubCtaTitle}</p>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          打开用药建议中心后，可继续看附近药房、搜推荐方向、查说明书，或回对话继续核对药盒 / 报告。
                        </p>
                        {medicationPreviewTitles.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {medicationPreviewTitles.map((title) => (
                              <span
                                key={title}
                                className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700"
                              >
                                {title}
                              </span>
                            ))}
                          </div>
                        )}
                        {latestImageAttachmentCount > 0 && (
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                            {AI_VISION_ENABLED
                              ? `本次已上传并发送了 ${latestImageAttachmentCount} 张图片给视觉模型；如需继续核对药盒、现用药或检查单，可在入口里回到原对话继续传图。`
                              : `本次已上传 ${latestImageAttachmentCount} 张图片（以文字上下文辅助分析）；如需继续核对药盒、现用药或检查单，可在入口里回到原对话继续传图。`}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={onOpenMedicationHub}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        查看用药建议
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                      仅作对症支持参考，不替代医生诊断或处方；若症状加重，请优先按上方行动清单处理。
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
                <Pill size={20} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">暂无用药建议</p>
                <p className="text-[11px] text-slate-400 mt-1">补充个人档案或更多症状后，可能生成更多方向。</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: 医院 (Hospitals) ── */}
        {activeTab === 'hospitals' && (
          <div className="space-y-5">
            {result.departments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.departments.map((dept) => (
                  <span
                    key={dept}
                    className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-600 font-medium"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            )}

            {hospitals.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                    <span className={`w-1 h-4 rounded-full ${config.bar} inline-block`} />
                    {hospitalSectionTitle}
                  </h3>
                  <span className="text-[11px] text-slate-400">{hospitalSectionMeta}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {hospitals.map((hospital) => (
                    <HospitalCard key={hospital.id} hospital={hospital} allHospitals={hospitals} />
                  ))}
                </div>
              </div>
            )}

            {onToggleMap && (
              <button
                type="button"
                onClick={onToggleMap}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <MapPin size={15} />
                在地图上查看全部医院
              </button>
            )}

            {hospitals.length === 0 && !onToggleMap && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
                <MapPin size={20} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">暂无附近医院信息</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: 报告 (Report) ── */}
        {activeTab === 'report' && (
          <div className="space-y-5">
            <AftercareTimeline plan={aftercarePlan} />

            <div>
              <ReportExport
                result={result}
                messages={messages}
                medicationRecommendations={medicationAdvice}
              />
              <button
                onClick={() => {
                  const levelEmoji: Record<string, string> = { green: '🟢低风险', yellow: '🟡中风险', orange: '🟠较高风险', red: '🔴紧急' };
                  const summaryText = [
                    '【健康助手 · AI问诊报告】',
                    `风险等级: ${levelEmoji[result.level] ?? result.level}`,
                    `判断依据: ${result.reason}`,
                    `行动建议: ${result.action}`,
                    `推荐科室: ${result.departments.join('、')}`,
                    '⚠️ 本建议仅供参考，不构成医疗诊断',
                  ].join('\n');
                  const shareUrl = `${window.location.origin}?share=1&level=${result.level}&reason=${encodeURIComponent(result.reason.slice(0, 50))}`;
                  if (navigator.share) {
                    navigator.share({ title: '健康助手问诊结果', text: summaryText, url: shareUrl });
                  } else {
                    navigator.clipboard.writeText(summaryText).then(() => {
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);
                    });
                  }
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span>↗</span> {shareCopied ? '已复制到剪贴板' : '分享给家人看'}
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer — always visible */}
        <p className="text-slate-400 text-xs text-center mt-5 leading-relaxed">{result.disclaimer}</p>

        {/* Anonymous report prompt */}
        <div className="border-t border-slate-100 mt-5 pt-4">
          {reportState === 'pending' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-slate-500 text-xs text-center">是否愿意记录本次症状用于本地趋势分析？</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    saveReport(result);
                    setReportState('done');
                    onReport?.();
                  }}
                  className="px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                >
                  愿意记录
                </button>
                <button
                  onClick={() => setReportState('declined')}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  不了
                </button>
              </div>
            </div>
          )}
          {reportState === 'done' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-3">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-800 font-medium text-sm">已记录到本地</p>
                  <p className="text-emerald-600 text-xs mt-1 leading-relaxed">
                    症状数据已保存在您的设备上，用于个人健康趋势追踪和本地社区预警参考。数据不会离开您的设备。
                  </p>
                  {onToggleMap && (
                    <button
                      onClick={onToggleMap}
                      className="text-emerald-600 text-xs mt-2 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      查看社区疾病预警地图 →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showVisitCard && (
          <VisitSummaryCard
            result={result}
            profile={profile}
            messages={messages}
            onClose={() => setShowVisitCard(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
