import {
  CheckCircle2,
  Download,
  LayoutGrid,
  LogIn,
  MapPin,
  Plus,
  Settings2,
  Stethoscope,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onReset: () => void;
  onOpenWorkspace?: () => void;
  onToggleMap?: () => void;
  onOpenAuth?: () => void;
  onOpenSettings?: () => void;
  sessionEmail?: string | null;
  currentView?: 'home' | 'chat' | 'workspace';
  onInstallApp?: () => void;
  canInstallApp?: boolean;
  isAppInstalled?: boolean;
}

export function Header({
  title,
  subtitle,
  onReset,
  onOpenWorkspace,
  onToggleMap,
  onOpenAuth,
  onOpenSettings,
  sessionEmail,
  currentView = 'home',
  onInstallApp,
  canInstallApp = false,
  isAppInstalled = false,
}: HeaderProps) {
  const isSignedIn = Boolean(sessionEmail);
  const contextLabel =
    currentView === 'workspace' ? '健康空间' : currentView === 'chat' ? '当前问诊' : '症状自查';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <div className="rounded-lg bg-blue-500 p-1 text-white lg:hidden">
              <Stethoscope size={12} />
            </div>
            <span>{contextLabel}</span>
          </div>
          <h1 className="mt-0.5 truncate text-base font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="hidden truncate text-xs text-slate-500 md:block">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
