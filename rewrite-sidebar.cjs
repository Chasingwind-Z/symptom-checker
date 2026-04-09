const fs = require('fs');

const content = `import type { ComponentType } from 'react';
import {
  ClipboardList,
  LogIn,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Stethoscope,
  User,
} from 'lucide-react';
import { maskEmail } from '../lib/supabase';
import type { ConversationSession } from '../types';
import { ConversationHistoryPanel } from './ConversationHistoryPanel';

export type SidebarSection = 'records' | 'profile';

export const DESKTOP_SIDEBAR_EXPANDED_WIDTH = 232;
export const DESKTOP_SIDEBAR_COLLAPSED_WIDTH = 72;

interface AppSidebarProps {
  activeSection: SidebarSection | 'chat' | null;
  sessions: ConversationSession[];
  activeSessionId?: string | null;
  onOpenSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onStartNewSession: () => void;
  onSelectChat: () => void;
  onSelectProfile: () => void;
  onSelectRecords: () => void;
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
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className={\`relative flex w-full items-center justify-center rounded-xl px-0 py-2 text-left transition-colors \${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
        }\`}
      >
        <Icon size={16} />
        {badge && (
          <span className="absolute right-2 top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-medium text-white">
            {badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={\`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors \${
        isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
      }\`}
    >
      <Icon size={16} />
      <span className="min-w-0 flex-1">{label}</span>
      {badge && (
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-500">
          {badge}
        </span>
      )}
    </button>
  );
}

export function AppSidebar({
  activeSection,
  sessions,
  activeSessionId,
  onOpenSession,
  onDeleteSession,
  onStartNewSession,
  onSelectChat,
  onSelectProfile,
  onSelectRecords,
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
}: AppSidebarProps) {
  const maskedSessionEmail = sessionEmail ? maskEmail(sessionEmail) : '';
  const resolvedAccountLabel = accountLabel ?? (maskedSessionEmail || '\u6e38\u5ba2\u4f7f\u7528\u4e2d');
  const accountInitial = resolvedAccountLabel.trim().charAt(0) || '\u6e38';
  const pendingBadge =
    pendingFollowUpCount > 0 ? \`\${Math.min(9, pendingFollowUpCount)}\${pendingFollowUpCount > 9 ? '+' : ''}\` : undefined;

  return (
    <aside
      className={\`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white/92 py-3 backdrop-blur-xl transition-[width,padding] duration-300 lg:flex \${
        isCollapsed ? 'w-[72px] px-2' : 'w-[232px] px-3'
      }\`}
    >
      <div
        className={\`flex items-center gap-2 px-1 \${
          isCollapsed ? 'justify-center' : 'justify-between'
        }\`}
      >
        <div className={\`flex items-center gap-2.5 \${isCollapsed ? 'justify-center' : ''}\`}>
          <div className="rounded-lg bg-blue-600 p-1.5 text-white">
            <Stethoscope size={16} />
          </div>
          {!isCollapsed && <p className="text-sm font-semibold text-slate-900">\u5065\u5eb7\u52a9\u624b</p>}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? '\u5c55\u5f00\u4fa7\u680f' : '\u6536\u8d77\u4fa7\u680f'}
          aria-expanded={!isCollapsed}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <button
        type="button"
        onClick={onStartNewSession}
        title="\u65b0\u5efa\u95ee\u8bca"
        className={\`mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 \${
          isCollapsed ? 'h-9 w-9 self-center px-0' : 'gap-2 px-3 py-1.5'
        }\`}
      >
        <Plus size={15} />
        {!isCollapsed && '\u65b0\u5efa\u95ee\u8bca'}
      </button>

      <nav className={\`mt-2 \${isCollapsed ? 'space-y-1.5' : 'space-y-0.5'}\`}>
        <SidebarNavButton
          label="\u95ee\u8bca"
          isActive={activeSection === 'chat'}
          onClick={onSelectChat}
          icon={MessageSquare}
          isCollapsed={isCollapsed}
        />
        <SidebarNavButton
          label="\u8bb0\u5f55"
          isActive={activeSection === 'records'}
          onClick={onSelectRecords}
          icon={ClipboardList}
          isCollapsed={isCollapsed}
          badge={pendingBadge}
        />
        <SidebarNavButton
          label="\u6211\u7684"
          isActive={activeSection === 'profile'}
          onClick={onSelectProfile}
          icon={User}
          isCollapsed={isCollapsed}
          badge={profileCompletion >= 100 ? '\u5df2\u5b8c\u6210' : \`\${profileCompletion}%\`}
        />
      </nav>

      {!isCollapsed && (
        <div className="mt-2 min-h-0 flex-1 overflow-hidden">
          <ConversationHistoryPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            onOpenSession={onOpenSession}
            onDeleteSession={onDeleteSession}
            title="\u6700\u8fd1\u4f1a\u8bdd"
            description="\u6700\u8fd1\u7ebf\u7a0b\u4f1a\u56fa\u5b9a\u5c55\u793a\u5728\u5de6\u4fa7\uff0c\u65b9\u4fbf\u968f\u65f6\u7ee7\u7eed\u3002"
            emptyMessage="\u8fd8\u6ca1\u6709\u5386\u53f2\u4f1a\u8bdd\u3002\u5b8c\u6210\u4e00\u6b21\u95ee\u8bca\u540e\uff0c\u7ebf\u7a0b\u4f1a\u81ea\u52a8\u51fa\u73b0\u5728\u8fd9\u91cc\u3002"
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
                title={\`\${statusLabel} \u00b7 \${resolvedAccountLabel}\`}
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
              <p className="mt-0.5 truncate text-xs text-slate-500">{resolvedAccountLabel}</p>
              {statusHelperText && (
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{statusHelperText}</p>
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
`;

fs.writeFileSync('src/components/AppSidebar.tsx', content, 'utf-8');
console.log('AppSidebar.tsx rewritten successfully');
