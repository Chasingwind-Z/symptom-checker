import { AlertCircle, CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react';
import type { ToolCall } from '../types';

interface ToolCallIndicatorProps {
  visible?: boolean;
  toolCalls?: ToolCall[];
  compact?: boolean;
}

const FALLBACK_TOOL_CALL: ToolCall = {
  id: 'thinking',
  name: 'thinking',
  displayName: '分析症状',
  status: 'running',
  summary: '正在整理问诊线索',
};

function getLabel(toolCall: ToolCall): string {
  if (toolCall.status === 'running') return `正在${toolCall.displayName}`;
  if (toolCall.status === 'error') return `${toolCall.displayName}已降级`;
  return `已${toolCall.displayName}`;
}

function getStyle(status: ToolCall['status']): string {
  switch (status) {
    case 'done':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'error':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'running':
    default:
      return 'bg-purple-50 text-purple-700 border border-purple-200';
  }
}

function getIcon(toolCall: ToolCall) {
  switch (toolCall.status) {
    case 'done':
      return <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />;
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />;
    case 'running':
    default:
      return toolCall.name === 'thinking' ? (
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <LoaderCircle className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
      );
  }
}

export function ToolCallIndicator({
  visible = true,
  toolCalls = [],
  compact = false,
}: ToolCallIndicatorProps) {
  if (!visible) return null;

  const items = toolCalls.length > 0 ? toolCalls : [FALLBACK_TOOL_CALL];

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'max-w-lg'}`}>
      {items.map((toolCall) => (
        <div
          key={toolCall.id}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStyle(toolCall.status)}`}
          title={toolCall.summary}
        >
          {getIcon(toolCall)}
          <span>{getLabel(toolCall)}</span>
          {!compact && toolCall.summary && (
            <span className="opacity-80">· {toolCall.summary}</span>
          )}
        </div>
      ))}
    </div>
  );
}
