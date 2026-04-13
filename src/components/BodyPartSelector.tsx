import { useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';

interface BodyPartSelectorProps {
  selected: string[];
  onToggle: (partId: string) => void;
}

type View = 'front' | 'back';

interface BodyRegion {
  id: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
}

const FRONT_REGIONS: BodyRegion[] = [
  {
    id: 'head',
    label: '头部',
    path: 'M120,12 C120,5 132,0 144,0 C156,0 168,5 168,12 L168,40 C168,52 156,60 144,60 C132,60 120,52 120,40 Z',
    labelX: 195, labelY: 30,
  },
  {
    id: 'throat',
    label: '咽喉',
    path: 'M134,60 L154,60 L156,78 L132,78 Z',
    labelX: 195, labelY: 70,
  },
  {
    id: 'chest',
    label: '胸部',
    path: 'M108,82 C108,78 125,76 144,76 C163,76 180,78 180,82 L180,148 C180,152 163,154 144,154 C125,154 108,152 108,148 Z',
    labelX: 195, labelY: 118,
  },
  {
    id: 'abdomen',
    label: '腹部',
    path: 'M112,154 L176,154 L172,228 C172,234 158,238 144,238 C130,238 116,234 116,228 Z',
    labelX: 195, labelY: 196,
  },
  {
    id: 'limbs-left-arm',
    label: '左臂',
    path: 'M108,82 L88,88 C82,90 74,100 70,120 L64,160 C62,170 60,185 58,200 L72,204 L80,170 L86,140 C90,125 95,110 108,106 Z',
    labelX: 30, labelY: 140,
  },
  {
    id: 'limbs-right-arm',
    label: '右臂',
    path: 'M180,82 L200,88 C206,90 214,100 218,120 L224,160 C226,170 228,185 230,200 L216,204 L208,170 L202,140 C198,125 193,110 180,106 Z',
    labelX: 248, labelY: 140,
  },
  {
    id: 'limbs-left-leg',
    label: '左腿',
    path: 'M116,236 L142,236 L138,340 C138,350 136,370 134,390 L132,420 L118,420 L116,390 C114,370 112,350 112,340 Z',
    labelX: 30, labelY: 330,
  },
  {
    id: 'limbs-right-leg',
    label: '右腿',
    path: 'M146,236 L172,236 L176,340 C176,350 174,370 172,390 L170,420 L156,420 L154,390 C152,370 150,350 150,340 Z',
    labelX: 248, labelY: 330,
  },
];

const BACK_REGIONS: BodyRegion[] = [
  {
    id: 'head',
    label: '头部',
    path: 'M120,12 C120,5 132,0 144,0 C156,0 168,5 168,12 L168,40 C168,52 156,60 144,60 C132,60 120,52 120,40 Z',
    labelX: 195, labelY: 30,
  },
  {
    id: 'back',
    label: '腰背',
    path: 'M108,78 C108,74 125,72 144,72 C163,72 180,74 180,78 L180,228 C180,234 163,238 144,238 C125,238 108,234 108,228 Z',
    labelX: 195, labelY: 155,
  },
  {
    id: 'limbs-left-arm',
    label: '左臂',
    path: 'M108,82 L88,88 C82,90 74,100 70,120 L64,160 C62,170 60,185 58,200 L72,204 L80,170 L86,140 C90,125 95,110 108,106 Z',
    labelX: 30, labelY: 140,
  },
  {
    id: 'limbs-right-arm',
    label: '右臂',
    path: 'M180,82 L200,88 C206,90 214,100 218,120 L224,160 C226,170 228,185 230,200 L216,204 L208,170 L202,140 C198,125 193,110 180,106 Z',
    labelX: 248, labelY: 140,
  },
  {
    id: 'limbs-left-leg',
    label: '左腿',
    path: 'M116,236 L142,236 L138,340 C138,350 136,370 134,390 L132,420 L118,420 L116,390 C114,370 112,350 112,340 Z',
    labelX: 30, labelY: 330,
  },
  {
    id: 'limbs-right-leg',
    label: '右腿',
    path: 'M146,236 L172,236 L176,340 C176,350 174,370 172,390 L170,420 L156,420 L154,390 C152,370 150,350 150,340 Z',
    labelX: 248, labelY: 330,
  },
];

// Single continuous human silhouette outline
const BODY_OUTLINE =
  'M144,0 C160,0 172,8 172,20 L172,40 C172,54 160,62 152,64' +
  ' L156,72 C170,74 184,80 184,86' +
  ' L204,92 C212,95 222,108 226,130 L232,170 C234,182 236,198 238,210' +
  ' L220,214 L212,178 L206,148 C202,132 196,116 186,110' +
  ' L186,240 C186,246 172,250 160,252' +
  ' L160,350 C160,362 158,380 156,400 L154,436' +
  ' L134,436 L132,400 C130,380 128,362 128,350' +
  ' L128,252 C116,250 102,246 102,240' +
  ' L102,110 C92,116 86,132 82,148 L76,178 L68,214' +
  ' L50,210 C52,198 54,182 56,170 L62,130 C66,108 76,95 84,92' +
  ' L104,86 C104,80 118,74 132,72' +
  ' L136,64 C128,62 116,54 116,40 L116,20 C116,8 128,0 144,0 Z';

function toMainPart(id: string): string {
  if (id.startsWith('limbs')) return 'limbs';
  return id;
}

/** Approximate center of an SVG path by averaging coordinate pairs */
function getPathCenter(d: string): { x: number; y: number } {
  const numbers = d.match(/[\d.]+/g)?.map(Number) || [];
  if (numbers.length < 4) return { x: 144, y: 200 };
  let sumX = 0, sumY = 0, count = 0;
  for (let i = 0; i < numbers.length - 1; i += 2) {
    if (numbers[i] < 300 && numbers[i + 1] < 500) {
      sumX += numbers[i];
      sumY += numbers[i + 1];
      count++;
    }
  }
  return count > 0 ? { x: sumX / count, y: sumY / count } : { x: 144, y: 200 };
}

export function BodyPartSelector({ selected, onToggle }: BodyPartSelectorProps) {
  const [view, setView] = useState<View>('front');
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;

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
      {/* View toggle pill */}
      <div className="flex items-center gap-0.5 mb-3 rounded-full bg-slate-100 p-0.5">
        <button
          onClick={() => setView('front')}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
            view === 'front'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          正面
        </button>
        <button
          onClick={() => setView('back')}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
            view === 'back'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          背面
        </button>
      </div>

      {/* SVG silhouette + overlay regions */}
      <svg viewBox="0 0 288 450" className="w-56 h-80 sm:w-64 sm:h-[380px]">
        {/* Continuous body silhouette */}
        <path
          d={BODY_OUTLINE}
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Clickable semi-transparent overlay regions */}
        {regions.map((region) => {
          const sel = isSelected(region.id);
          const cx = region.labelX;
          const cy = region.labelY;
          const pathCenter = getPathCenter(region.path);

          return (
            <g
              key={region.id}
              className="cursor-pointer"
              onClick={() => handleClick(region.id)}
            >
              {/* Region overlay */}
              <path
                d={region.path}
                fill={sel ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}
                stroke={sel ? 'rgba(59, 130, 246, 0.6)' : 'transparent'}
                strokeWidth="1"
                className="transition-all duration-150 hover:fill-blue-500/15"
              />
              {/* Lead line from region center to label */}
              <line
                x1={pathCenter.x}
                y1={pathCenter.y}
                x2={cx}
                y2={cy}
                stroke={sel ? '#3B82F6' : '#CBD5E1'}
                strokeWidth="0.75"
                strokeDasharray={sel ? '' : '2 2'}
              />
              {/* Label dot */}
              <circle cx={cx} cy={cy} r="2" fill={sel ? '#3B82F6' : '#CBD5E1'} />
              {/* Label text */}
              <text
                x={cx < 144 ? cx - 4 : cx + 4}
                y={cy + 4}
                textAnchor={cx < 144 ? 'end' : 'start'}
                className={`text-xs select-none ${
                  sel ? 'fill-blue-600 font-medium' : 'fill-slate-400'
                }`}
                fontSize="11"
              >
                {region.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Extra chips: skin + other */}
      <div className="flex gap-2 mt-3">
        {[
          { id: 'skin', label: '皮肤（全身）' },
          { id: 'other', label: '其他部位' },
        ].map((item) => (
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
        <div className="flex items-center gap-1.5 mt-3">
          <MapPin size={12} className="text-blue-500" />
          <p className="text-xs text-blue-600">
            已选：
            {selected
              .map((id) => {
                const labels: Record<string, string> = {
                  head: '头部',
                  throat: '咽喉',
                  chest: '胸部',
                  abdomen: '腹部',
                  back: '腰背',
                  limbs: '四肢',
                  skin: '皮肤',
                  other: '其他',
                };
                return labels[id] || id;
              })
              .join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
}
