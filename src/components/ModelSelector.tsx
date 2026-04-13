import { useState, useRef, useCallback } from 'react';
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
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = useCallback(() => {
    if (btnRef.current && !isMobile) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
      });
    }
    setOpen(v => !v);
  }, [isMobile]);

  const handleSelect = (tier: ModelTier) => {
    setPreference(tier);
    setUserModelPreference(tier);
    onChange(tier);
    setOpen(false);
  };

  const config = MODEL_TIERS[currentTier];

  const menuItems = (
    <>
      {/* Auto option */}
      <button
        onClick={() => handleSelect('auto')}
        className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-slate-50 ${
          preference === 'auto' ? 'text-blue-600 font-medium' : 'text-slate-700'
        }`}
      >
        <Sparkles size={13} className="text-blue-400" />
        <div className="text-left">
          <p className="font-medium">自动选择</p>
          <p className="text-slate-400">根据场景智能切换</p>
        </div>
      </button>

      <div className="h-px bg-slate-100 my-0.5" />

      {/* Manual options */}
      {(Object.entries(MODEL_TIERS) as [Exclude<ModelTier, 'auto'>, typeof MODEL_TIERS[keyof typeof MODEL_TIERS]][]).map(([tier, cfg]) => (
        <button
          key={tier}
          onClick={() => handleSelect(tier)}
          className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-slate-50 ${
            preference === tier ? 'text-blue-600 font-medium' : 'text-slate-700'
          }`}
        >
          {TIER_ICONS[tier]}
          <div className="text-left">
            <p className="font-medium">{cfg.emoji} {cfg.label}</p>
            <p className="text-slate-400">{cfg.description}</p>
          </div>
        </button>
      ))}
    </>
  );

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
        title={currentReason || config.description}
      >
        {config.emoji} {config.label}
        {preference === 'auto' && (
          <Sparkles size={10} className="text-blue-400" />
        )}
      </button>

      {open && (
        <>
          <div
            className={`fixed inset-0 z-[80] ${isMobile ? 'bg-black/20' : ''}`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`fixed z-[80] bg-white shadow-2xl border border-slate-200 ${
              isMobile
                ? 'inset-x-0 bottom-0 rounded-t-2xl p-4 pb-8'
                : 'rounded-xl py-1.5 min-w-[220px] max-h-[50vh] overflow-y-auto'
            }`}
            style={!isMobile && menuPos ? { bottom: `${menuPos.bottom}px`, left: `${menuPos.left}px` } : undefined}
          >
            {isMobile && <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />}
            {menuItems}
          </div>
        </>
      )}
    </div>
  );
}
