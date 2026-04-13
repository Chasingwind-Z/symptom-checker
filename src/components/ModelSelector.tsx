import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Brain, Eye, Sparkles } from 'lucide-react';
import { MODEL_TIERS, getUserModelPreference, setUserModelPreference, type ModelTier } from '../lib/modelRouter';

const TIER_ICONS: Record<string, React.ReactNode> = {
  flash: <Zap size={12} />,
  pro: <Brain size={12} />,
  omni: <Eye size={12} />,
};

interface ModelSelectorProps {
  currentTier: Exclude<ModelTier, 'auto'>;
  currentReason?: string;
  onChange: (tier: ModelTier) => void;
}

export function ModelSelector({ currentTier, currentReason, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<ModelTier>(getUserModelPreference);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Sync preference from localStorage on mount (in case changed elsewhere)
  useEffect(() => {
    const handler = () => setPreference(getUserModelPreference());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(v => !v);
  }, []);

  const handleSelect = (tier: ModelTier) => {
    setPreference(tier);
    setUserModelPreference(tier);
    onChange(tier);
    setOpen(false);
  };

  const config = MODEL_TIERS[currentTier];
  const displayConfig = preference === 'auto'
    ? config
    : MODEL_TIERS[preference as Exclude<ModelTier, 'auto'>] ?? config;
  const displayLabel = preference === 'auto'
    ? `${config.emoji} 自动`
    : `${displayConfig.emoji} ${displayConfig.label}`;

  const menuContent = open && createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={() => setOpen(false)}
      />
      {/* Bottom sheet menu */}
      <div
        className="fixed inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl border border-slate-200 p-4 pb-8"
        style={{ zIndex: 9999 }}
      >
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

        {/* Auto option */}
        <button
          onClick={() => handleSelect('auto')}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm ${
            preference === 'auto' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sparkles size={16} className="text-blue-400 shrink-0" />
          <div className="text-left">
            <p className="font-medium">自动选择</p>
            <p className="text-xs text-slate-400 mt-0.5">根据场景智能切换模型</p>
          </div>
        </button>

        <div className="h-px bg-slate-100 my-1.5" />

        {/* Manual options */}
        {(Object.entries(MODEL_TIERS) as [Exclude<ModelTier, 'auto'>, typeof MODEL_TIERS[keyof typeof MODEL_TIERS]][]).map(([tier, cfg]) => (
          <button
            key={tier}
            onClick={() => handleSelect(tier)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm ${
              preference === tier ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="shrink-0">{TIER_ICONS[tier]}</span>
            <div className="text-left">
              <p className="font-medium">{cfg.emoji} {cfg.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{cfg.description}</p>
            </div>
          </button>
        ))}
      </div>
    </>,
    document.body,
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1 shrink-0 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors whitespace-nowrap"
        title={currentReason || config.description}
      >
        {displayLabel}
        {preference === 'auto' && (
          <Sparkles size={10} className="text-blue-400" />
        )}
      </button>
      {menuContent}
    </>
  );
}
