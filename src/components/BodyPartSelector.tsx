import { useState, useCallback } from 'react';

interface BodyPartSelectorProps {
  selected: string[];
  onToggle: (partId: string) => void;
}

type View = 'front' | 'back';

// Human body outline SVG path (front view) — holographic glow style
const FRONT_BODY_PATH = `
  M 120 20
  C 140 20, 150 35, 150 55
  C 150 70, 145 80, 140 85
  L 145 95
  L 155 105
  L 170 110
  L 180 130
  L 185 170
  L 180 210
  L 200 250
  L 210 310
  L 205 340
  L 195 330
  L 180 280
  L 175 240
  L 170 250
  L 168 320
  L 165 380
  L 160 440
  L 155 455
  L 140 455
  L 138 380
  L 135 310
  L 130 240
  L 125 240
  L 120 310
  L 115 380
  L 112 455
  L 100 455
  L 95 440
  L 90 380
  L 87 320
  L 85 250
  L 80 240
  L 75 280
  L 60 330
  L 50 340
  L 45 310
  L 55 250
  L 70 210
  L 70 170
  L 75 130
  L 90 110
  L 100 105
  L 110 95
  L 115 85
  C 110 80, 105 70, 105 55
  C 105 35, 115 20, 120 20
  Z
`;

// TODO: 背面轮廓暂时复用正面，视觉上差别不大
//       后续单独绘制背面 path
const BACK_BODY_PATH = FRONT_BODY_PATH;

// Body part clickable zones
const BODY_PART_ZONES = [
  { id: 'head',     cx: 128, cy: 50,  rx: 25, ry: 30, label: '头部' },
  { id: 'throat',   cx: 128, cy: 95,  rx: 12, ry: 8,  label: '咽喉' },
  { id: 'chest',    cx: 128, cy: 150, rx: 45, ry: 35, label: '胸部' },
  { id: 'abdomen',  cx: 128, cy: 220, rx: 40, ry: 35, label: '腹部' },
  { id: 'leftArm',  cx: 65,  cy: 200, rx: 20, ry: 65, label: '左臂' },
  { id: 'rightArm', cx: 190, cy: 200, rx: 20, ry: 65, label: '右臂' },
  { id: 'leftLeg',  cx: 100, cy: 370, rx: 25, ry: 75, label: '左腿' },
  { id: 'rightLeg', cx: 155, cy: 370, rx: 25, ry: 75, label: '右腿' },
] as const;

const BACK_ZONES = [
  { id: 'head',     cx: 128, cy: 50,  rx: 25, ry: 30, label: '头部' },
  { id: 'back',     cx: 128, cy: 180, rx: 50, ry: 70, label: '腰背' },
  { id: 'leftArm',  cx: 65,  cy: 200, rx: 20, ry: 65, label: '左臂' },
  { id: 'rightArm', cx: 190, cy: 200, rx: 20, ry: 65, label: '右臂' },
  { id: 'leftLeg',  cx: 100, cy: 370, rx: 25, ry: 75, label: '左腿' },
  { id: 'rightLeg', cx: 155, cy: 370, rx: 25, ry: 75, label: '右腿' },
] as const;

const PART_LABELS: Record<string, string> = {
  head: '头部', throat: '咽喉', chest: '胸部', abdomen: '腹部',
  back: '腰背', limbs: '四肢', leftArm: '左臂', rightArm: '右臂',
  leftLeg: '左腿', rightLeg: '右腿', skin: '皮肤', other: '其他',
};

function toMainPart(id: string): string {
  if (id === 'leftArm' || id === 'rightArm' || id === 'leftLeg' || id === 'rightLeg') return 'limbs';
  return id;
}

export function BodyPartSelector({ selected, onToggle }: BodyPartSelectorProps) {
  const [view, setView] = useState<View>('front');
  const zones = view === 'front' ? BODY_PART_ZONES : BACK_ZONES;
  const bodyPath = view === 'front' ? FRONT_BODY_PATH : BACK_BODY_PATH;

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
      <div className="flex gap-2 mb-4">
        {(['front', 'back'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              view === v
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-100 text-slate-500 hover:text-slate-700'
            }`}
          >
            {v === 'front' ? '正面' : '背面'}
          </button>
        ))}
      </div>

      {/* Holographic glow body SVG */}
      <div className="relative">
        <svg
          viewBox="0 0 256 480"
          className="w-[220px] h-[400px] sm:w-[240px] sm:h-[450px]"
          style={{ filter: 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.35))' }}
        >
          <defs>
            <filter id="bodyGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="zoneGlow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Body outline — holographic glow */}
          <path
            d={bodyPath}
            fill="rgba(59, 130, 246, 0.03)"
            stroke="url(#strokeGrad)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#bodyGlow)"
          />

          {/* Clickable zone overlays */}
          {zones.map(zone => {
            const sel = isSelected(zone.id);
            return (
              <ellipse
                key={zone.id}
                cx={zone.cx}
                cy={zone.cy}
                rx={zone.rx}
                ry={zone.ry}
                fill={sel ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}
                stroke={sel ? 'rgba(96, 165, 250, 0.8)' : 'transparent'}
                strokeWidth={sel ? 1.5 : 0}
                className="cursor-pointer transition-all duration-200 hover:fill-blue-400/15"
                onClick={() => handleClick(zone.id)}
                filter={sel ? 'url(#zoneGlow)' : undefined}
              >
                <title>{zone.label}</title>
              </ellipse>
            );
          })}
        </svg>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 justify-center max-w-xs">
          {selected.map(id => (
            <span
              key={id}
              className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
            >
              {PART_LABELS[id] || id}
            </span>
          ))}
        </div>
      )}

      {/* Skin / Other chips */}
      <div className="flex gap-2 mt-4">
        {[
          { id: 'skin', label: '皮肤（全身）' },
          { id: 'other', label: '其他部位' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`rounded-full border px-4 py-1.5 text-xs transition-all ${
              selected.includes(item.id)
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm shadow-blue-200'
                : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}