import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  CloudSun,
  DatabaseZap,
  ExternalLink,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { HospitalCard } from './HospitalCard';
import { OfficialSourceComparison } from './OfficialSourceComparison';
import { RiskGauge } from './RiskGauge';
import { ReportExport } from './ReportExport';
import { useOfficialSourceComparison } from '../lib/officialSources';
import type { DiagnosisResult, Hospital, Message, RiskLevel, SymptomReport, ToolCall } from '../types';

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

const RISK_LABELS: Record<RiskLevel, string> = {
  green: '低风险',
  yellow: '中风险',
  orange: '较高风险',
  red: '紧急',
};

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
    source: '近期自查与趋势信号',
    tint: 'bg-amber-50 border-amber-100 text-amber-700',
    icon: <DatabaseZap size={14} />,
  },
  search_web: {
    title: '公开资料补充',
    source: 'Tavily / 官方资讯',
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function trimText(text: string, maxLength = 110): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
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
  onReport?: () => void;
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

export function ResultCard({ result, hospitals, messages, onReport, onToggleMap }: ResultCardProps) {
  const config = LEVEL_CONFIG[result.level];
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
      details: symptomDetails.slice(0, 4),
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
          title: typeof item.title === 'string' ? item.title : '来源摘录',
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
        ? webTool.summary ?? '联网来源暂不可用，当前判断仍以本地知识与实时信号为主。'
        : webTool && sourceItems.length === 0
        ? webTool.summary ?? '暂未检索到可展示的外部来源。'
        : undefined;

    return {
      evidenceCards: cards,
      webSources: sourceItems,
      webSearchNote: webNote,
      webQuery: typeof webPayload?.query === 'string' ? webPayload.query : '',
      officialSourceContext: {
        level: result.level,
        departments: result.departments,
        reason: `${result.reason} ${symptomNames.join(' ')}`.trim(),
        focusSymptoms: symptomNames,
        maxItems: 3,
      },
      evidenceUpdatedAt: latestMessageWithTools
        ? latestMessageWithTools.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : null,
    };
  }, [messages, result]);
  const { records: officialSources, syncStatus: officialSourceSyncStatus } =
    useOfficialSourceComparison(officialSourceContext);

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
      {/* Top color strip — 4px, exact level color */}
      <div style={{ height: '4px', backgroundColor: { green: '#10B981', yellow: '#F59E0B', orange: '#F97316', red: '#EF4444' }[result.level] }} />

      <div className="p-6">
        {/* Risk Gauge */}
        <div className="flex justify-center mt-6 mb-2 w-full max-w-xs mx-auto">
          <RiskGauge level={result.level} />
        </div>

        {/* Action checklist */}
        <div className={`rounded-xl px-4 py-3 mb-4 ${config.bg}`}>
          <p className={`text-xs font-semibold mb-2 ${config.text}`}>行动清单</p>
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
            <p className="text-emerald-500 text-xs font-medium mt-3 text-center">✓ 准备就绪，祝您早日康复</p>
          )}
        </div>

        {/* Level badge + title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`rounded-xl p-2 ${config.bg} ${config.text}`}>
            {config.icon}
          </div>
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}>
              {{ green: '低风险', yellow: '中风险', orange: '较高风险', red: '紧急' }[result.level]}
            </span>
            <h2 className={`text-xl font-bold mt-0.5 ${config.text}`}>{config.title}</h2>
          </div>
        </div>

        {/* Reason */}
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{result.reason}</p>

        {/* Evidence cards */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 mb-5">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-slate-800">判断依据与证据</p>
              <p className="text-[11px] text-slate-500 mt-1">
                结论结合症状规则、本地知识检索、风险信号与外部工具结果综合生成
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

          {(webSources.length > 0 || webSearchNote) && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">来源摘录</span>
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

        <div className="mb-5">
          <OfficialSourceComparison
            records={officialSources}
            syncStatus={officialSourceSyncStatus}
            subtitle={
              webSources.length > 0
                ? '用于和联网检索结果做权威对照，帮助快速判断哪些建议来自官方/公共卫生机构。'
                : '即使联网检索暂不可用，也会展示内置的官方/权威公开资料摘要，保证页面稳定可信。'
            }
          />
        </div>

        {/* Action */}
        <div className={`flex items-start gap-2 mb-5 rounded-xl px-4 py-3 ${config.bg}`}>
          <ArrowRight size={16} className={`mt-0.5 flex-shrink-0 ${config.text}`} />
          <span className="text-slate-700 font-medium text-sm">{result.action}</span>
        </div>

        {/* Departments */}
        {result.departments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
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

        {/* Hospitals */}
        {hospitals.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                <span className={`w-1 h-4 rounded-full ${config.bar} inline-block`} />
                附近推荐医院
              </h3>
              <span className="text-[11px] text-slate-400">支持导航 · 电话 · 地图查看</span>
            </div>
            <div className="flex flex-col gap-3">
              {hospitals.map((hospital) => (
                <HospitalCard key={hospital.id} hospital={hospital} />
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="flex justify-center mt-5">
          <ReportExport result={result} messages={messages} />
        </div>

        {/* Disclaimer */}
        <p className="text-slate-400 text-xs text-center mt-3 leading-relaxed">{result.disclaimer}</p>

        {/* Anonymous report prompt */}
        <div className="border-t border-slate-100 mt-5 pt-4">
          {reportState === 'pending' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-slate-500 text-xs text-center">是否愿意匿名上报本次症状？</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    saveReport(result);
                    setReportState('done');
                    onReport?.();
                  }}
                  className="px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                >
                  愿意上报
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
                  <p className="text-emerald-800 font-medium text-sm">感谢您的数据贡献</p>
                  <p className="text-emerald-600 text-xs mt-1 leading-relaxed">
                    您的症状数据已匿名上报。与其他用户数据汇聚后，将帮助监测社区疾病传播趋势，比医院诊断数据早 5-7 天发现疫情苗头。
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
    </motion.div>
  );
}
