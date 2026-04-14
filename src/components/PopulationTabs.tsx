import type { Population } from '../types';

const TABS: { id: Population; emoji: string; label: string; subtitle?: string }[] = [
  { id: 'self', emoji: '👤', label: '我自己', subtitle: '成年人独立判断' },
  { id: 'pediatric', emoji: '👶', label: '孩子' },
  { id: 'geriatric', emoji: '🧓', label: '老人' },
  { id: 'chronic', emoji: '💊', label: '慢病家属' },
];

interface PopulationTabsProps {
  value: Population | null;
  onChange: (p: Population | null) => void;
}

export function PopulationTabs({ value, onChange }: PopulationTabsProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(value === tab.id ? null : tab.id)}
          className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
            value === tab.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="text-base">{tab.emoji}</span>
          <span className="flex flex-col items-start">
            <span>{tab.label}</span>
            {tab.subtitle && value === tab.id && (
              <span className="text-[10px] opacity-75 leading-tight">{tab.subtitle}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
