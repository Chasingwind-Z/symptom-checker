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

  return (
    <div className="flex flex-col items-center">
      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        {(['anterior', 'posterior'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              side === s
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {s === 'anterior' ? '正面' : '背面'}
          </button>
        ))}
      </div>

      {/* Body model */}
      {/* Hover feedback for unselected muscles */}
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
          style={{ width: '240px', padding: '0.5rem' }}
          onClick={handleMuscleClick}
          highlightedColors={['#60a5fa', '#3b82f6', '#1e40af']}
          bodyColor="#e2e8f0"
        />
      </div>

      {/* Selected chips */}
      {selected.filter(id => id in BODY_REGIONS).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 justify-center max-w-xs">
          {selected.filter((id): id is RegionId => id in BODY_REGIONS).map(id => (
            <span key={id} className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
              {BODY_REGIONS[id].label}
            </span>
          ))}
        </div>
      )}

      {/* Skin / Other */}
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
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}