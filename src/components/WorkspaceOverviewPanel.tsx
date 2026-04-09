import { ArrowRight, Cloud, MapPin, MessageSquareText, Plus, UserRound } from 'lucide-react';
import type { CaseHistoryItem } from '../lib/healthData';
import { getRiskPresentation } from '../lib/riskPresentation';
import { maskEmail } from '../lib/supabase';
import type { ConversationSession } from '../types';

interface WorkspaceOverviewPanelProps {
  title?: string;
  sessionEmail: string | null;
  statusLabel: string;
  helperText: string;
  profileCompletion: number;
  latestCase?: CaseHistoryItem;
  latestConversation?: ConversationSession | null;
  conversationCount: number;
  onStartNewConversation: () => void;
  onOpenMap: () => void;
  onContinueConversation?: () => void;
}

export function WorkspaceOverviewPanel({
  title = '个人空间',
  sessionEmail,
  statusLabel,
  helperText,
  profileCompletion,
  latestCase,
  latestConversation,
  conversationCount,
  onStartNewConversation,
  onOpenMap,
  onContinueConversation,
}: WorkspaceOverviewPanelProps) {
  const riskMeta = getRiskPresentation(latestCase?.triageLevel ?? latestConversation?.riskLevel ?? null);
  const latestTitle = latestCase?.chiefComplaint || latestConversation?.title || '还没有历史问诊';
  const accountLabel = sessionEmail ? maskEmail(sessionEmail) : '本地使用中';

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            <Cloud size={13} className="text-cyan-600" />
            {statusLabel}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{helperText}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {onContinueConversation && (
            <button
              type="button"
              onClick={onContinueConversation}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <ArrowRight size={15} />
              继续上次咨询
            </button>
          )}
          <button
            type="button"
            onClick={onStartNewConversation}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Plus size={15} />
            新建对话
          </button>
          <button
            type="button"
            onClick={onOpenMap}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <MapPin size={15} />
            健康地图
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserRound size={12} />
            当前账号
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{accountLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            {sessionEmail ? '资料与历史会自动跨设备同步' : '资料保存在当前浏览器'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Cloud size={12} />
            档案完整度
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{profileCompletion}%</p>
          <p className="mt-1 text-xs text-slate-500">补齐基础资料后，问诊会更少重复追问。</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MessageSquareText size={12} />
            最近一次
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{latestTitle}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${riskMeta.tone}`}>
              {riskMeta.label}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MessageSquareText size={12} />
            历史会话
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{conversationCount} 段</p>
          <p className="mt-1 text-xs text-slate-500">可在首页、聊天页和个人空间继续之前的对话线程。</p>
        </div>
      </div>
    </section>
  );
}
