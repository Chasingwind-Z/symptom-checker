import type { ComponentType } from 'react';
import {
  ClipboardList,
  MessageSquare,
  User,
} from 'lucide-react';

export const MOBILE_BOTTOM_NAV_HEIGHT = 56;

interface MobileBottomNavProps {
  activePrimaryTab: 'chat' | 'records' | 'profile' | null;
  pendingFollowUpCount: number;
  profileCompletion: number;
  onSelectChat: () => void;
  onSelectRecords: () => void;
  onSelectProfile: () => void;
}

interface TabButtonProps {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  isActive: boolean;
  badge?: string;
  onClick: () => void;
}

function TabButton({ label, icon: Icon, isActive, badge, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-center transition-colors"
    >
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-xl transition-colors ${
          isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
        }`}
      >
        <Icon size={17} />
      </span>
      <span
        className={`text-xs font-medium leading-tight transition-colors ${
          isActive ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        {label}
      </span>
      {badge && (
        <span className="absolute right-3 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export function MobileBottomNav({
  activePrimaryTab,
  pendingFollowUpCount,
  profileCompletion,
  onSelectChat,
  onSelectRecords,
  onSelectProfile,
}: MobileBottomNavProps) {
  const recordsBadge =
    pendingFollowUpCount > 0
      ? `${Math.min(9, pendingFollowUpCount)}${pendingFollowUpCount > 9 ? '+' : ''}`
      : undefined;

  const profileBadge = profileCompletion >= 100 ? undefined : `${profileCompletion}%`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: `${MOBILE_BOTTOM_NAV_HEIGHT}px` }}
    >
      <TabButton
        label="问诊"
        icon={MessageSquare}
        isActive={activePrimaryTab === 'chat'}
        onClick={onSelectChat}
      />
      <TabButton
        label="记录"
        icon={ClipboardList}
        isActive={activePrimaryTab === 'records'}
        badge={recordsBadge}
        onClick={onSelectRecords}
      />
      <TabButton
        label="我的"
        icon={User}
        isActive={activePrimaryTab === 'profile'}
        badge={profileBadge}
        onClick={onSelectProfile}
      />
    </nav>
  );
}
