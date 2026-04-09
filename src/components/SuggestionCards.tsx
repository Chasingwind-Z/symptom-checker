import { Brain, Thermometer, HeartPulse, Stethoscope, Activity, AlertCircle, Pill, Wind, Droplets, Moon, Flower2, Sparkles } from 'lucide-react';
import type { Suggestion } from '../services/suggestions/generator';

const ICON_MAP: Record<string, React.ReactNode> = {
  Brain: <Brain size={28} className="text-blue-600" />,
  Thermometer: <Thermometer size={28} className="text-red-500" />,
  HeartPulse: <HeartPulse size={28} className="text-red-500" />,
  Stethoscope: <Stethoscope size={28} className="text-emerald-500" />,
  Activity: <Activity size={28} className="text-violet-500" />,
  AlertCircle: <AlertCircle size={28} className="text-amber-500" />,
  Pill: <Pill size={28} className="text-blue-500" />,
  Wind: <Wind size={28} className="text-cyan-500" />,
  Droplets: <Droplets size={28} className="text-blue-400" />,
  Moon: <Moon size={28} className="text-indigo-500" />,
  Flower2: <Flower2 size={28} className="text-pink-500" />,
  Sparkles: <Sparkles size={28} className="text-amber-400" />,
};

interface SuggestionCardsProps {
  suggestions: Suggestion[];
  onSelect: (query: string) => void;
  pendingFollowup?: { title: string; sessionId: string } | null;
  onOpenFollowup?: (sessionId: string) => void;
}

export function SuggestionCards({ suggestions, onSelect, pendingFollowup, onOpenFollowup }: SuggestionCardsProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.query)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="mb-3">{ICON_MAP[s.icon] || <Brain size={28} className="text-blue-600" />}</div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">{s.title}</p>
            <p className="text-xs text-slate-400 mt-1.5">{s.subtitle}</p>
          </button>
        ))}
      </div>
      {pendingFollowup && onOpenFollowup && (
        <button
          onClick={() => onOpenFollowup(pendingFollowup.sessionId)}
          className="flex items-center gap-2 mt-4 w-full rounded-xl bg-slate-50 px-4 py-2.5 text-left hover:bg-slate-100 transition-colors"
        >
          <span className="text-sm">📋</span>
          <span className="text-xs text-slate-600 flex-1 truncate">
            或者继续上次：{pendingFollowup.title}
          </span>
          <span className="text-xs text-blue-500">→</span>
        </button>
      )}
    </div>
  );
}
