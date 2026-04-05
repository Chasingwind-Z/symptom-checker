import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Download,
  LayoutGrid,
  MapPin,
  RefreshCw,
  Stethoscope,
  UserRound,
} from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenHome?: () => void;
  onOpenWorkspace?: () => void;
  onToggleMap?: () => void;
  sessionEmail?: string | null;
  cloudMode?: 'local' | 'cloud-ready' | 'cloud-session' | 'error';
  currentView?: 'home' | 'chat' | 'workspace';
  onInstallApp?: () => void;
  canInstallApp?: boolean;
  isAppInstalled?: boolean;
}

export function Header({
  onReset,
  onOpenHome,
  onOpenWorkspace,
  onToggleMap,
  sessionEmail,
  cloudMode = 'local',
  currentView = 'home',
  onInstallApp,
  canInstallApp = false,
  isAppInstalled = false,
}: HeaderProps) {
  const isSignedIn = Boolean(sessionEmail);
  const accountLabel = isSignedIn
    ? '同步已开启'
    : cloudMode === 'cloud-ready'
      ? '可开启同步'
      : cloudMode === 'error'
        ? '当前使用本机记录'
        : '本机模式';
  const accountClassName = isSignedIn
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : cloudMode === 'cloud-ready'
      ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
    : cloudMode === 'error'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <div className="bg-blue-500 rounded-xl p-1.5">
          <Stethoscope size={16} className="text-white" />
        </div>
        <span className="text-slate-800 font-semibold text-lg">健康助手</span>
        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2 py-0.5 rounded-full">
          症状自查
        </span>
      </div>
      <div className="flex items-center gap-2">
        {(onOpenHome || onOpenWorkspace) && (
          <div className="hidden md:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {onOpenHome && (
              <button
                onClick={onOpenHome}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    currentView === 'workspace'
                    ? 'text-slate-600 hover:bg-white'
                    : 'bg-white text-slate-800 shadow-sm'
                }`}
              >
                <LayoutGrid size={13} />
                开始问诊
              </button>
            )}
            {onOpenWorkspace && (
              <button
                onClick={onOpenWorkspace}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                  currentView === 'workspace'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <UserRound size={13} />
                健康空间
              </button>
            )}
          </div>
        )}
        <div
          className={`hidden md:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs ${accountClassName}`}
          title={isSignedIn ? '当前云端登录状态' : '当前同步模式'}
        >
          {isSignedIn ? <Cloud size={13} /> : <CloudOff size={13} />}
          <span className="max-w-[180px] truncate">{isSignedIn ? sessionEmail : accountLabel}</span>
        </div>
        {onOpenWorkspace && (
          <button
            onClick={onOpenWorkspace}
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            title="健康空间"
          >
            <UserRound size={15} />
          </button>
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
            className="flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 border border-blue-200 rounded-xl px-3 py-1.5 text-sm transition-colors"
          >
            <Download size={14} />
            <span className="hidden sm:inline">安装应用</span>
            <span className="sm:hidden">安装</span>
          </button>
        )}
        {onToggleMap && (
          <button
            onClick={onToggleMap}
            className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 border border-emerald-200 rounded-xl px-3 py-1.5 text-sm transition-colors"
          >
            <MapPin size={14} />
            疾病地图
          </button>
        )}
        <button
          onClick={onReset}
          className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-slate-100"
          title="重置对话"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </header>
  );
}
