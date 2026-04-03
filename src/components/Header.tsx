import { RefreshCw, Stethoscope, MapPin } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onToggleMap?: () => void;
}

export function Header({ onReset, onToggleMap }: HeaderProps) {
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
