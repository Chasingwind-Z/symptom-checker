import { useMemo, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  ImagePlus,
  MapPin,
  Pill,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData';
import { buildJDSearchUrl, trackMedicationClick } from '../lib/jdAffiliate';
import { buildMedicationHubContexts } from '../lib/medicationHub';
import { checkMedicationSafety } from '../lib/medicationSafety';
import {
  applyPersonalizedOrdering,
  buildPersonalizationRankingContext,
  hasMedicationProfileContext,
} from '../lib/personalization';
import type { LocationData } from '../lib/geolocation';
import { getRiskPresentation } from '../lib/riskPresentation';
import type { ConversationSession, DiagnosisResult } from '../types';

type ActionTone = 'primary' | 'secondary';

interface MedicationRecommendationsPanelProps {
  profile?: Partial<ProfileDraft> | null;
  currentDiagnosis?: DiagnosisResult | null;
  activeSessionId?: string | null;
  conversationSessions: ConversationSession[];
  recentCases: CaseHistoryItem[];
  currentLocation?: LocationData | null;
  onOpenConversation: (sessionId: string) => void;
  onStartNewConversation: () => void;
}

function formatDateTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '刚刚';

  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function trimText(text: string, maxLength = 88) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

function getActionClasses(tone: ActionTone) {
  return tone === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
}

function normalizeCity(value?: string | null) {
  return value?.trim() && value !== '中国大陆' ? value.trim() : '';
}

function buildAmapSearchUrl(
  keyword: string,
  options: {
    city?: string | null;
    location?: LocationData | null;
  } = {}
) {
  const normalizedCity = normalizeCity(options.city);
  const resolvedKeyword = options.location ? keyword : [normalizedCity, keyword].filter(Boolean).join(' ');
  const params = new URLSearchParams({
    keyword: resolvedKeyword || keyword,
    src: 'symptom-checker',
    coordinate: 'gaode',
    callnative: '1',
  });

  if (options.location) {
    params.set('center', `${options.location.lon},${options.location.lat}`);
  }

  return `https://uri.amap.com/search?${params.toString()}`;
}

function buildMedicationInfoSearchUrl(keyword: string) {
  return `https://cn.bing.com/search?q=${encodeURIComponent(
    `${keyword} 说明书 成分 禁忌 注意事项`
  )}`;
}

function ActionButton({
  label,
  onClick,
  tone = 'secondary',
  compact = false,
}: {
  label: string;
  onClick: () => void;
  tone?: ActionTone;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
        compact ? 'rounded-xl px-3 py-1.5 text-xs' : 'rounded-2xl px-4 py-2 text-sm'
      } ${getActionClasses(tone)}`}
    >
      {label}
      <ArrowRight size={compact ? 13 : 15} />
    </button>
  );
}

function AccessTile({
  title,
  description,
  icon,
  toneClass,
  badge,
  href,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  toneClass: string;
  badge?: string;
  href?: string;
  onClick?: () => void;
}) {
  const card = (
    <div
      className={`h-full rounded-2xl border px-4 py-4 transition-all duration-200 ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-2xl bg-white/90 p-2 shadow-sm">{icon}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              {badge && (
                <span className="rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>
          </div>
        </div>

        <span className="rounded-full bg-white/90 p-1.5 text-slate-400">
          <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="group block h-full text-left">
        {card}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="group block h-full w-full text-left">
      {card}
    </button>
  );
}

export function MedicationRecommendationsPanel({
  profile,
  currentDiagnosis,
  activeSessionId,
  conversationSessions,
  recentCases,
  currentLocation,
  onOpenConversation,
  onStartNewConversation,
}: MedicationRecommendationsPanelProps) {
  const contexts = useMemo(
    () =>
      buildMedicationHubContexts({
        profile,
        currentDiagnosis,
        activeSessionId,
        conversationSessions,
        recentCases,
      }),
    [activeSessionId, conversationSessions, currentDiagnosis, profile, recentCases]
  );
  const rankingContext = useMemo(
    () =>
      buildPersonalizationRankingContext({
        profile,
        recentCases,
        recentSessions: conversationSessions,
      }),
    [conversationSessions, profile, recentCases]
  );
  const personalizedContextOrder = useMemo(
    () =>
      applyPersonalizedOrdering(
        contexts,
        (context) => [
          context.title,
          context.summary,
          context.sourceLabel,
          context.diagnosis.reason,
          context.diagnosis.action,
          context.diagnosis.departments.join(' '),
        ],
        rankingContext
      ),
    [contexts, rankingContext]
  );
  const orderedContexts = personalizedContextOrder.items;
  const profileApplied = hasMedicationProfileContext(profile);
  const recommendationRankingHintVisible = personalizedContextOrder.changed;
  const featuredContext =
    orderedContexts.find((context) => context.recommendations.length > 0) ?? orderedContexts[0] ?? null;
  const threadActionContext =
    (featuredContext?.conversationId ? featuredContext : null) ??
    orderedContexts.find((context) => Boolean(context.conversationId)) ??
    null;
  const cautionCount = orderedContexts.reduce(
    (count, context) =>
      count + context.recommendations.filter((recommendation) => !recommendation.suitable).length,
    0
  );
  const contextWithGuidanceCount = orderedContexts.filter(
    (context) => context.recommendations.length > 0
  ).length;
  const contextShelf = useMemo(() => {
    if (!featuredContext) return orderedContexts.slice(0, 3);

    const additionalContexts = orderedContexts
      .filter((context) => context.id !== featuredContext.id)
      .slice(0, 2);
    return additionalContexts.length > 0 ? additionalContexts : orderedContexts.slice(0, 1);
  }, [featuredContext, orderedContexts]);
  const safetyHighlights = useMemo(() => {
    const notes: string[] = [];

    orderedContexts.forEach((context) => {
      const prioritizedRecommendations = [
        ...context.recommendations.filter((recommendation) => !recommendation.suitable),
        ...context.recommendations.filter((recommendation) => recommendation.suitable),
      ];

      prioritizedRecommendations.forEach((recommendation) => {
        const note = trimText(recommendation.caution);
        if (!notes.includes(note)) {
          notes.push(note);
        }
      });
    });

    return notes.slice(0, 3);
  }, [orderedContexts]);

  // Drug interaction safety check
  const drugInteractionWarnings = useMemo(() => {
    const userMeds = (profile as ProfileDraft | undefined)?.currentMedications;
    if (!userMeds) return [];
    const userMedList = userMeds.split(/[,，、\s]+/).filter(Boolean);
    if (userMedList.length === 0) return [];
    const recommendedDrugs = orderedContexts.flatMap((ctx) =>
      ctx.recommendations.map((r) => r.title)
    );
    if (recommendedDrugs.length === 0) return [];
    return checkMedicationSafety(userMedList, recommendedDrugs);
  }, [orderedContexts, profile]);

  const normalizedCity = normalizeCity(profile?.city);
  const preferredRecommendation =
    featuredContext?.recommendations.find((recommendation) => recommendation.suitable) ??
    featuredContext?.recommendations[0] ??
    null;
  const recommendedMedicationNames = useMemo(
    () =>
      featuredContext?.recommendations
        .filter((recommendation) => recommendation.suitable)
        .slice(0, 3)
        .map((recommendation) => recommendation.title) ?? [],
    [featuredContext]
  );
  const primaryDepartment =
    featuredContext?.diagnosis.departments[0] ?? currentDiagnosis?.departments[0] ?? null;
  const riskIsHigh =
    featuredContext?.riskLevel === 'orange' || featuredContext?.riskLevel === 'red';
  const currentDiagnosisRiskLabel = currentDiagnosis
    ? {
        green: '低风险',
        yellow: '中风险',
        orange: '较高风险',
        red: '紧急',
      }[currentDiagnosis.level]
    : null;
  const panelDescription = currentDiagnosis
    ? `这次问诊已筛出更值得先核对的 OTC / 家庭处理方向，并保留找药房、查说明书和回原线程继续复核的入口。`
    : '把更值得先核对的 OTC / 家庭处理方向集中在一处，先看可参考项，再看需要谨慎的地方。';
  const locationHint = currentLocation ? '按当前位置' : normalizedCity ? `按${normalizedCity}` : '通用入口';
  const nearbyPharmacyUrl = useMemo(
    () =>
      buildAmapSearchUrl(riskIsHigh ? '24小时药房' : '附近药房', {
        city: normalizedCity,
        location: currentLocation,
      }),
    [currentLocation, normalizedCity, riskIsHigh]
  );
  const medicationSearchSeed = preferredRecommendation?.title ?? '常见 OTC';
  const medicationAvailabilityUrl = useMemo(
    () =>
      buildAmapSearchUrl(`${medicationSearchSeed} 药房`, {
        city: normalizedCity,
        location: currentLocation,
      }),
    [currentLocation, medicationSearchSeed, normalizedCity]
  );
  const medicationInfoSearchKeyword = useMemo(() => {
    if (preferredRecommendation?.title) return preferredRecommendation.title;
    const firstSuitableMed = featuredContext?.recommendations.find((r) => r.suitable);
    if (firstSuitableMed) return firstSuitableMed.title;
    const firstMed = featuredContext?.recommendations[0];
    if (firstMed) return firstMed.title;
    return primaryDepartment ? `${primaryDepartment} 常见用药` : '常见 OTC 药品';
  }, [featuredContext?.recommendations, preferredRecommendation?.title, primaryDepartment]);
  const medicationInfoUrl = useMemo(
    () => buildMedicationInfoSearchUrl(medicationInfoSearchKeyword),
    [medicationInfoSearchKeyword]
  );
  const clinicUrl = useMemo(
    () =>
      buildAmapSearchUrl(`${primaryDepartment ?? '全科'} 门诊`, {
        city: normalizedCity,
        location: currentLocation,
      }),
    [currentLocation, normalizedCity, primaryDepartment]
  );
  const serviceEntrances = useMemo(
    () => [
      {
        id: 'nearby-pharmacy',
        title: riskIsHigh ? '附近药房 / 基础用品' : '附近药房',
        description: riskIsHigh
          ? '如需补体温计、口罩或基础耗材，可先看线下药房；高风险症状仍应优先线下就医。'
          : '先看附近药房与营业点，方便线下核对常见 OTC 是否可得。',
        icon: <MapPin size={16} className="text-emerald-600" />,
        href: nearbyPharmacyUrl,
        toneClass: 'border-emerald-100 bg-emerald-50/60 hover:border-emerald-200 hover:bg-emerald-50',
        badge: locationHint,
      },
      riskIsHigh
        ? {
            id: 'clinic-entry',
            title: primaryDepartment ? `${primaryDepartment} 门诊入口` : '附近门诊 / 医院',
            description: primaryDepartment
              ? `先看更贴近当前分诊的 ${primaryDepartment} 线下入口，不建议只靠购药处理。`
              : '当前分级偏高，先保留线下医院 / 门诊入口，避免被购药动作分散注意力。',
            icon: <Stethoscope size={16} className="text-violet-600" />,
            href: clinicUrl,
            toneClass:
              'border-violet-100 bg-violet-50/60 hover:border-violet-200 hover:bg-violet-50',
            badge: '优先线下评估',
          }
        : {
            id: 'medication-search',
            title: `搜 ${trimText(medicationSearchSeed, 18)}`,
            description: preferredRecommendation
              ? `把“${preferredRecommendation.title}”直接带到地图搜索，少走一次找药路径。`
              : '按当前更匹配的 OTC / 家庭处理方向直接搜药房入口。',
            icon: <Search size={16} className="text-sky-600" />,
            href: medicationAvailabilityUrl,
            toneClass: 'border-sky-100 bg-sky-50/60 hover:border-sky-200 hover:bg-sky-50',
            badge: preferredRecommendation?.suitable ? '优先参考方向' : '先核对',
          },
      {
        id: 'medication-info',
        title: '查说明书 / 成分',
        description: preferredRecommendation
          ? `先核对 ${preferredRecommendation.title} 的通用名、剂量和禁忌，再决定是否购买。`
          : '先核对通用名、成分和禁忌，再决定是否购买。',
        icon: <ShieldCheck size={16} className="text-amber-600" />,
        href: medicationInfoUrl,
        toneClass: 'border-amber-100 bg-amber-50/70 hover:border-amber-200 hover:bg-amber-50',
        badge: '先看信息',
      },
      {
        id: 'image-review',
        title: threadActionContext?.conversationId ? '回对话继续传药盒 / 报告' : '新建图像核对',
        description:
          '如果已买到药、手边有药盒 / 说明书或检查单，可继续传图做可见文字与异常说明。',
        icon: <ImagePlus size={16} className="text-cyan-600" />,
        onClick: threadActionContext?.conversationId
          ? () => onOpenConversation(threadActionContext.conversationId!)
          : onStartNewConversation,
        toneClass: 'border-cyan-100 bg-cyan-50/60 hover:border-cyan-200 hover:bg-cyan-50',
        badge: '图像复核',
      },
    ],
    [
      clinicUrl,
      locationHint,
      medicationAvailabilityUrl,
      medicationInfoUrl,
      medicationSearchSeed,
      nearbyPharmacyUrl,
      onOpenConversation,
      onStartNewConversation,
      preferredRecommendation,
      primaryDepartment,
      riskIsHigh,
      threadActionContext,
    ]
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
            <Pill size={13} className="text-violet-600" />
            服务入口与用药参考
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">买药、复核与门诊入口</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {panelDescription}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap gap-2">
            {threadActionContext?.conversationId && (
              <ActionButton
                label={threadActionContext.sourceType === 'current' ? '打开当前线程' : '打开原问诊'}
                onClick={() => onOpenConversation(threadActionContext.conversationId!)}
                tone="primary"
              />
            )}
            <ActionButton label="新建问诊" onClick={onStartNewConversation} />
          </div>
          <p className="text-[11px] text-slate-500">仅供 OTC / 家庭处理参考，不替代处方或线下评估。</p>
        </div>
      </div>

      {currentDiagnosis && (
        <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill size={16} className="text-violet-700" />
                  <p className="text-sm font-semibold text-slate-800">这次最先该开的入口</p>
                {currentDiagnosisRiskLabel && (
                  <span className="rounded-full border border-violet-100 bg-white px-2 py-0.5 text-[10px] text-violet-700">
                    {currentDiagnosisRiskLabel}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {preferredRecommendation
                  ? `优先核对：${preferredRecommendation.title}。建议先看成分、禁忌和是否与现用药重复，再决定是否购买。`
                  : riskIsHigh
                    ? '当前分级偏高，更适合把这里当作信息复核与基础用品入口，不建议只靠 OTC 自行处理。'
                    : '当前还没有明显更优的 OTC 方向，可先补充信息或回原线程继续复核。'}
              </p>
            </div>
              <div className="flex flex-wrap gap-2">
                {preferredRecommendation && (
                  <span className="rounded-full border border-violet-100 bg-white px-2 py-0.5 text-[10px] text-violet-700">
                    当前优先：{trimText(preferredRecommendation.title, 18)}
                  </span>
                )}
                {recommendedMedicationNames.slice(1).map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600"
                  >
                    可参考：{trimText(name, 18)}
                  </span>
                ))}
                <span className="rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-[10px] text-slate-500">
                  {locationHint}
                </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles size={12} />
            可参考场景
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{contextWithGuidanceCount} 个</p>
          <p className="mt-1 text-[11px] text-slate-500">来自当前问诊、最近线程和已保存摘要。</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck size={12} />
            谨慎提醒
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{cautionCount} 条</p>
          <p className="mt-1 text-[11px] text-slate-500">优先暴露需要先核对成分或尽快线下评估的点。</p>
        </div>
      </div>

      {recommendationRankingHintVisible && (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] text-violet-700">
          <Sparkles size={12} />
          已结合档案与最近记录排序
        </div>
      )}

      {featuredContext ? (
        <>
          <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin size={16} className="text-cyan-600" />
                  <p className="text-sm font-semibold text-slate-800">服务入口</p>
                  <span className="rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {locationHint}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {riskIsHigh
                    ? '当前分级偏高，以下入口更适合做线下准备和信息核对，不要因为能买到药而延迟就医。'
                    : '把找药房、搜推荐方向、查说明书和回对话传药盒 / 报告的入口收在一起，少来回找。'}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {serviceEntrances.map((entry) => (
                <AccessTile
                  key={entry.id}
                  title={entry.title}
                  description={entry.description}
                  icon={entry.icon}
                  href={entry.href}
                  onClick={entry.onClick}
                  toneClass={entry.toneClass}
                  badge={entry.badge}
                />
              ))}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              {preferredRecommendation
                ? `当前优先方向：${preferredRecommendation.title}。建议先核对通用名、剂量和禁忌，再决定是否购买。`
                : '如果暂时没有明确 OTC 优势方向，建议先看线下门诊或回到原问诊补充信息。'}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill size={16} className="text-violet-700" />
                  <p className="text-sm font-semibold text-slate-800">当前优先参考</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      getRiskPresentation(featuredContext.riskLevel).tone
                    }`}
                  >
                    {getRiskPresentation(featuredContext.riskLevel).label}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">
                    {featuredContext.sourceLabel}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900">{featuredContext.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{featuredContext.summary}</p>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                <Clock3 size={11} />
                {formatDateTimeLabel(featuredContext.updatedAt)}
              </span>
            </div>

            <div
              className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] ${
                profileApplied
                  ? 'border-violet-100 bg-violet-50 text-violet-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {profileApplied
                ? '已结合年龄、慢病、过敏史和现用药筛过一轮'
                : '补充过敏史、慢病和现用药后，筛选会更保守'}
            </div>

            <div className="mt-4 space-y-3">
              {featuredContext.recommendations.slice(0, 3).map((recommendation) => (
                <article
                  key={`${featuredContext.id}-${recommendation.id}`}
                  className={`rounded-2xl border px-4 py-4 ${
                    recommendation.suitable
                      ? 'border-slate-200 bg-white'
                      : 'border-amber-100 bg-amber-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{recommendation.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            recommendation.suitable
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {recommendation.suitable ? '可短期参考' : '先核对'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {recommendation.useCase}
                      </p>
                    </div>
                    {recommendation.suitable && (
                      <button
                        type="button"
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                        onClick={() => {
                          trackMedicationClick({
                            medicationName: recommendation.title,
                            diagnosisLevel: featuredContext.riskLevel,
                            source: 'featured_recommendation',
                          });
                          window.open(buildJDSearchUrl(recommendation.title), '_blank', 'noopener');
                        }}
                      >
                        <ShoppingCart size={13} />
                        去京东购买
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-medium text-slate-700">为何提到它</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        {recommendation.reason}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">
                      <p className="text-[11px] font-medium text-amber-800">使用前提醒</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                        {recommendation.caution}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-600" />
                <p className="text-sm font-semibold text-slate-800">最近相关线程</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                最近有判断结果的症状线程会在这里暴露一条最相关的用药方向，并保留回看入口。
              </p>

              <div className="mt-3 space-y-3">
                {contextShelf.map((context) => {
                  const primaryRecommendation = context.recommendations[0] ?? null;
                  const riskMeta = getRiskPresentation(context.riskLevel);

                  return (
                    <article
                      key={context.id}
                      className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{context.title}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${riskMeta.tone}`}
                        >
                          {riskMeta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {context.sourceLabel} · {formatDateTimeLabel(context.updatedAt)}
                      </p>

                      {primaryRecommendation ? (
                        <>
                          <p className="mt-2 text-xs font-medium text-slate-700">
                            {primaryRecommendation.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            {primaryRecommendation.suitable ? '短期参考：' : '先核对：'}
                            {trimText(primaryRecommendation.caution, 76)}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">{context.summary}</p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <ActionButton
                          compact
                          label={
                            context.conversationId
                              ? context.sourceType === 'current'
                                ? '打开当前线程'
                                : '打开原问诊'
                              : '新建咨询'
                          }
                          onClick={
                            context.conversationId
                              ? () => onOpenConversation(context.conversationId!)
                              : onStartNewConversation
                          }
                          tone={context.conversationId ? 'secondary' : 'primary'}
                        />
                        {primaryRecommendation?.suitable && (
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                            onClick={() => {
                              trackMedicationClick({
                                medicationName: primaryRecommendation.title,
                                diagnosisLevel: context.riskLevel,
                                source: 'context_shelf',
                              });
                              window.open(buildJDSearchUrl(primaryRecommendation.title), '_blank', 'noopener');
                            }}
                          >
                            <ShoppingCart size={11} />
                            京东购买
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {drugInteractionWarnings.length > 0 && (
              <div className="rounded-2xl border-l-4 border-red-500 bg-red-50 px-4 py-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <p className="text-sm font-semibold text-red-800">⚠️ 用药安全提示</p>
                </div>
                <p className="text-xs text-red-700 mb-2">检测到与您现用药物的潜在相互作用，购药前请告知药师您正在服用的药物清单</p>
                <ul className="space-y-1.5">
                  {drugInteractionWarnings.map((w) => (
                    <li key={`${w.triggeredBy.current}-${w.triggeredBy.recommended}`} className={`flex gap-2 text-xs leading-relaxed ${w.interaction.severity === 'high' ? 'text-red-700' : 'text-orange-700'}`}>
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full ${w.interaction.severity === 'high' ? 'bg-red-500' : 'bg-orange-400'}`} />
                      <span><strong>{w.triggeredBy.current}</strong> + <strong>{w.triggeredBy.recommended}</strong>：{w.interaction.warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-700" />
                <p className="text-sm font-semibold text-slate-800">保守使用边界</p>
              </div>
              <ul className="mt-3 space-y-2">
                {(safetyHighlights.length > 0
                  ? safetyHighlights
                  : ['症状持续不缓解、明显加重或出现新的红旗信号时，应及时线下就医。']
                ).map((note) => (
                  <li key={note} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>{note}</span>
                  </li>
                ))}
                <li className="flex gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>这里只做 OTC / 家庭处理参考，不替代医生诊断、处方或线下评估。</span>
                </li>
                {!profileApplied && (
                  <li className="flex gap-2 text-xs leading-relaxed text-slate-600">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>补齐年龄、过敏史、慢病和现用药后，这里的筛选会更保守。</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
          <p className="text-sm font-semibold text-slate-800">当前暂无可前置的用药参考</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            完成一次问诊后，这里会显示 OTC / 家庭处理方向与使用前提醒。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton label="新建咨询" onClick={onStartNewConversation} tone="primary" />
          </div>
        </div>
      )}
    </section>
  );
}
