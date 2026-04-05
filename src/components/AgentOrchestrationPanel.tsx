import { GitBranch, Sparkles } from 'lucide-react';
import type { AgentBadge, AgentRoute, AgentStep } from '../types';

interface AgentOrchestrationPanelProps {
  route?: AgentRoute | null;
  compact?: boolean;
  isLive?: boolean;
}

const BADGE_STYLES: Record<AgentBadge['tone'], string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
};

function getStepDot(step: AgentStep): string {
  if (step.status === 'lead') return 'bg-blue-500';
  if (step.status === 'active') return 'bg-emerald-500';
  return 'bg-slate-300';
}

export function AgentOrchestrationPanel({
  route,
  compact = false,
  isLive = false,
}: AgentOrchestrationPanelProps) {
  if (!route) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50/80 ${
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {isLive ? <Sparkles className="w-3.5 h-3.5" /> : <GitBranch className="w-3.5 h-3.5" />}
            <span>{isLive ? '智能分析中' : '分析摘要'}</span>
          </div>
          <p className={`mt-1 text-slate-600 ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {route.summary}
          </p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-500">
          主路径：{route.primary.shortLabel}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {route.activeAgents.map((agent) => (
          <span
            key={agent.id}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              BADGE_STYLES[agent.tone]
            }`}
          >
            {agent.shortLabel}
          </span>
        ))}
      </div>

      {!compact && route.steps.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {route.steps.slice(0, 4).map((step) => (
            <div key={step.id} className="flex items-start gap-2 text-xs text-slate-600">
              <span className={`mt-1 h-2 w-2 rounded-full ${getStepDot(step)}`} />
              <span>
                <strong className="font-medium text-slate-700">{step.label}</strong>：{step.focus}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
