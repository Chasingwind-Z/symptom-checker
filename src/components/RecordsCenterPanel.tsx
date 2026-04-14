import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderOpen,
  MessageSquareText,
  Sparkles,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import {
  getRiskPresentation,
  isPriorityRisk,
  type RiskPresentationLevel,
} from '../lib/riskPresentation';

export type RecordsCenterActionTone = 'primary' | 'secondary' | 'ghost';

export interface RecordsCenterAction {
  label: string;
  onClick?: () => void;
  tone?: RecordsCenterActionTone;
  disabled?: boolean;
}

export interface RecordsCenterFollowUpItem {
  id: string;
  title: string;
  summary: string;
  statusLabel?: string;
  metaLabel?: string;
  sourceLabel?: string;
  riskLevel?: RiskPresentationLevel;
  tags?: string[];
  isActive?: boolean;
  primaryAction?: RecordsCenterAction;
  secondaryAction?: RecordsCenterAction;
  onDelete?: () => void;
}

export interface RecordsCenterSummaryItem {
  id: string;
  title: string;
  summary: string;
  metaLabel?: string;
  sourceLabel?: string;
  departments?: string[];
  riskLevel?: RiskPresentationLevel;
  onDelete?: () => void;
  primaryAction?: RecordsCenterAction;
  secondaryAction?: RecordsCenterAction;
}

export interface RecordsCenterPanelProps {
  statusLabel?: string;
  title?: string;
  helperText?: string;
  followUps: RecordsCenterFollowUpItem[];
  recentSummaries: RecordsCenterSummaryItem[];
  primaryAction?: RecordsCenterAction;
  secondaryAction?: RecordsCenterAction;
  emptyFollowUpsMessage?: string;
  emptySummariesMessage?: string;
  className?: string;
}

const DEFAULT_FOLLOW_UPS_EMPTY_MESSAGE =
  '目前没有待跟进项目。新的追问、复诊提醒或观察任务接入后，会集中显示在这里。';
const DEFAULT_SUMMARIES_EMPTY_MESSAGE =
  '还没有已完成摘要。一次完整问诊结束后，最近的诊断结论会自动出现在这里。';

function getActionClasses(tone: RecordsCenterActionTone, disabled: boolean) {
  if (disabled) {
    return 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400';
  }

  switch (tone) {
    case 'primary':
      return 'bg-blue-600 text-white hover:bg-blue-700';
    case 'ghost':
      return 'border border-transparent bg-transparent text-slate-600 hover:bg-slate-100';
    default:
      return 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  }
}

function ActionButton({
  action,
  compact = false,
  defaultTone = 'secondary',
}: {
  action: RecordsCenterAction;
  compact?: boolean;
  defaultTone?: RecordsCenterActionTone;
}) {
  const isDisabled = action.disabled || !action.onClick;
  const tone = action.tone ?? defaultTone;

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={isDisabled}
      className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
        compact ? 'rounded-xl px-3 py-1.5 text-xs' : 'rounded-2xl px-4 py-2 text-sm'
      } ${getActionClasses(tone, isDisabled)}`}
    >
      {action.label}
      <ArrowRight size={compact ? 13 : 15} />
    </button>
  );
}

export function RecordsCenterPanel({
  statusLabel = '随访与记录',
  title = '记录中心',
  helperText = '把需要继续处理的项目和最近完成的摘要放在一处，方便快速回看、继续咨询或打开详情。',
  followUps,
  recentSummaries,
  primaryAction,
  secondaryAction,
  emptyFollowUpsMessage = DEFAULT_FOLLOW_UPS_EMPTY_MESSAGE,
  emptySummariesMessage = DEFAULT_SUMMARIES_EMPTY_MESSAGE,
  className,
}: RecordsCenterPanelProps) {
  const priorityFollowUpCount = followUps.filter((item) => isPriorityRisk(item.riskLevel)).length;

  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm ${
        className ?? ''
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            <ClipboardList size={13} className="text-cyan-600" />
            {statusLabel}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{helperText}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {secondaryAction && <ActionButton action={secondaryAction} />}
          {primaryAction && <ActionButton action={primaryAction} defaultTone="primary" />}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock3 size={12} />
            待跟进项目
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{followUps.length} 项</p>
          <p className="mt-1 text-xs text-slate-500">适合承接追问、随访提醒和待补充信息。</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles size={12} />
            高优先级
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{priorityFollowUpCount} 项</p>
          <p className="mt-1 text-xs text-slate-500">橙色和红色记录会在这里快速暴露优先级。</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={12} />
            最近完成摘要
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{recentSummaries.length} 条</p>
          <p className="mt-1 text-xs text-slate-500">已完成判断可随时回看，并继续打开相关记录。</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <MessageSquareText size={16} className="text-cyan-600" />
                <p className="text-sm font-semibold text-slate-800">待跟进</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                  {followUps.length} 项
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                把需要继续确认、回访或补充的记录收在一起。
              </p>
            </div>
          </div>

          {followUps.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-500">
              {emptyFollowUpsMessage}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {followUps.map((item) => {
                const riskMeta =
                  item.riskLevel === undefined || item.riskLevel === null
                    ? null
                    : getRiskPresentation(item.riskLevel);
                const hasMeta = Boolean(item.sourceLabel) || Boolean(item.tags?.length);
                const hasActions = Boolean(item.primaryAction) || Boolean(item.secondaryAction);

                return (
                  <article
                    key={item.id}
                    className={`rounded-2xl border px-4 py-4 ${
                      item.isActive
                        ? 'border-cyan-300 bg-cyan-50/70'
                        : 'border-slate-200 bg-white/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                            {item.statusLabel ?? '待继续'}
                          </span>
                          {riskMeta && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${riskMeta.tone}`}
                            >
                              {riskMeta.label}
                            </span>
                          )}
                          {item.isActive && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-cyan-700">
                              当前
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.summary}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {item.onDelete && (
                          <button
                            type="button"
                            onClick={item.onDelete}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`删除记录 ${item.title}`}
                            title="删除记录"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {item.metaLabel && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                            <Clock3 size={11} />
                            {item.metaLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasMeta && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {item.sourceLabel && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                            <FolderOpen size={11} />
                            {item.sourceLabel}
                          </span>
                        )}
                        {item.tags?.map((tag) => (
                          <span
                            key={`${item.id}-${tag}`}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {hasActions && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.secondaryAction && <ActionButton action={item.secondaryAction} compact />}
                        {item.primaryAction && (
                          <ActionButton
                            action={item.primaryAction}
                            compact
                            defaultTone="primary"
                          />
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Stethoscope size={16} className="text-cyan-600" />
                <p className="text-sm font-semibold text-slate-800">最近完成</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                  {recentSummaries.length} 条
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                最近完成的问诊摘要可直接回看，也适合继续打开相关记录。
              </p>
            </div>
          </div>

          {recentSummaries.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-500">
              {emptySummariesMessage}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {recentSummaries.map((item) => {
                const riskMeta =
                  item.riskLevel === undefined || item.riskLevel === null
                    ? null
                    : getRiskPresentation(item.riskLevel);
                const departments = item.departments ?? [];
                const visibleDepartments = departments.slice(0, 3);
                const hiddenDepartmentCount = Math.max(0, departments.length - visibleDepartments.length);
                const hasMeta = Boolean(item.sourceLabel) || departments.length > 0;
                const hasActions = Boolean(item.primaryAction) || Boolean(item.secondaryAction);

                return (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            已完成
                          </span>
                          {riskMeta && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${riskMeta.tone}`}
                            >
                              {riskMeta.label}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.summary}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {item.onDelete && (
                          <button
                            type="button"
                            onClick={item.onDelete}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`删除记录 ${item.title}`}
                            title="删除记录"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {item.metaLabel && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                            <Clock3 size={11} />
                            {item.metaLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasMeta && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {item.sourceLabel && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                            <FolderOpen size={11} />
                            {item.sourceLabel}
                          </span>
                        )}
                        {visibleDepartments.map((department) => (
                          <span
                            key={`${item.id}-${department}`}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                          >
                            {department}
                          </span>
                        ))}
                        {hiddenDepartmentCount > 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            +{hiddenDepartmentCount}
                          </span>
                        )}
                      </div>
                    )}

                    {hasActions && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.secondaryAction && <ActionButton action={item.secondaryAction} compact />}
                        {item.primaryAction && (
                          <ActionButton
                            action={item.primaryAction}
                            compact
                            defaultTone="primary"
                          />
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
