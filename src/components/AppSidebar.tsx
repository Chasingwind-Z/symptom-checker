import type { ComponentType } from 'react';
import {
  ClipboardList,
  HeartPulse,
  History,
  LogIn,
  MapPin,
  MessageSquareText,
  Pill,
  Plus,
  Search,
  Stethoscope,
} from 'lucide-react';
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
  accountLabel?: string;
  statusLabel: string;
  statusHelperText?: string;
  profileCompletion: number;
  pendingFollowUpCount: number;
  onOpenAuth?: () => void;
  authActionLabel?: string;
  sessionEmail?: string | null;
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
  isActive,
  onClick,
  icon: Icon,
}: SidebarNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
        isActive
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon size={16} className={isActive ? 'text-slate-900' : 'text-slate-400'} />
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  );
}

export function AppSidebar({
  activeSection,
  searchQuery,
  sessions,
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
  accountLabel,
  statusLabel,
  onOpenAuth,
  authActionLabel,
}: AppSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[320px] shrink-0 flex-col border-r border-slate-200 bg-white/92 px-4 py-4 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <div className="rounded-lg bg-blue-600 p-1.5 text-white">
          <Stethoscope size={16} />
        </div>
        <p className="text-sm font-semibold text-slate-900">健康助手</p>
      </div>

      <button
        type="button"
        onClick={onStartNewSession}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
      >
        <Plus size={15} />
        新建问诊
      </button>

      <nav className="mt-3 space-y-0.5">
        <SidebarNavButton
          label="当前问诊"
          description=""
          isActive={activeSection === 'chat'}
          onClick={onSelectChat}
          icon={MessageSquareText}
        />
        <SidebarNavButton
          label="搜索记录"
          description=""
          isActive={activeSection === 'search'}
          onClick={onSelectSearch}
          icon={Search}
        />
        <SidebarNavButton
          label="健康档案"
          description=""
          isActive={activeSection === 'profile'}
          onClick={onSelectProfile}
          icon={HeartPulse}
        />
        <SidebarNavButton
          label="历史会话"
          description=""
          isActive={activeSection === 'history'}
          onClick={onSelectHistory}
          icon={History}
        />
        <SidebarNavButton
          label="记录中心"
          description=""
          isActive={activeSection === 'records'}
          onClick={onSelectRecords}
          icon={ClipboardList}
        />
        <SidebarNavButton
          label="用药建议"
          description=""
          isActive={activeSection === 'medication'}
          onClick={onSelectMedication}
          icon={Pill}
        />
        <SidebarNavButton
          label="健康地图"
          description=""
          isActive={activeSection === 'map'}
          onClick={onOpenMap}
          icon={MapPin}
        />
      </nav>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
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

      <div className="mt-3 border-t border-slate-100 px-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-900">{statusLabel}</p>
            <p className="text-[11px] text-slate-500">{accountLabel ?? ''}</p>
          </div>
          {onOpenAuth && authActionLabel && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              <LogIn size={13} />
              {authActionLabel}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
