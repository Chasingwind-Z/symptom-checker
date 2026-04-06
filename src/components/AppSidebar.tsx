import type { ComponentType } from 'react';
import {
  ClipboardList,
  HeartPulse,
  History,
  MapPin,
  MessageSquareText,
  Pill,
  Plus,
  Search,
  Stethoscope,
} from 'lucide-react';
import { maskEmail } from '../lib/supabase';
import type { ConversationSession } from '../types';
import { ConversationHistoryPanel } from './ConversationHistoryPanel';

export type SidebarSection = 'search' | 'profile' | 'history' | 'records' | 'medication';

interface AppSidebarProps {
  activeSection: SidebarSection | 'chat' | 'map' | null;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sessions: ConversationSession[];
  totalSessionCount: number;
  activeSessionId?: string | null;
  onOpenSession: (sessionId: string) => void;
  onStartNewSession: () => void;
  onSelectChat: () => void;
  onSelectSearch: () => void;
  onSelectProfile: () => void;
  onSelectHistory: () => void;
  onSelectRecords: () => void;
  onSelectMedication: () => void;
  onOpenMap: () => void;
  sessionEmail?: string | null;
  statusLabel: string;
  profileCompletion: number;
  pendingFollowUpCount: number;
}

interface SidebarNavButtonProps {
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
  icon: ComponentType<{ size?: number; className?: string }>;
}

function SidebarNavButton({
  label,
  description,
  isActive,
  onClick,
  icon: Icon,
}: SidebarNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
        isActive
          ? 'border-cyan-200 bg-cyan-50/80 shadow-sm'
          : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2 ${
            isActive ? 'bg-white text-cyan-700' : 'bg-white text-slate-500'
          }`}
        >
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function AppSidebar({
  activeSection,
  searchQuery,
  onSearchQueryChange,
  sessions,
  totalSessionCount,
  activeSessionId,
  onOpenSession,
  onStartNewSession,
  onSelectChat,
  onSelectSearch,
  onSelectProfile,
  onSelectHistory,
  onSelectRecords,
  onSelectMedication,
  onOpenMap,
  sessionEmail,
  statusLabel,
  profileCompletion,
  pendingFollowUpCount,
}: AppSidebarProps) {
  const accountLabel = sessionEmail ? maskEmail(sessionEmail) : '游客模式';
  const sessionSummary = searchQuery.trim()
    ? `已按“${searchQuery}”筛到 ${sessions.length} 段会话`
    : totalSessionCount > 0
      ? '最近更新的问诊线程会固定显示在这里'
      : '完成第一次问诊后，线程会自动保存在这里';

  return (
    <aside className="sticky top-0 hidden h-screen w-[320px] shrink-0 flex-col border-r border-slate-200 bg-white/92 px-4 py-4 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="rounded-2xl bg-blue-600 p-2 text-white shadow-sm">
          <Stethoscope size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">健康助手</p>
          <p className="text-xs text-slate-500">把问诊、档案和记录集中到左侧</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStartNewSession}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        <Plus size={16} />
        新建问诊
      </button>

      <nav className="mt-4 space-y-1.5">
        <SidebarNavButton
          label="当前问诊"
          description="回到当前线程，继续补充新的症状变化"
          isActive={activeSection === 'chat'}
          onClick={onSelectChat}
          icon={MessageSquareText}
        />
        <SidebarNavButton
          label="搜索记录"
          description={searchQuery.trim() ? `当前关键词：${searchQuery}` : '按症状、标题或建议快速查找'}
          isActive={activeSection === 'search'}
          onClick={onSelectSearch}
          icon={Search}
        />
        <SidebarNavButton
          label="健康档案"
          description={`基础资料完整度 ${profileCompletion}%`}
          isActive={activeSection === 'profile'}
          onClick={onSelectProfile}
          icon={HeartPulse}
        />
        <SidebarNavButton
          label="历史会话"
          description={totalSessionCount > 0 ? `${totalSessionCount} 段线程已保存` : '查看最近保存的问诊线程'}
          isActive={activeSection === 'history'}
          onClick={onSelectHistory}
          icon={History}
        />
        <SidebarNavButton
          label="记录中心"
          description={
            pendingFollowUpCount > 0
              ? `${pendingFollowUpCount} 项待跟进`
              : '随访提醒和最近摘要会汇总在这里'
          }
          isActive={activeSection === 'records'}
          onClick={onSelectRecords}
          icon={ClipboardList}
        />
        <SidebarNavButton
          label="用药建议"
          description="把最近问诊里的 OTC / 家庭处理方向前置查看"
          isActive={activeSection === 'medication'}
          onClick={onSelectMedication}
          icon={Pill}
        />
        <SidebarNavButton
          label="健康地图"
          description="查看附近医院与地区健康趋势"
          isActive={activeSection === 'map'}
          onClick={onOpenMap}
          icon={MapPin}
        />
      </nav>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search size={15} className="text-slate-400" />
          <input
            value={searchQuery}
            onFocus={onSelectSearch}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="搜索症状、会话或建议"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{sessionSummary}</p>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        <ConversationHistoryPanel
          sessions={sessions}
          activeSessionId={activeSessionId}
          onOpenSession={onOpenSession}
          title={searchQuery.trim() ? '匹配会话' : '最近会话'}
          description={
            searchQuery.trim()
              ? `按“${searchQuery}”筛选后的会话结果`
              : '最近更新的线程会固定展示在左侧，方便随时继续。'
          }
          emptyMessage={
            searchQuery.trim()
              ? '没有找到匹配的会话，试试症状、科室或建议关键词。'
              : '还没有历史会话。完成一次问诊后，线程会自动出现在这里。'
          }
          maxItems={8}
          variant="sidebar"
          showStartButton={false}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
        <p className="text-xs font-medium text-slate-500">{accountLabel}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{statusLabel}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1">档案完整度 {profileCompletion}%</span>
          <span className="rounded-full bg-white px-2.5 py-1">
            {pendingFollowUpCount > 0 ? `${pendingFollowUpCount} 项待跟进` : '记录中心已整理'}
          </span>
        </div>
      </div>
    </aside>
  );
}
