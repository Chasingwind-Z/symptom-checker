import { useState, useCallback } from 'react';

interface BodyPartSelectorProps {
  selected: string[];
  onToggle: (partId: string) => void;
}

type View = 'front' | 'back';

interface OverlayRegion {
  id: string;
  label: string;
  shape: 'ellipse' | 'rect' | 'path';
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  d?: string;
}

/*
 * Professional human body silhouette — anatomically proportioned (≈7.5 heads).
 * Built from composite shapes: ellipse head, smooth bezier torso, tapered limbs.
 * viewBox 0 0 200 450, body centered at x=100.
 */

// Head
const HEAD_ELLIPSE = { cx: 100, cy: 30, rx: 22, ry: 24 };

// Neck
const NECK = 'M92,54 L92,66 C92,68 94,70 100,70 C106,70 108,68 108,66 L108,54';

// Torso (shoulders → waist → hips)
const TORSO =
  'M108,66 C120,68 140,74 148,82' +       // right shoulder slope
  ' L148,82 C152,86 154,92 154,100' +      // right shoulder round
  ' L154,100 L152,180' +                    // right torso side
  ' C150,194 142,204 132,210' +             // right hip curve
  ' C120,218 80,218 68,210' +               // bottom hip arc
  ' C58,204 50,194 48,180' +               // left hip curve
  ' L46,100' +                              // left torso side
  ' C46,92 48,86 52,82' +                  // left shoulder round
  ' C60,74 80,68 92,66';                   // left shoulder slope

// Left arm (viewer's left = body's right)
const LEFT_ARM =
  'M52,82 C46,84 38,88 34,94' +
  ' L22,130 C18,140 16,152 18,158' +
  ' C20,164 26,166 30,162' +
  ' L42,128 C46,118 50,108 52,100 Z';

// Right arm
const RIGHT_ARM =
  'M148,82 C154,84 162,88 166,94' +
  ' L178,130 C182,140 184,152 182,158' +
  ' C180,164 174,166 170,162' +
  ' L158,128 C154,118 150,108 148,100 Z';

// Left leg
const LEFT_LEG =
  'M68,210 C70,216 74,220 80,222' +
  ' L88,222 L92,222' +
  ' C94,260 94,300 92,340' +
  ' L90,380 C89,400 88,418 86,428' +
  ' C84,434 78,438 72,438' +
  ' L64,438 C60,438 58,434 58,428' +
  ' L60,400 C60,380 58,340 56,300' +
  ' C54,260 52,230 48,218' +
  ' C50,214 56,210 68,210 Z';

// Right leg
const RIGHT_LEG =
  'M132,210 C130,216 126,220 120,222' +
  ' L112,222 L108,222' +
  ' C106,260 106,300 108,340' +
  ' L110,380 C111,400 112,418 114,428' +
  ' C116,434 122,438 128,438' +
  ' L136,438 C140,438 142,434 142,428' +
  ' L140,400 C140,380 142,340 144,300' +
  ' C146,260 148,230 152,218' +
  ' C150,214 144,210 132,210 Z';

// Clickable overlay regions (front view)
const FRONT_OVERLAYS: OverlayRegion[] = [
  { id: 'head', label: '头部', shape: 'ellipse', cx: 100, cy: 30, rx: 24, ry: 26 },
  { id: 'throat', label: '咽喉', shape: 'rect', x: 88, y: 54, width: 24, height: 16, rx: 6 },
  { id: 'chest', label: '胸部', shape: 'rect', x: 52, y: 74, width: 96, height: 56, rx: 12 },
  { id: 'abdomen', label: '腹部', shape: 'rect', x: 54, y: 134, width: 92, height: 72, rx: 12 },
  { id: 'limbs-la', label: '左臂', shape: 'path', d: LEFT_ARM },
  { id: 'limbs-ra', label: '右臂', shape: 'path', d: RIGHT_ARM },
  { id: 'limbs-ll', label: '左腿', shape: 'path', d: LEFT_LEG },
  { id: 'limbs-rl', label: '右腿', shape: 'path', d: RIGHT_LEG },
];

const BACK_OVERLAYS: OverlayRegion[] = [
  { id: 'head', label: '头部', shape: 'ellipse', cx: 100, cy: 30, rx: 24, ry: 26 },
  { id: 'back', label: '腰背', shape: 'rect', x: 52, y: 74, width: 96, height: 132, rx: 12 },
  { id: 'limbs-la', label: '左臂', shape: 'path', d: LEFT_ARM },
  { id: 'limbs-ra', label: '右臂', shape: 'path', d: RIGHT_ARM },
  { id: 'limbs-ll', label: '左腿', shape: 'path', d: LEFT_LEG },
  { id: 'limbs-rl', label: '右腿', shape: 'path', d: RIGHT_LEG },
];

function toMainPart(id: string): string {
  if (id.startsWith('limbs')) return 'limbs';
  return id;
}

const PART_LABELS: Record<string, string> = {
  head: '头部', throat: '咽喉', chest: '胸部', abdomen: '腹部',
  back: '腰背', limbs: '四肢', skin: '皮肤', other: '其他',
};

export function BodyPartSelector({ selected, onToggle }: BodyPartSelectorProps) {
  const [view, setView] = useState<View>('front');
  const overlays = view === 'front' ? FRONT_OVERLAYS : BACK_OVERLAYS;

  const isSelected = useCallback(
    (id: string) => {
      const main = toMainPart(id);
      return selected.includes(main) || selected.includes(id);
    },
    [selected],
  );

  const handleClick = useCallback(
    (id: string) => onToggle(toMainPart(id)),
    [onToggle],
  );

  return (
    <div className="flex flex-col items-center">
      {/* View toggle */}
      <div className="flex items-center gap-0.5 mb-3 rounded-full bg-slate-100 p-0.5">
        {(['front', 'back'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              view === v
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {v === 'front' ? '正面' : '背面'}
          </button>
        ))}
      </div>

      {/* SVG body illustration */}
      <svg viewBox="0 0 200 450" className="w-48 h-72 sm:w-56 sm:h-80">
        <defs>
          <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <filter id="bodyShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Silhouette: composite shapes for anatomical accuracy */}
        <g filter="url(#bodyShadow)">
          {/* Head */}
          <ellipse
            cx={HEAD_ELLIPSE.cx} cy={HEAD_ELLIPSE.cy}
            rx={HEAD_ELLIPSE.rx} ry={HEAD_ELLIPSE.ry}
            fill="url(#bodyFill)" stroke="#94A3B8" strokeWidth="1.2"
          />
          {/* Neck */}
          <path d={NECK} fill="url(#bodyFill)" stroke="#94A3B8" strokeWidth="1.2" strokeLinejoin="round" />
          {/* Torso */}
          <path d={TORSO} fill="url(#bodyFill)" stroke="#94A3B8" strokeWidth="1.2" strokeLinejoin="round" />
          {/* Arms */}
          <path d={LEFT_ARM} fill="url(#bodyFill)" stroke="#94A3B8" strokeWidth="1.2" strokeLinejoin="round" />
          <path d={RIGHT_ARM} fill="url(#bodyFill)" stroke="#94A3B8" strokeWidth="1.2" strokeLinejoin="round" />
          {/* Legs */}
          <path d={LEFT_LEG} fill="url(#bodyFill)" stroke="#94A3B8" strokeWidth="1.2" strokeLinejoin="round" />
          <path d={RIGHT_LEG} fill="url(#bodyFill)" stroke="#94A3B8" strokeWidth="1.2" strokeLinejoin="round" />
        </g>

        {/* Clickable overlay regions */}
        {overlays.map(region => {
          const sel = isSelected(region.id);
          const fillColor = sel ? 'rgba(59, 130, 246, 0.3)' : 'transparent';
          const strokeColor = sel ? 'rgba(59, 130, 246, 0.5)' : 'transparent';

          const commonProps = {
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: 1,
            onClick: () => handleClick(region.id),
            className: 'cursor-pointer transition-all duration-150 hover:fill-blue-400/15',
            style: { pointerEvents: 'all' as const },
          };

          if (region.shape === 'ellipse') {
            return (
              <ellipse
                key={region.id}
                cx={region.cx} cy={region.cy}
                rx={region.rx} ry={region.ry}
                {...commonProps}
              />
            );
          }
          if (region.shape === 'rect') {
            return (
              <rect
                key={region.id}
                x={region.x} y={region.y}
                width={region.width} height={region.height}
                rx={region.rx ?? 0}
                {...commonProps}
              />
            );
          }
          if (region.shape === 'path') {
            return <path key={region.id} d={region.d} {...commonProps} />;
          }
          return null;
        })}
      </svg>

      {/* Extra chips */}
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
