import { useState, useMemo, useCallback } from 'react';
import Model, { type IExerciseData, type IMuscleStats } from 'react-body-highlighter';

const BODY_REGIONS = {
  head:    { label: '头颈', muscles: ['head', 'neck'] as const },
  chest:   { label: '胸部', muscles: ['chest'] as const },
  abdomen: { label: '腹部', muscles: ['abs', 'obliques'] as const },
  arms:    { label: '手臂', muscles: ['biceps', 'triceps', 'forearm', 'front-deltoids', 'back-deltoids'] as const },
  back:    { label: '背部', muscles: ['trapezius', 'upper-back', 'lower-back'] as const },
  legs:    { label: '腿部', muscles: ['quadriceps', 'hamstring', 'adductor', 'abductors', 'calves', 'gluteal'] as const },
} as const;

type RegionId = keyof typeof BODY_REGIONS;

const PART_EMOJI: Record<string, string> = {
  head: '🧠', chest: '💗', abdomen: '🫃', arms: '💪', back: '🦴', legs: '🦵',
};

const PART_HINT: Record<string, string> = {
  head: '头痛、头晕、耳鸣、视力',
  chest: '胸闷、心慌、呼吸不畅',
  abdomen: '腹痛、恶心、消化不良',
  arms: '手臂酸痛、手指麻木',
  back: '腰酸、背痛、脊椎不适',
  legs: '腿疼、膝盖痛、走路困难',
};

interface BodyPartSelectorProps {
  selected: string[];
  onToggle: (partId: string) => void;
}

export function BodyPartSelector({ selected, onToggle }: BodyPartSelectorProps) {
  const [side, setSide] = useState<'anterior' | 'posterior'>('anterior');

  const data: IExerciseData[] = useMemo(() => {
    return selected
      .filter((id): id is RegionId => id in BODY_REGIONS)
      .map(regionId => ({
        name: BODY_REGIONS[regionId].label,
        muscles: [...BODY_REGIONS[regionId].muscles],
        frequency: 1,
      }));
  }, [selected]);

  const handleMuscleClick = useCallback((stats: IMuscleStats) => {
    const regionEntry = Object.entries(BODY_REGIONS).find(
      ([, region]) => (region.muscles as readonly string[]).includes(stats.muscle)
    );
    if (!regionEntry) return;
    onToggle(regionEntry[0]);
  }, [onToggle]);

  const partBtnClass = (id: string) =>
    `flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left text-xs transition-all ${
      selected.includes(id)
        ? 'bg-blue-50 border border-blue-300 text-blue-700'
        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200'
    }`;

  return (
    <div className="flex flex-col items-center">
      {/* Toggle + instruction */}
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs text-slate-500">点击身体或右侧选项</p>
        <div className="flex gap-1 rounded-full bg-slate-100 p-0.5">
          {(['anterior', 'posterior'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                side === s
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              {s === 'anterior' ? '正面' : '背面'}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout: body left, options right */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        {/* Left: Body model */}
        <div className="flex-shrink-0 self-center sm:self-start">
          <style>{`
            .body-model-wrapper svg polygon,
            .body-model-wrapper svg path {
              transition: fill 0.2s ease;
              cursor: pointer;
            }
          `}</style>
          <div className="body-model-wrapper">
            <Model
              data={data}
              type={side}
              style={{ width: '180px', padding: '0.25rem' }}
              onClick={handleMuscleClick}
              highlightedColors={['#60a5fa', '#3b82f6', '#1e40af']}
              bodyColor="#e2e8f0"
            />
          </div>
        </div>

        {/* Right: Part selection list */}
        <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[340px]">
          {Object.entries(BODY_REGIONS).map(([id, region]) => (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={partBtnClass(id)}
            >
              <span className="text-sm">{PART_EMOJI[id] || '📍'}</span>
              <div>
                <p className="font-medium">{region.label}</p>
                <p className="text-slate-400 text-[11px]">{PART_HINT[id] || ''}</p>
              </div>
            </button>
          ))}

          {/* Non-body parts */}
          <div className="pt-1 border-t border-slate-100 mt-1 space-y-1.5">
            <button onClick={() => onToggle('skin')} className={partBtnClass('skin')}>
              <span className="text-sm">👋</span>
              <div>
                <p className="font-medium">皮肤（全身）</p>
                <p className="text-slate-400 text-[11px]">皮疹、瘙痒、红肿</p>
              </div>
            </button>
            <button onClick={() => onToggle('other')} className={partBtnClass('other')}>
              <span className="text-sm">❓</span>
              <div>
                <p className="font-medium">其他部位</p>
                <p className="text-slate-400 text-[11px]">以上未覆盖的部位</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <div className="mt-3 text-xs text-blue-600 bg-blue-50 rounded-full px-3 py-1">
          已选：{selected.map(id => {
            if (id in BODY_REGIONS) return BODY_REGIONS[id as RegionId].label;
            if (id === 'skin') return '皮肤';
            if (id === 'other') return '其他';
            return id;
          }).join('、')}
        </div>
      )}
    </div>
  );
}