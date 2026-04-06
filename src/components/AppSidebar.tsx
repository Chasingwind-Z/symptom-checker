import type { ComponentType } from 'react';
import {
  ClipboardList,
  HeartPulse,
  History,
  LogIn,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Pill,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { maskEmail } from '../lib/supabase';
import type { ConversationSession } from '../types';
import { ConversationHistoryPanel } from './ConversationHistoryPanel';

export type SidebarSection =
  | 'search'
  | 'evidence'
  | 'profile'
  | 'history'
  | 'records'
  | 'medication'
  | 'settings';

export const DESKTOP_SIDEBAR_EXPANDED_WIDTH = 232;
export const DESKTOP_SIDEBAR_COLLAPSED_WIDTH = 72;

interface AppSidebarProps {
  activeSection: SidebarSection | 'chat' | 'map' | null;
  searchQuery: string;
  sessions: ConversationSession[];
  activeSessionId?: string | null;
  onOpenSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onStartNewSession: () => void;
  onSelectSearch: () => void;
  onSelectEvidence: () => void;
  onSelectProfile: () => void;
  onSelectHistory: () => void;
  onSelectRecords: () => void;
  onSelectMedication: () => void;
  onSelectSettings: () => void;
  onOpenMap: () => void;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  accountLabel?: string;
  statusLabel: string;
  statusHelperText?: string;
  profileCompletion: number;
  pendingFollowUpCount: number;
  medicationBadge?: string;
  onOpenAuth?: () => void;
  authActionLabel?: string;
  sessionEmail?: string | null;
  currentCity?: string | null;
}

interface SidebarNavButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: ComponentType<{ size?: number; className?: string }>;
  isCollapsed?: boolean;
  badge?: string;
}

function SidebarNavButton({
  label,
  isActive,
  onClick,
  icon: Icon,
  isCollapsed = false,
  badge,
}: SidebarNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={`relative flex w-full items-center rounded-xl text-left transition-colors ${
        isCollapsed
          ? `justify-center px-0 py-2 ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`
          : `gap-2 px-2.5 py-1.5 ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
        }`}
      >
        <Icon size={16} />
      </span>
      {!isCollapsed && (
        <>
          <span className="min-w-0 flex-1 text-[13px] font-medium">{label}</span>
          {badge && (
            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
              {badge}
            </span>
          )}
        </>
      )}
      {isCollapsed && badge && (
        <span className="absolute right-2 top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-medium text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export function AppSidebar({
  activeSection,
  searchQuery,
  sessions,
  activeSessionId,
  onOpenSession,
  onDeleteSession,
  onStartNewSession,
  onSelectSearch,
  onSelectEvidence,
  onSelectProfile,
  onSelectHistory,
  onSelectRecords,
  onSelectMedication,
  onSelectSettings,
  onOpenMap,
  isCollapsed = false,
  onToggleCollapse,
  accountLabel,
  statusLabel,
  statusHelperText,
  profileCompletion,
  pendingFollowUpCount,
  medicationBadge,
  onOpenAuth,
  authActionLabel,
  sessionEmail,
  currentCity,
}: AppSidebarProps) {
  const normalizedSearchQuery = searchQuery.trim();
  const featuredSession =
    sessions.find((session) => session.id === activeSessionId) ?? sessions[0] ?? null;
  const maskedSessionEmail = sessionEmail ? maskEmail(sessionEmail) : '';
  const resolvedAccountLabel = accountLabel ?? (maskedSessionEmail || '游客使用中');
  const normalizedCity = currentCity?.trim();
  const localCity = normalizedCity && normalizedCity !== '中国大陆' ? normalizedCity : null;
  const accountInitial = resolvedAccountLabel.trim().charAt(0) || '游';
  const pendingBadge =
    pendingFollowUpCount > 0 ? `${Math.min(9, pendingFollowUpCount)}${pendingFollowUpCount > 9 ? '+' : ''}` : undefined;
  const historyBadge =
    featuredSession?.riskLevel === 'red'
      ? '紧急'
      : featuredSession?.riskLevel === 'orange'
        ? '高风险'
        : undefined;

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white/92 py-3 backdrop-blur-xl transition-[width,padding] duration-300 lg:flex ${
        isCollapsed ? 'w-[72px] px-2' : 'w-[232px] px-3'
      }`}
    >
      <div
        className={`flex items-center gap-2 px-1 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="rounded-lg bg-blue-600 p-1.5 text-white">
            <Stethoscope size={16} />
          </div>
          {!isCollapsed && <p className="text-sm font-semibold text-slate-900">健康助手</p>}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? '展开侧栏' : '收起侧栏'}
          aria-expanded={!isCollapsed}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <button
        type="button"
        onClick={onStartNewSession}
        title="新建问诊"
        className={`mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 ${
          isCollapsed ? 'h-9 w-9 self-center px-0' : 'gap-2 px-3 py-1.5'
        }`}
      >
        <Plus size={15} />
        {!isCollapsed && '新建问诊'}
      </button>

      <nav className={`mt-2 ${isCollapsed ? 'space-y-1.5' : 'space-y-0.5'}`}>
        {!isCollapsed && (
          <p className="px-2 pb-1 text-[11px] font-medium tracking-[0.08em] text-slate-400">主功能</p>
        )}
        <SidebarNavButton
          label="查记录"
          isActive={activeSection === 'search'}
          onClick={onSelectSearch}
          icon={Search}
          isCollapsed={isCollapsed}
        />
        <SidebarNavButton
          label="为什么这样建议"
          isActive={activeSection === 'evidence'}
          onClick={onSelectEvidence}
          icon={ShieldCheck}
          isCollapsed={isCollapsed}
        />
        <SidebarNavButton
          label="记录与跟进"
          isActive={activeSection === 'records'}
          onClick={onSelectRecords}
          icon={ClipboardList}
          isCollapsed={isCollapsed}
          badge={pendingBadge}
        />
        <SidebarNavButton
          label="服务入口"
          isActive={activeSection === 'medication'}
          onClick={onSelectMedication}
          icon={Pill}
          isCollapsed={isCollapsed}
          badge={medicationBadge}
        />
        <SidebarNavButton
          label="健康地图"
          isActive={activeSection === 'map'}
          onClick={onOpenMap}
          icon={MapPin}
          isCollapsed={isCollapsed}
          badge={localCity ? '本地' : undefined}
        />
      </nav>

      <div className="mt-2 border-t border-slate-100 pt-2">
        {!isCollapsed && (
          <p className="px-2 pb-1 text-[11px] font-medium tracking-[0.08em] text-slate-400">个人</p>
        )}
        <SidebarNavButton
          label="我的资料"
          isActive={activeSection === 'profile'}
          onClick={onSelectProfile}
          icon={HeartPulse}
          isCollapsed={isCollapsed}
          badge={profileCompletion >= 100 ? '已完成' : `${profileCompletion}%`}
        />
        <SidebarNavButton
          label="历史问诊"
          isActive={activeSection === 'history'}
          onClick={onSelectHistory}
          icon={History}
          isCollapsed={isCollapsed}
          badge={historyBadge}
        />
        <SidebarNavButton
          label="偏好设置"
          isActive={activeSection === 'settings'}
          onClick={onSelectSettings}
          icon={Settings2}
          isCollapsed={isCollapsed}
        />
      </div>

      {!isCollapsed && (
        <div className="mt-2 min-h-0 flex-1 overflow-hidden">
          <ConversationHistoryPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            onOpenSession={onOpenSession}
            onDeleteSession={onDeleteSession}
            title={normalizedSearchQuery ? '匹配会话' : '最近会话'}
            description={
              normalizedSearchQuery
                ? `按“${searchQuery}”筛到的线程`
                : '最近线程会固定展示在左侧，方便随时继续。'
            }
            emptyMessage={
              normalizedSearchQuery
                ? '没有找到匹配的会话，试试症状、科室或建议关键词。'
                : '还没有历史会话。完成一次问诊后，线程会自动出现在这里。'
            }
            maxItems={6}
            variant="sidebar"
            showStartButton={false}
          />
        </div>
      )}

      <div className="mt-2 border-t border-slate-100 px-1 pt-2">
        {isCollapsed ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div
                title={`${statusLabel} · ${resolvedAccountLabel}`}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700"
              >
                {accountInitial}
              </div>
            </div>
            {onOpenAuth && authActionLabel && (
              <button
                type="button"
                onClick={onOpenAuth}
                title={authActionLabel}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
              >
                <LogIn size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-slate-900">{statusLabel}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{resolvedAccountLabel}</p>
              {statusHelperText && (
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{statusHelperText}</p>
              )}
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
        )}
      </div>
    </aside>
  );
}
