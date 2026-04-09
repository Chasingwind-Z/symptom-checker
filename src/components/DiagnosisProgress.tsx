import { CheckCircle2, Clock, LoaderCircle, Sparkles } from 'lucide-react';
import type { DiagnosisResult, Message } from '../types';

interface DiagnosisProgressProps {
  messages: Message[];
  diagnosisResult: DiagnosisResult | null;
  isLoading?: boolean;
  hasStreamingContent?: boolean;
}

type StepState = 'done' | 'active' | 'pending';

const STEPS = [
  { label: '症状描述' },
  { label: '补充线索' },
  { label: '谨慎建议' },
] as const;

function getStepCircleClass(stepState: StepState, isFinalStep: boolean) {
  if (stepState === 'done') {
    return isFinalStep
      ? 'border-emerald-500 bg-emerald-500 text-white'
      : 'border-blue-500 bg-blue-500 text-white';
  }

  if (stepState === 'active') {
    return 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm shadow-blue-100';
  }

  return 'border-slate-200 bg-white text-slate-400';
}

function getStepLabelClass(stepState: StepState) {
  if (stepState === 'pending') return 'text-slate-400';
  if (stepState === 'active') return 'text-slate-800';
  return 'text-slate-700';
}

function getStepCaptionClass(stepState: StepState, isFinalStep: boolean) {
  if (stepState === 'active') return 'text-blue-600';
  if (stepState === 'done') return isFinalStep ? 'text-emerald-600' : 'text-blue-600';
  return 'text-slate-400';
}

export function DiagnosisProgress({
  messages,
  diagnosisResult,
  isLoading = false,
  hasStreamingContent = false,
}: DiagnosisProgressProps) {
  const userCount = messages.filter((m) => m.role === 'user').length;
  const assistantCount = messages.filter((m) => m.role === 'assistant').length;
  const latestMessage = messages[messages.length - 1];
  const isResponding = isLoading || hasStreamingContent;
  const followUpCount = Math.max(assistantCount - (diagnosisResult ? 1 : 0), 0);
  const departmentLabel = diagnosisResult
    ? `${diagnosisResult.departments.slice(0, 2).join(' / ')}${
        diagnosisResult.departments.length > 2 ? ' 等' : ''
      }`
    : '';

  const stepStates: StepState[] = diagnosisResult
    ? ['done', 'done', 'done']
    : ['done', 'active', 'pending'];

  const stepCaptions = [
    userCount > 1 ? `${userCount} 条描述` : '已记录',
    diagnosisResult
      ? '已完成'
      : isResponding
        ? '整理中'
        : latestMessage?.role === 'assistant'
          ? '待补充'
          : assistantCount > 0
            ? '待继续'
            : '待开始',
    diagnosisResult ? '已生成' : '待生成',
  ] as const;

  const statusMeta = diagnosisResult
    ? {
        label: '建议已生成',
        headline: '问诊阶段已完成，请查看行动建议',
        description: '当前仅提供分诊参考，请结合危险信号和结果卡内容判断是否需要尽快线下就医。',
        badgeClass: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: <CheckCircle2 size={14} className="flex-shrink-0" />,
      }
    : isResponding
      ? {
          label: '评估中',
          headline: assistantCount > 0 ? '正在整理已提供的症状线索' : '正在阅读首轮症状描述',
          description:
            '系统会继续围绕持续时间、程度和伴随症状核对信息，避免过早给出看似确定的结论。',
          badgeClass: 'border border-blue-200 bg-blue-50 text-blue-700',
          icon: <LoaderCircle size={14} className="flex-shrink-0 animate-spin" />,
        }
      : latestMessage?.role === 'assistant'
        ? {
            label: '等待补充',
            headline: '仍在补充关键信息',
            description:
              '继续回答持续时间、程度或伴随症状等细节后，系统会再更新分诊判断与下一步建议。',
            badgeClass: 'border border-slate-200 bg-slate-50 text-slate-600',
            icon: <Clock size={14} className="flex-shrink-0" />,
          }
        : assistantCount > 0
          ? {
              label: '待继续评估',
              headline: '已收到新的补充信息',
              description: '继续对话后会基于现有线索更新风险提示和就医方向，不会把当前进度当作确诊结果。',
              badgeClass: 'border border-blue-200 bg-blue-50 text-blue-700',
              icon: <Sparkles size={14} className="flex-shrink-0" />,
            }
          : {
              label: '已接收主诉',
              headline: '首轮症状描述已提交',
              description: '下一步会先确认关键细节，让后续建议更有针对性，也更保守可靠。',
              badgeClass: 'border border-blue-200 bg-blue-50 text-blue-700',
              icon: <Sparkles size={14} className="flex-shrink-0" />,
            };

  const summaryPills = [
    {
      label: `症状描述 ${userCount} 条`,
      className: 'border border-blue-100 bg-blue-50 text-blue-700',
    },
    followUpCount > 0
      ? {
          label: `补充追问 ${followUpCount} 轮`,
          className: 'border border-slate-200 bg-slate-50 text-slate-600',
        }
      : null,
    diagnosisResult && diagnosisResult.departments.length > 0
      ? {
          label: `建议方向 ${departmentLabel}`,
          className: 'border border-emerald-100 bg-emerald-50 text-emerald-700',
        }
      : null,
  ].filter((pill): pill is { label: string; className: string } => Boolean(pill));

  if (userCount < 1) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-3">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">问诊进度</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{statusMeta.headline}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{statusMeta.description}</p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${statusMeta.badgeClass}`}
            >
              {statusMeta.icon}
              <span>{statusMeta.label}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {summaryPills.map((pill) => (
              <span
                key={pill.label}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${pill.className}`}
              >
                {pill.label}
              </span>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="relative flex items-start justify-between gap-3">
              <div className="absolute left-0 right-0 top-4 z-0 flex px-[18px]">
                <div className="h-0.5 flex-1 bg-blue-400 transition-colors duration-500" />
                <div
                  className={`h-0.5 flex-1 transition-colors duration-500 ${
                    diagnosisResult ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              </div>

              {STEPS.map((step, index) => {
                const stepState = stepStates[index];
                const isFinalStep = index === STEPS.length - 1;

                return (
                  <div key={step.label} className="relative z-10 flex flex-1 flex-col items-center text-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-500 ${getStepCircleClass(
                        stepState,
                        isFinalStep
                      )}`}
                    >
                      {stepState === 'done' ? (
                        <CheckCircle2 size={16} />
                      ) : stepState === 'active' && isResponding ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : stepState === 'active' && latestMessage?.role === 'assistant' ? (
                        <Clock size={16} />
                      ) : stepState === 'active' && assistantCount === 0 ? (
                        <Sparkles size={16} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${getStepLabelClass(stepState)}`}>{step.label}</span>
                    <span
                      className={`mt-1 text-xs font-medium ${getStepCaptionClass(
                        stepState,
                        isFinalStep
                      )}`}
                    >
                      {stepCaptions[index]}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-xs leading-4 text-slate-400">
              仅展示当前问诊阶段，不代表诊断把握度或确诊结果。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
