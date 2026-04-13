import { Brain, Thermometer, HeartPulse, Stethoscope, Activity, AlertCircle, Pill, Wind, Droplets, Moon, Flower2, Sparkles } from 'lucide-react';
import type { Suggestion } from '../services/suggestions/generator';

const EMERGENCY_KEYWORDS = ['急诊', '严重', '紧急', '抽搐', '120'];

const BLUE = 'text-blue-600';
const ORANGE = 'text-orange-500';

function buildIconMap(color: string): Record<string, React.ReactNode> {
  return {
    Brain: <Brain size={28} className={color} />,
    Thermometer: <Thermometer size={28} className={color} />,
    HeartPulse: <HeartPulse size={28} className={color} />,
    Stethoscope: <Stethoscope size={28} className={color} />,
    Activity: <Activity size={28} className={color} />,
    AlertCircle: <AlertCircle size={28} className={color} />,
    Pill: <Pill size={28} className={color} />,
    Wind: <Wind size={28} className={color} />,
    Droplets: <Droplets size={28} className={color} />,
    Moon: <Moon size={28} className={color} />,
    Flower2: <Flower2 size={28} className={color} />,
    Sparkles: <Sparkles size={28} className={color} />,
  };
}

const ICON_MAP_BLUE = buildIconMap(BLUE);
const ICON_MAP_ORANGE = buildIconMap(ORANGE);

function isEmergency(title: string): boolean {
  return EMERGENCY_KEYWORDS.some(k => title.includes(k));
}

function getIcon(s: Suggestion): React.ReactNode {
  const map = isEmergency(s.title) ? ICON_MAP_ORANGE : ICON_MAP_BLUE;
  return map[s.icon] || <Brain size={28} className={isEmergency(s.title) ? ORANGE : BLUE} />;
}

interface SuggestionCardsProps {
  suggestions: Suggestion[];
  onSelect: (query: string) => void;
  pendingFollowup?: { title: string; sessionId: string } | null;
  onOpenFollowup?: (sessionId: string) => void;
  explanation?: string;
}

export function SuggestionCards({ suggestions, onSelect, pendingFollowup, onOpenFollowup, explanation }: SuggestionCardsProps) {
  return (
    <div>
      {explanation && (
        <p className="text-xs text-slate-400 mb-2 sm:mb-3">{explanation}</p>
      )}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.query)}
            className="group rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 text-left shadow-sm hover:border-blue-400 hover:shadow-lg transition-all min-h-[44px]"
          >
            <div className="mb-2 sm:mb-3">{getIcon(s)}</div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">{s.title}</p>
            <p className="text-xs text-slate-400 mt-1">{s.subtitle}</p>
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
