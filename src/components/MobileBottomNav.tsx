import type { ComponentType } from 'react';
import {
  ClipboardList,
  HeartPulse,
  History,
  LogIn,
  MapPin,
  MoreHorizontal,
  Pill,
  Search,
  Settings2,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react';
import { useState } from 'react';

export const MOBILE_BOTTOM_NAV_HEIGHT = 56;

interface MobileBottomNavProps {
  activePrimaryTab: 'chat' | 'search' | 'records' | 'profile' | null;
  pendingFollowUpCount: number;
  profileCompletion: number;
  medicationBadge?: string;
  currentCity?: string | null;
  authActionLabel: string;
  onSelectChat: () => void;
  onSelectSearch: () => void;
  onSelectEvidence: () => void;
  onSelectRecords: () => void;
  onSelectProfile: () => void;
  onSelectHistory: () => void;
  onSelectMedication: () => void;
  onOpenMap: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
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

interface SheetItemProps {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  onClick: () => void;
}

function SheetItem({ label, icon: Icon, badge, onClick }: SheetItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500">
        <Icon size={16} />
      </span>
      <span className="flex-1 text-sm font-medium text-slate-800">{label}</span>
      {badge && (
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
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
  medicationBadge,
  currentCity,
  authActionLabel,
  onSelectChat,
  onSelectSearch,
  onSelectEvidence,
  onSelectRecords,
  onSelectProfile,
  onSelectHistory,
  onSelectMedication,
  onOpenMap,
  onOpenSettings,
  onOpenAuth,
}: MobileBottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const recordsBadge =
    pendingFollowUpCount > 0
      ? `${Math.min(9, pendingFollowUpCount)}${pendingFollowUpCount > 9 ? '+' : ''}`
      : undefined;

  const profileBadge = profileCompletion >= 100 ? undefined : `${profileCompletion}%`;

  const handleMoreItem = (handler: () => void) => {
    setIsMoreOpen(false);
    handler();
  };

  return (
    <>
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {isMoreOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-slate-200 bg-white px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 shadow-2xl lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">更多功能</p>
            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              aria-label="关闭"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-1">
            <SheetItem
              label="为什么这样建议"
              icon={ShieldCheck}
              onClick={() => handleMoreItem(onSelectEvidence)}
            />
            <SheetItem
              label="历史问诊"
              icon={History}
              onClick={() => handleMoreItem(onSelectHistory)}
            />
            <SheetItem
              label="服务入口"
              icon={Pill}
              badge={medicationBadge}
              onClick={() => handleMoreItem(onSelectMedication)}
            />
            <SheetItem
              label="健康地图"
              icon={MapPin}
              badge={currentCity ?? undefined}
              onClick={() => handleMoreItem(onOpenMap)}
            />
            <SheetItem
              label="偏好设置"
              icon={Settings2}
              onClick={() => handleMoreItem(onOpenSettings)}
            />
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <SheetItem
              label={authActionLabel}
              icon={LogIn}
              onClick={() => handleMoreItem(onOpenAuth)}
            />
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: `${MOBILE_BOTTOM_NAV_HEIGHT}px` }}
      >
        <TabButton
          label="问诊"
          icon={Stethoscope}
          isActive={activePrimaryTab === 'chat'}
          onClick={onSelectChat}
        />
        <TabButton
          label="搜索"
          icon={Search}
          isActive={activePrimaryTab === 'search'}
          onClick={onSelectSearch}
        />
        <TabButton
          label="记录"
          icon={ClipboardList}
          isActive={activePrimaryTab === 'records'}
          badge={recordsBadge}
          onClick={onSelectRecords}
        />
        <TabButton
          label="档案"
          icon={HeartPulse}
          isActive={activePrimaryTab === 'profile'}
          badge={profileBadge}
          onClick={onSelectProfile}
        />
        <TabButton
          label="更多"
          icon={MoreHorizontal}
          isActive={isMoreOpen}
          onClick={() => setIsMoreOpen((prev) => !prev)}
        />
      </nav>
    </>
  );
}
