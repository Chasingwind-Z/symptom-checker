import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Download,
  MapPin,
  RefreshCw,
  Stethoscope,
} from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onToggleMap?: () => void;
  sessionEmail?: string | null;
  cloudMode?: 'local' | 'cloud-ready' | 'cloud-session' | 'error';
  onInstallApp?: () => void;
  canInstallApp?: boolean;
  isAppInstalled?: boolean;
}

export function Header({
  onReset,
  onToggleMap,
  sessionEmail,
  cloudMode = 'local',
  onInstallApp,
  canInstallApp = false,
  isAppInstalled = false,
}: HeaderProps) {
  const isSignedIn = Boolean(sessionEmail);
  const accountLabel = isSignedIn
    ? sessionEmail
    : cloudMode === 'cloud-ready'
      ? '可邮箱登录同步'
      : cloudMode === 'error'
        ? '云端读取异常'
        : '本机模式';
  const accountClassName = isSignedIn
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : cloudMode === 'cloud-ready'
      ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
      : cloudMode === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <div className="bg-blue-500 rounded-xl p-1.5">
          <Stethoscope size={16} className="text-white" />
        </div>
        <span className="text-slate-800 font-semibold text-lg">健康助手</span>
        <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs px-2 py-0.5 rounded-full">
          AI 驱动
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`hidden md:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs ${accountClassName}`}
          title={isSignedIn ? '当前云端登录状态' : '当前同步模式'}
        >
          {isSignedIn ? <Cloud size={13} /> : <CloudOff size={13} />}
          <span className="max-w-[180px] truncate">{accountLabel}</span>
        </div>
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
