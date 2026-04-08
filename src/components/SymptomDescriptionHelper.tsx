import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface SymptomDescriptionHelperProps {
  onSubmit: (text: string) => void;
  onClose: () => void;
}

const BODY_PARTS = [
  { id: 'head', label: '头部', emoji: '🧠' },
  { id: 'throat', label: '咽喉', emoji: '🫁' },
  { id: 'chest', label: '胸部', emoji: '💗' },
  { id: 'abdomen', label: '腹部', emoji: '🫃' },
  { id: 'back', label: '腰背', emoji: '🦴' },
  { id: 'limbs', label: '四肢', emoji: '💪' },
  { id: 'skin', label: '皮肤', emoji: '🖐️' },
  { id: 'other', label: '其他', emoji: '❓' },
];

const SYMPTOM_TYPES = [
  { id: 'pain', label: '疼痛' },
  { id: 'itch', label: '瘙痒' },
  { id: 'numb', label: '麻木' },
  { id: 'bloat', label: '胀满' },
  { id: 'fever', label: '发热' },
  { id: 'fatigue', label: '乏力' },
  { id: 'nausea', label: '恶心' },
  { id: 'cough', label: '咳嗽' },
  { id: 'dizzy', label: '头晕' },
  { id: 'other', label: '其他' },
];

const SEVERITY_LABELS = ['很轻', '轻微', '中等', '较重', '很重'];

const DURATION_OPTIONS = [
  { id: 'just_now', label: '刚开始' },
  { id: 'lt_1day', label: '不到1天' },
  { id: '1_3days', label: '1-3天' },
  { id: 'gt_3days', label: '超过3天' },
];

export function SymptomDescriptionHelper({ onSubmit, onClose }: SymptomDescriptionHelperProps) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [severity, setSeverity] = useState(3);
  const [duration, setDuration] = useState<string | null>(null);

  const toggleType = useCallback((id: string) => {
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id].slice(0, 3)
    );
  }, []);

  const canSubmit = selectedPart && selectedTypes.length > 0 && duration;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const partLabel = BODY_PARTS.find(p => p.id === selectedPart)?.label || '';
    const typeLabels = selectedTypes.map(t => SYMPTOM_TYPES.find(s => s.id === t)?.label || '').join('、');
    const severityLabel = SEVERITY_LABELS[severity - 1];
    const durationLabel = DURATION_OPTIONS.find(d => d.id === duration)?.label || '';

    const text = `${partLabel}${typeLabels}，程度${severityLabel}，已持续${durationLabel}`;
    onSubmit(text);
  }, [canSubmit, selectedPart, selectedTypes, severity, duration, onSubmit]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-4 mb-3"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-800">帮你描述症状</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      {/* Step 1: Body part */}
      <p className="text-xs text-slate-600 mb-2">哪里不舒服？</p>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {BODY_PARTS.map(part => (
          <button
            key={part.id}
            onClick={() => setSelectedPart(part.id)}
            className={`rounded-xl py-2 text-center transition-all ${
              selectedPart === part.id
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-200'
            }`}
          >
            <span className="text-lg block">{part.emoji}</span>
            <span className="text-xs">{part.label}</span>
          </button>
        ))}
      </div>

      {/* Step 2: Symptom type */}
      <p className="text-xs text-slate-600 mb-2">什么感觉？（最多选3个）</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {SYMPTOM_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => toggleType(type.id)}
            className={`rounded-full px-3 py-1 text-xs transition-all ${
              selectedTypes.includes(type.id)
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Step 3: Severity slider */}
      <p className="text-xs text-slate-600 mb-2">严重程度</p>
      <div className="mb-4">
        <input
          type="range"
          min={1}
          max={5}
          value={severity}
          onChange={e => setSeverity(parseInt(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between">
          {SEVERITY_LABELS.map((label, i) => (
            <span key={label} className={`text-xs ${severity === i + 1 ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 4: Duration */}
      <p className="text-xs text-slate-600 mb-2">持续多久了？</p>
      <div className="flex gap-2 mb-4">
        {DURATION_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setDuration(opt.id)}
            className={`flex-1 rounded-lg py-1.5 text-xs transition-all ${
              duration === opt.id
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
          canSubmit
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        <Check size={14} className="inline mr-1" />
        开始问诊
      </button>
    </motion.div>
  );
}
