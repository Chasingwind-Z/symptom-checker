import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { MODEL_TIERS, getUserModelPreference, setUserModelPreference, type ModelTier } from '../lib/modelRouter';

interface ModelSelectorProps {
  currentTier: Exclude<ModelTier, 'auto'>;
  currentReason?: string;
  onChange: (tier: ModelTier) => void;
}

type SelectableTier = ModelTier; // 'auto' | 'flash' | 'pro' | 'omni'

const ALL_OPTIONS: { tier: SelectableTier; emoji: string; label: string; desc: string }[] = [
  { tier: 'auto', emoji: '✨', label: '自动', desc: '智能切换' },
  { tier: 'flash', emoji: '⚡', label: '快速', desc: '简单问题' },
  { tier: 'pro', emoji: '🧠', label: '深度', desc: '复杂判断' },
  { tier: 'omni', emoji: '👁️', label: '多模态', desc: '图片分析' },
];

export function ModelSelector({ currentTier, currentReason, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<ModelTier>(getUserModelPreference);
  const [justSwitched, setJustSwitched] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = () => setPreference(getUserModelPreference());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleOpen = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        bottom: window.innerHeight - rect.top + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(v => !v);
  }, []);

  const handleSelect = (tier: ModelTier) => {
    setPreference(tier);
    setUserModelPreference(tier);
    onChange(tier);
    setOpen(false);
    setJustSwitched(true);
    window.setTimeout(() => setJustSwitched(false), 1500);
  };

  const current = ALL_OPTIONS.find(o => o.tier === preference) ?? ALL_OPTIONS[0];
  const config = MODEL_TIERS[currentTier];

  const menuContent = open && createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={() => setOpen(false)}
      />
      <div
        className="fixed rounded-xl bg-white shadow-xl border border-slate-200 py-1 min-w-[160px]"
        style={{
          zIndex: 9999,
          ...(menuPos ? { bottom: `${menuPos.bottom}px`, right: `${menuPos.right}px` } : {}),
        }}
      >
        {ALL_OPTIONS.map(opt => (
          <button
            key={opt.tier}
            onClick={() => handleSelect(opt.tier)}
            className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${
              preference === opt.tier
                ? 'text-blue-600 bg-blue-50/60'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">{opt.emoji}</span>
              <span>{opt.label}</span>
              <span className="text-xs text-slate-400">{opt.desc}</span>
            </span>
            {preference === opt.tier && <Check size={14} className="text-blue-500 shrink-0" />}
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
        className="flex items-center gap-0.5 shrink-0 rounded-full bg-slate-50 border border-slate-200 pl-2 pr-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors whitespace-nowrap"
        title={currentReason || config.description}
      >
        {current.emoji} {current.label}
        {justSwitched && <span className="text-xs text-emerald-500 ml-0.5">✓</span>}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {menuContent}
    </>
  );
}
