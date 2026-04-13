import { useState } from 'react';

interface BodyPartSelectorProps {
  selected: string[];
  onToggle: (partId: string) => void;
}

type View = 'front' | 'back';

interface BodyPart {
  id: string;
  label: string;
  shape: 'ellipse' | 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  labelX: number;
  labelY: number;
}

const PARTS_FRONT: BodyPart[] = [
  { id: 'head',        label: '头部', shape: 'ellipse', x: 150, y: 40,  w: 25, h: 30, labelX: 150, labelY: 44 },
  { id: 'throat',      label: '咽喉', shape: 'rect',    x: 140, y: 72,  w: 20, h: 20, rx: 4, labelX: 150, labelY: 86 },
  { id: 'chest',       label: '胸部', shape: 'rect',    x: 115, y: 95,  w: 70, h: 55, rx: 6, labelX: 150, labelY: 126 },
  { id: 'abdomen',     label: '腹部', shape: 'rect',    x: 118, y: 155, w: 64, h: 60, rx: 6, labelX: 150, labelY: 189 },
  { id: 'limbs-arm-l', label: '左臂', shape: 'rect',    x: 75,  y: 98,  w: 36, h: 100, rx: 10, labelX: 93,  labelY: 150 },
  { id: 'limbs-arm-r', label: '右臂', shape: 'rect',    x: 189, y: 98,  w: 36, h: 100, rx: 10, labelX: 207, labelY: 150 },
  { id: 'limbs-leg-l', label: '左腿', shape: 'rect',    x: 120, y: 220, w: 28, h: 115, rx: 8, labelX: 134, labelY: 280 },
  { id: 'limbs-leg-r', label: '右腿', shape: 'rect',    x: 152, y: 220, w: 28, h: 115, rx: 8, labelX: 166, labelY: 280 },
];

const PARTS_BACK: BodyPart[] = [
  { id: 'head',        label: '头部', shape: 'ellipse', x: 150, y: 40,  w: 25, h: 30, labelX: 150, labelY: 44 },
  { id: 'back-upper',  label: '上背', shape: 'rect',    x: 115, y: 95,  w: 70, h: 55, rx: 6, labelX: 150, labelY: 126 },
  { id: 'back-lower',  label: '腰背', shape: 'rect',    x: 118, y: 155, w: 64, h: 60, rx: 6, labelX: 150, labelY: 189 },
  { id: 'limbs-arm-l', label: '左臂', shape: 'rect',    x: 75,  y: 98,  w: 36, h: 100, rx: 10, labelX: 93,  labelY: 150 },
  { id: 'limbs-arm-r', label: '右臂', shape: 'rect',    x: 189, y: 98,  w: 36, h: 100, rx: 10, labelX: 207, labelY: 150 },
  { id: 'limbs-leg-l', label: '左腿', shape: 'rect',    x: 120, y: 220, w: 28, h: 115, rx: 8, labelX: 134, labelY: 280 },
  { id: 'limbs-leg-r', label: '右腿', shape: 'rect',    x: 152, y: 220, w: 28, h: 115, rx: 8, labelX: 166, labelY: 280 },
];

function toMainPart(id: string): string {
  if (id.startsWith('limbs')) return 'limbs';
  if (id === 'back-upper' || id === 'back-lower') return 'back';
  return id;
}

export function BodyPartSelector({ selected, onToggle }: BodyPartSelectorProps) {
  const [view, setView] = useState<View>('front');
  const parts = view === 'front' ? PARTS_FRONT : PARTS_BACK;

  const isSelected = (id: string) => {
    const main = toMainPart(id);
    return selected.includes(main) || selected.includes(id);
  };

  const handleClick = (id: string) => {
    onToggle(toMainPart(id));
  };

  return (
    <div className="flex flex-col items-center">
      {/* View toggle */}
      <div className="flex items-center gap-1 mb-2 rounded-full bg-slate-100 p-0.5">
        <button
          onClick={() => setView('front')}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            view === 'front' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
          }`}
        >
          正面
        </button>
        <button
          onClick={() => setView('back')}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            view === 'back' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
          }`}
        >
          背面
        </button>
      </div>

      {/* SVG Body */}
      <svg viewBox="0 0 300 350" className="w-60 h-80 sm:w-72 sm:h-96">
        {/* Neck connector line */}
        <line x1="150" y1="70" x2="150" y2="95" stroke="#CBD5E1" strokeWidth="1.5" />

        {/* Clickable regions */}
        {parts.map(part => {
          const active = isSelected(part.id);
          const fill = active ? '#3B82F6' : '#F1F5F9';
          const stroke = active ? '#2563EB' : '#94A3B8';
          return (
            <g key={part.id} onClick={() => handleClick(part.id)} className="cursor-pointer">
              {part.shape === 'ellipse' ? (
                <ellipse
                  cx={part.x}
                  cy={part.y}
                  rx={part.w}
                  ry={part.h}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="1.5"
                  className="transition-colors hover:fill-blue-100"
                />
              ) : (
                <rect
                  x={part.x}
                  y={part.y}
                  width={part.w}
                  height={part.h}
                  rx={part.rx ?? 4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="1.5"
                  className="transition-colors hover:fill-blue-100"
                />
              )}
              <text
                x={part.labelX}
                y={part.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-xs pointer-events-none select-none ${active ? 'fill-white' : 'fill-slate-500'}`}
                fontSize="11"
              >
                {part.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Extra chips: skin + other */}
      <div className="flex gap-2 mt-2">
        {(['skin', 'other'] as const).map(id => {
          const label = id === 'skin' ? '🖐️ 皮肤' : '❓ 其他';
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                selected.includes(id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <p className="text-xs text-blue-600 mt-2">
          已选：{selected.map(id => {
            const labels: Record<string, string> = { head: '头部', throat: '咽喉', chest: '胸部', abdomen: '腹部', back: '腰背', limbs: '四肢', skin: '皮肤', other: '其他' };
            return labels[id] || id;
          }).join('、')}
        </p>
      )}
    </div>
  );
}
