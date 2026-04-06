import type { ComponentType } from 'react';
import {
  ClipboardList,
  HeartPulse,
  History,
  LogIn,
  MapPin,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Pill,
  Plus,
  Search,
  Settings2,
  Stethoscope,
} from 'lucide-react';
import { maskEmail } from '../lib/supabase';
import type { ConversationSession } from '../types';
import { ConversationHistoryPanel } from './ConversationHistoryPanel';

export type SidebarSection =
  | 'search'
  | 'profile'
  | 'history'
  | 'records'
  | 'medication'
  | 'settings';

export const DESKTOP_SIDEBAR_EXPANDED_WIDTH = 320;
export const DESKTOP_SIDEBAR_COLLAPSED_WIDTH = 96;

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
  onSelectSettings: () => void;
  onOpenMap: () => void;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  accountLabel?: string;
  statusLabel: string;
  statusHelperText?: string;
  profileCompletion: number;
  pendingFollowUpCount: number;
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

interface SidebarPersonalizationItem {
  id: string;
  label: string;
  title: string;
  description: string;
  toneClass: string;
  badge?: string;
  onClick: () => void;
}

function trimSidebarText(value: string, maxLength = 18) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}…` : value;
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
          ? `justify-center px-0 py-3 ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`
          : `gap-2.5 px-3 py-2 ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
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
  onSelectSettings,
  onOpenMap,
  isCollapsed = false,
  onToggleCollapse,
  accountLabel,
  statusLabel,
  statusHelperText,
  profileCompletion,
  pendingFollowUpCount,
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

  const personalizedItems: SidebarPersonalizationItem[] = [
    {
      id: 'profile',
      label: '档案',
      title: `档案已完成 ${profileCompletion}%`,
      description:
        profileCompletion >= 100
          ? maskedSessionEmail
            ? `已连接 ${maskedSessionEmail}，后续更新会自动同步。`
            : '档案已基本完善，当前资料保存在本机浏览器。'
          : maskedSessionEmail
            ? `已连接 ${maskedSessionEmail}，再补一点资料会更省追问。`
            : '补齐基础资料后，问诊会更少重复追问。',
      toneClass: profileCompletion >= 100 ? 'bg-emerald-500' : 'bg-cyan-500',
      badge: maskedSessionEmail ? '云端同步' : '本机保存',
      onClick: onSelectProfile,
    },
  ];

  if (normalizedSearchQuery) {
    personalizedItems.push(
      sessions.length > 0
        ? {
            id: 'search-results',
            label: '继续关注',
            title: `找到 ${sessions.length} 段相关会话`,
            description: '可直接打开结果，继续之前的问诊线程。',
            toneClass: 'bg-cyan-500',
            badge: '搜索中',
            onClick: () => onOpenSession(sessions[0].id),
          }
        : totalSessionCount > 0
          ? {
              id: 'search-empty',
              label: '继续关注',
              title: '当前搜索没有匹配会话',
              description: '点这里清空筛选，回到最近线程列表。',
              toneClass: 'bg-slate-400',
              onClick: () => onSearchQueryChange(''),
            }
          : {
              id: 'search-first-session',
              label: '继续关注',
              title: '先开始一次新的问诊',
              description: '问诊线程会自动保存在左侧，方便下次继续。',
              toneClass: 'bg-slate-400',
              onClick: onStartNewSession,
            }
    );
  } else if (featuredSession) {
    personalizedItems.push({
      id: 'continue',
      label: '继续关注',
      title: `继续「${trimSidebarText(featuredSession.title)}」`,
      description:
        pendingFollowUpCount > 0
          ? `${pendingFollowUpCount} 项待跟进，建议优先补充最近回复。`
          : featuredSession.id === activeSessionId
            ? '当前线程已打开，可直接接着问。'
            : `最近线程已保存，可继续查看 ${totalSessionCount} 段历史会话。`,
      toneClass: pendingFollowUpCount > 0 ? 'bg-amber-500' : 'bg-slate-400',
      badge:
        pendingFollowUpCount > 0
          ? `${pendingFollowUpCount} 待办`
          : featuredSession.id === activeSessionId
            ? '当前'
            : undefined,
      onClick: () => onOpenSession(featuredSession.id),
    });
  } else {
    personalizedItems.push({
      id: 'continue-empty',
      label: '继续关注',
      title: '还没有历史会话',
      description: '完成一次问诊后，最近线程会固定展示在这里。',
      toneClass: 'bg-slate-400',
      onClick: onStartNewSession,
    });
  }

  if (localCity) {
    personalizedItems.push({
      id: 'local-reminder',
      label: '本地提醒',
      title: `当前城市：${localCity}`,
      description: '健康地图会优先展示附近资源与建议。',
      toneClass: 'bg-emerald-500',
      badge: '附近资源',
      onClick: onOpenMap,
    });
  }

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white/92 py-4 backdrop-blur-xl transition-[width,padding] duration-300 lg:flex ${
        isCollapsed ? 'w-24 px-3' : 'w-[320px] px-4'
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
        className={`mt-3 inline-flex items-center justify-center rounded-xl bg-blue-600 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 ${
          isCollapsed ? 'h-11 w-11 self-center px-0' : 'gap-2 px-4 py-2'
        }`}
      >
        <Plus size={15} />
        {!isCollapsed && '新建问诊'}
      </button>

      <nav className={`mt-3 ${isCollapsed ? 'space-y-2' : 'space-y-0.5'}`}>
        <SidebarNavButton
          label="当前问诊"
          isActive={activeSection === 'chat'}
          onClick={onSelectChat}
          icon={MessageSquareText}
          isCollapsed={isCollapsed}
        />
        <SidebarNavButton
          label="搜索记录"
          isActive={activeSection === 'search'}
          onClick={onSelectSearch}
          icon={Search}
          isCollapsed={isCollapsed}
        />
        <SidebarNavButton
          label="健康档案"
          isActive={activeSection === 'profile'}
          onClick={onSelectProfile}
          icon={HeartPulse}
          isCollapsed={isCollapsed}
        />
        <SidebarNavButton
          label="历史会话"
          isActive={activeSection === 'history'}
          onClick={onSelectHistory}
          icon={History}
          isCollapsed={isCollapsed}
        />
        <SidebarNavButton
          label="记录中心"
          isActive={activeSection === 'records'}
          onClick={onSelectRecords}
          icon={ClipboardList}
          isCollapsed={isCollapsed}
          badge={pendingBadge}
        />
        <SidebarNavButton
          label="用药建议"
          isActive={activeSection === 'medication'}
          onClick={onSelectMedication}
          icon={Pill}
          isCollapsed={isCollapsed}
        />
        <SidebarNavButton
          label="健康地图"
          isActive={activeSection === 'map'}
          onClick={onOpenMap}
          icon={MapPin}
          isCollapsed={isCollapsed}
        />
      </nav>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <SidebarNavButton
          label="问诊设置"
          isActive={activeSection === 'settings'}
          onClick={onSelectSettings}
          icon={Settings2}
          isCollapsed={isCollapsed}
        />
      </div>

      {!isCollapsed && (
        <>
          <section className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-2.5 py-2.5">
            <p className="px-2 text-[11px] font-medium tracking-[0.08em] text-slate-500">为你推荐</p>
            <div className="mt-1.5 space-y-0.5">
              {personalizedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/90"
                >
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.toneClass}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium tracking-[0.06em] text-slate-400">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] font-medium text-slate-700">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="mt-3 min-h-0 flex-1 overflow-hidden">
            <ConversationHistoryPanel
              sessions={sessions}
              activeSessionId={activeSessionId}
              onOpenSession={onOpenSession}
              title={normalizedSearchQuery ? '匹配会话' : '最近会话'}
              description={
                normalizedSearchQuery
                  ? `按“${searchQuery}”筛选后的会话结果`
                  : '最近更新的线程会固定展示在左侧，方便随时继续。'
              }
              emptyMessage={
                normalizedSearchQuery
                  ? '没有找到匹配的会话，试试症状、科室或建议关键词。'
                  : '还没有历史会话。完成一次问诊后，线程会自动出现在这里。'
              }
              maxItems={8}
              variant="sidebar"
              showStartButton={false}
            />
          </div>
        </>
      )}

      <div className="mt-3 border-t border-slate-100 px-1 pt-3">
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
