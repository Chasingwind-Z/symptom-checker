import { useState } from 'react';
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

  const handleSelect = (tier: ModelTier) => {
    setPreference(tier);
    setUserModelPreference(tier);
    onChange(tier);
    setOpen(false);
  };

  const config = MODEL_TIERS[currentTier];

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => setOpen(!open)}
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
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[180px] z-50">
            {/* Auto option */}
            <button
              onClick={() => handleSelect('auto')}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-slate-50 ${
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
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-slate-50 ${
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
          </div>
        </>
      )}
    </div>
  );
}
