import { useState, useMemo, useCallback } from 'react';
import Model, { type IExerciseData, type IMuscleStats } from 'react-body-highlighter';

const BODY_REGIONS = {
  head:    { label: '头颈', muscles: ['head', 'neck'] as const, emoji: '🧠', hint: '头痛、头晕、耳鸣、视力' },
  throat:  { label: '咽喉', muscles: ['neck'] as const, emoji: '🫁', hint: '喉咙痛、吞咽困难、声音嘶哑' },
  chest:   { label: '胸部', muscles: ['chest'] as const, emoji: '💗', hint: '胸闷、心慌、呼吸不畅' },
  abdomen: { label: '腹部', muscles: ['abs', 'obliques'] as const, emoji: '🫃', hint: '腹痛、恶心、消化不良' },
  arms:    { label: '手臂', muscles: ['biceps', 'triceps', 'forearm', 'front-deltoids', 'back-deltoids'] as const, emoji: '💪', hint: '手臂酸痛、手指麻木、关节痛' },
  hands:   { label: '手部', muscles: ['forearm'] as const, emoji: '🤚', hint: '手指麻木、手腕疼、手掌出汗' },
  back:    { label: '背部', muscles: ['trapezius', 'upper-back', 'lower-back'] as const, emoji: '🦴', hint: '腰酸、背痛、脊椎不适' },
  hips:    { label: '臀髋', muscles: ['gluteal', 'adductor'] as const, emoji: '🦵', hint: '髋关节痛、坐骨神经痛' },
  legs:    { label: '腿部', muscles: ['quadriceps', 'hamstring', 'calves'] as const, emoji: '🦿', hint: '膝盖痛、小腿抽筋、走路困难' },
  feet:    { label: '足部', muscles: ['calves'] as const, emoji: '🦶', hint: '脚底痛、脚踝扭伤、脚趾发麻' },
  skin:    { label: '皮肤', muscles: [] as const, emoji: '👋', hint: '全身或局部皮疹、瘙痒、红肿、水疱' },
  eyes:    { label: '眼睛', muscles: [] as const, emoji: '👁️', hint: '眼痛、视力模糊、红眼、干涩' },
  ears:    { label: '耳朵', muscles: [] as const, emoji: '👂', hint: '耳痛、耳鸣、听力下降' },
  mouth:   { label: '口腔', muscles: [] as const, emoji: '👄', hint: '牙痛、口腔溃疡、嘴唇干裂' },
  private: { label: '私密部位', muscles: [] as const, emoji: '🔒', hint: '生殖泌尿系统不适（隐私保护）' },
  other:   { label: '其他', muscles: [] as const, emoji: '❓', hint: '以上未覆盖的部位' },
} as const;

type RegionId = keyof typeof BODY_REGIONS;

// Parts that map to the body model
const MAIN_PARTS: RegionId[] = ['head', 'throat', 'chest', 'abdomen', 'arms', 'hands', 'back', 'hips', 'legs', 'feet'];
// Parts not on the body model
const OTHER_PARTS: RegionId[] = ['skin', 'eyes', 'ears', 'mouth', 'private', 'other'];

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
    `flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-all ${
      selected.includes(id)
        ? 'bg-blue-50 border border-blue-300 text-blue-700'
        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200'
    }`;

  const renderPartButton = (id: RegionId) => {
    const region = BODY_REGIONS[id];
    return (
      <button
        key={id}
        onClick={() => onToggle(id)}
        className={partBtnClass(id)}
      >
        <span className="text-sm">{region.emoji}</span>
        <div>
          <p className="font-medium">{region.label}</p>
          <p className="text-slate-400 text-[11px]">{region.hint}</p>
        </div>
      </button>
    );
  };

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
        <div className="flex-1 space-y-1 overflow-y-auto" style={{ maxHeight: '420px' }}>
          <p className="text-xs text-slate-400 px-1 mb-1">身体部位</p>
          {MAIN_PARTS.map(renderPartButton)}

          <div className="border-t border-slate-100 my-2" />
          <p className="text-xs text-slate-400 px-1 mb-1">其他部位</p>
          {OTHER_PARTS.map(renderPartButton)}
        </div>
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <div className="mt-3 text-xs text-blue-600 bg-blue-50 rounded-full px-3 py-1">
          已选：{selected.map(id => {
            if (id in BODY_REGIONS) return BODY_REGIONS[id as RegionId].label;
            return id;
          }).join('、')}
        </div>
      )}
    </div>
  );
}