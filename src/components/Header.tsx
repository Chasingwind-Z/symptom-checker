import {
  CheckCircle2,
  Download,
  LayoutGrid,
  LogIn,
  MapPin,
  Menu,
  Plus,
  Settings2,
  Stethoscope,
} from 'lucide-react';
import type { RiskLevel } from '../types';

const RISK_CHIP: Record<RiskLevel, { style: string; label: string }> = {
  green: { style: 'border-emerald-200 bg-emerald-50 text-emerald-700', label: '低风险' },
  yellow: { style: 'border-amber-200 bg-amber-50 text-amber-700', label: '建议就诊' },
  orange: { style: 'border-orange-200 bg-orange-50 text-orange-700', label: '今日处理' },
  red: { style: 'border-red-200 bg-red-50 text-red-700', label: '紧急' },
};

interface HeaderProps {
  title: string;
  subtitle?: string;
  onReset: () => void;
  onOpenWorkspace?: () => void;
  onToggleMap?: () => void;
  onOpenAuth?: () => void;
  onOpenSettings?: () => void;
  onOpenMenu?: () => void;
  sessionEmail?: string | null;
  currentView?: 'home' | 'chat' | 'workspace';
  onInstallApp?: () => void;
  canInstallApp?: boolean;
  isAppInstalled?: boolean;
  diagnosisRiskLevel?: RiskLevel | null;
}

export function Header({
  title,
  subtitle,
  onReset,
  onOpenWorkspace,
  onToggleMap,
  onOpenAuth,
  onOpenSettings,
  onOpenMenu,
  sessionEmail,
  currentView = 'home',
  onInstallApp,
  canInstallApp = false,
  isAppInstalled = false,
  diagnosisRiskLevel = null,
}: HeaderProps) {
  const isSignedIn = Boolean(sessionEmail);
  const contextLabel =
    currentView === 'workspace' ? '健康空间' : currentView === 'chat' ? '当前问诊' : '症状自查';
  const riskChip = currentView === 'chat' && diagnosisRiskLevel ? RISK_CHIP[diagnosisRiskLevel] : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2 min-w-0">
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="flex-shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="打开菜单"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="rounded-lg bg-blue-500 p-1 text-white lg:hidden">
              <Stethoscope size={12} />
            </div>
            <span>{contextLabel}</span>
          </div>
          <h1 className="mt-0.5 max-w-[180px] truncate text-base font-semibold text-slate-900 sm:max-w-none">{title}</h1>
          {subtitle && <p className="hidden truncate text-xs text-slate-500 md:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {riskChip && (
            <span
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium ${riskChip.style}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {riskChip.label}
            </span>
          )}
          {isAppInstalled && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
              <CheckCircle2 size={13} />
              已安装
            </span>
          )}
          {canInstallApp && onInstallApp && !isAppInstalled && (
            <button
              onClick={onInstallApp}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-500/15 px-3 py-1.5 text-sm text-blue-600 transition-colors hover:bg-blue-500/25"
            >
              <Download size={14} />
              <span className="hidden sm:inline">安装</span>
            </button>
          )}
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 transition-colors hover:bg-emerald-100 lg:hidden"
            >
              <MapPin size={14} />
              <span className="hidden sm:inline">地图</span>
            </button>
          )}
          {onOpenAuth && !isSignedIn && (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm text-cyan-700 transition-colors hover:bg-cyan-100"
            >
              <LogIn size={14} />
              <span className="hidden sm:inline">登录 / 注册</span>
            </button>
          )}
          {onOpenAuth && isSignedIn && (
            <button
              onClick={onOpenAuth}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
            >
              管理账号
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
            >
              <Settings2 size={14} />
              <span className="hidden sm:inline">设置</span>
            </button>
          )}
          {onOpenWorkspace && currentView !== 'workspace' && (
            <button
              onClick={onOpenWorkspace}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">记录</span>
            </button>
          )}
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 lg:hidden"
            title="新建问诊"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">新建问诊</span>
          </button>
        </div>
      </div>
    </header>
  );
}
