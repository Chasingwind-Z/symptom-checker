interface SymptomTagsProps {
  onSelect: (symptom: string) => void;
}

const SYMPTOMS = [
  { label: '发烧', text: '我发烧了' },
  { label: '咳嗽', text: '我在咳嗽' },
  { label: '头痛', text: '我头痛' },
  { label: '胸痛', text: '我胸口痛' },
  { label: '恶心呕吐', text: '我感到恶心想吐' },
  { label: '呼吸困难', text: '我呼吸有点困难' },
  { label: '乏力', text: '我感觉很乏力' },
  { label: '头晕', text: '我头晕' },
  { label: '腹痛', text: '我肚子痛' },
  { label: '流鼻涕', text: '我流鼻涕' },
];

export function SymptomTags({ onSelect }: SymptomTagsProps) {
  return (
    <div
      className="flex flex-nowrap gap-2 overflow-x-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {SYMPTOMS.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.text)}
          className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 text-sm px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 shadow-sm"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
