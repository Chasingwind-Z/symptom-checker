import { useState, useCallback } from 'react';

interface BodyPartSelectorProps {
  selected: string[];
  onToggle: (partId: string) => void;
}

type View = 'front' | 'back';

// Overlay regions as % of image dimensions
// Adjusted for the Wikimedia Goran_tek-en male body SVGs (viewBox ~403x946)
const FRONT_REGIONS = [
  { id: 'head', label: '头部', top: 0, left: 33, width: 34, height: 9 },
  { id: 'throat', label: '咽喉', top: 9, left: 40, width: 20, height: 3.5 },
  { id: 'chest', label: '胸部', top: 13, left: 28, width: 44, height: 12 },
  { id: 'abdomen', label: '腹部', top: 25, left: 30, width: 40, height: 12 },
  { id: 'limbs-la', label: '左臂', top: 13, left: 10, width: 18, height: 25 },
  { id: 'limbs-ra', label: '右臂', top: 13, left: 72, width: 18, height: 25 },
  { id: 'limbs-ll', label: '左腿', top: 42, left: 25, width: 22, height: 45 },
  { id: 'limbs-rl', label: '右腿', top: 42, left: 53, width: 22, height: 45 },
];

const BACK_REGIONS = [
  { id: 'head', label: '头部', top: 0, left: 33, width: 34, height: 9 },
  { id: 'back', label: '腰背', top: 12, left: 28, width: 44, height: 26 },
  { id: 'limbs-la', label: '左臂', top: 13, left: 10, width: 18, height: 25 },
  { id: 'limbs-ra', label: '右臂', top: 13, left: 72, width: 18, height: 25 },
  { id: 'limbs-ll', label: '左腿', top: 42, left: 25, width: 22, height: 45 },
  { id: 'limbs-rl', label: '右腿', top: 42, left: 53, width: 22, height: 45 },
];

const PART_LABELS: Record<string, string> = {
  head: '头部', throat: '咽喉', chest: '胸部', abdomen: '腹部',
  back: '腰背', limbs: '四肢', skin: '皮肤', other: '其他',
};

function toMainPart(id: string): string {
  if (id.startsWith('limbs')) return 'limbs';
  return id;
}

export function BodyPartSelector({ selected, onToggle }: BodyPartSelectorProps) {
  const [view, setView] = useState<View>('front');
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;

  const isSelected = useCallback((id: string) => {
    const main = toMainPart(id);
    return selected.includes(main) || selected.includes(id);
  }, [selected]);

  const handleClick = useCallback((id: string) => {
    onToggle(toMainPart(id));
  }, [onToggle]);

  return (
    <div className="flex flex-col items-center">
      {/* View toggle */}
      <div className="flex items-center gap-0.5 mb-3 rounded-full bg-slate-100 p-0.5">
        {(['front', 'back'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {v === 'front' ? '正面' : '背面'}
          </button>
        ))}
      </div>

      {/* Body image + overlay */}
      <div className="relative w-48 h-[380px] sm:w-56 sm:h-[440px] mx-auto select-none">
        {/* Wikimedia Goran_tek-en professional medical illustration */}
        <img
          src={`/assets/body/male-${view}.svg`}
          alt={view === 'front' ? '人体正面' : '人体背面'}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Clickable overlay regions */}
        {regions.map(region => {
          const sel = isSelected(region.id);
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => handleClick(region.id)}
              className="absolute rounded-lg transition-all duration-150"
              style={{
                top: `${region.top}%`,
                left: `${region.left}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
                backgroundColor: sel
                  ? 'rgba(59, 130, 246, 0.3)'
                  : 'transparent',
                border: sel
                  ? '2px solid rgba(59, 130, 246, 0.6)'
                  : '1px solid transparent',
              }}
              title={region.label}
              aria-label={region.label}
              onMouseEnter={(e) => {
                if (!sel) {
                  (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                  (e.target as HTMLElement).style.border = '1px solid rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!sel) {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLElement).style.border = '1px solid transparent';
                }
              }}
            />
          );
        })}
      </div>

      {/* Extra chips: skin + other */}
      <div className="flex gap-2 mt-3">
        {[
          { id: 'skin', label: '皮肤（全身）' },
          { id: 'other', label: '其他部位' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`rounded-full border px-4 py-1.5 text-xs transition-all ${
              selected.includes(item.id)
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <p className="text-xs text-blue-600 mt-2">
          已选：{selected.map(id => PART_LABELS[id] || id).join(' · ')}
        </p>
      )}
    </div>
  );
}