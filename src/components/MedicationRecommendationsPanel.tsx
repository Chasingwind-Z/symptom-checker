import { useMemo } from 'react';
import { ArrowRight, Clock3, Pill, ShieldCheck, Sparkles } from 'lucide-react';
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData';
import { buildMedicationHubContexts } from '../lib/medicationHub';
import {
  applyPersonalizedOrdering,
  buildPersonalizationRankingContext,
  hasMedicationProfileContext,
} from '../lib/personalization';
import { getRiskPresentation } from '../lib/riskPresentation';
import type { ConversationSession, DiagnosisResult } from '../types';

type ActionTone = 'primary' | 'secondary';

interface MedicationRecommendationsPanelProps {
  profile?: Partial<ProfileDraft> | null;
  currentDiagnosis?: DiagnosisResult | null;
  activeSessionId?: string | null;
  conversationSessions: ConversationSession[];
  recentCases: CaseHistoryItem[];
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

export function MedicationRecommendationsPanel({
  profile,
  currentDiagnosis,
  activeSessionId,
  conversationSessions,
  recentCases,
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

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
            <Pill size={13} className="text-violet-600" />
            药品与家庭处理参考
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">用药建议中心</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            把更值得先核对的 OTC / 家庭处理方向集中在一处，先看可参考项，再看需要谨慎的地方。
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
            <ActionButton label="新建咨询" onClick={onStartNewConversation} />
          </div>
          <p className="text-[11px] text-slate-500">仅供 OTC / 家庭处理参考，不替代处方或线下评估。</p>
        </div>
      </div>

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

                      <div className="mt-3">
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
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

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
