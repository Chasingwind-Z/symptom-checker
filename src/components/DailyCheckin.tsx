import { useState, useCallback } from 'react';
import { Check, Sun } from 'lucide-react';

const CHECKIN_KEY = 'daily_checkins';

interface CheckinData {
  energy: number;
  sleepHours: number;
  hasDiscomfort: boolean;
  date: string;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCheckins(): CheckinData[] {
  try {
    return JSON.parse(localStorage.getItem(CHECKIN_KEY) || '[]');
  } catch { return []; }
}

function getStreak(): number {
  const checkins = getCheckins();
  if (checkins.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
    if (checkins.some(c => c.date === d)) streak++;
    else break;
  }
  return streak;
}

interface DailyCheckinProps {
  onComplete?: () => void;
}

export function DailyCheckin({ onComplete }: DailyCheckinProps) {
  const [energy, setEnergy] = useState(3);
  const [sleepHours, setSleepHours] = useState('7');
  const [hasDiscomfort, setHasDiscomfort] = useState(false);
  const [submitted, setSubmitted] = useState(() => {
    const checkins = getCheckins();
    return checkins.some(c => c.date === getTodayStr());
  });
  const streak = getStreak();

  const handleSubmit = useCallback(() => {
    const checkins = getCheckins();
    checkins.push({
      energy,
      sleepHours: parseFloat(sleepHours) || 7,
      hasDiscomfort,
      date: getTodayStr(),
    });
    localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkins.slice(-90)));
    setSubmitted(true);
    onComplete?.();
  }, [energy, sleepHours, hasDiscomfort, onComplete]);

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
        <Check size={14} className="text-emerald-600" />
        <span className="text-xs text-emerald-700">今日已打卡</span>
        {streak >= 7 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
            🏅 连续{streak}天
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Sun size={14} className="text-blue-500" />
        <p className="text-xs font-semibold text-slate-800">每日健康打卡</p>
        {streak > 0 && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
            已连续{streak}天
          </span>
        )}
      </div>

      {/* Energy */}
      <div className="mb-2">
        <p className="text-xs text-slate-600 mb-1">今天精力如何？</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => setEnergy(n)}
              className={`flex-1 rounded-lg py-1.5 text-xs transition-colors ${
                energy === n ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {['😫','😕','😐','😊','🤩'][n-1]}
            </button>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div className="mb-2">
        <p className="text-xs text-slate-600 mb-1">昨晚睡了几小时？</p>
        <input
          type="number"
          value={sleepHours}
          onChange={e => setSleepHours(e.target.value)}
          min="0" max="24" step="0.5"
          className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-300 focus:outline-none"
        />
        <span className="text-xs text-slate-400 ml-1">小时</span>
      </div>

      {/* Discomfort */}
      <div className="mb-3">
        <button
          onClick={() => setHasDiscomfort(!hasDiscomfort)}
          className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
            hasDiscomfort ? 'bg-amber-100 border border-amber-300 text-amber-700' : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          {hasDiscomfort ? '😷 有不适' : '👍 无不适'}
        </button>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full rounded-xl bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
      >
        完成打卡 ✓
      </button>
    </div>
  );
}
