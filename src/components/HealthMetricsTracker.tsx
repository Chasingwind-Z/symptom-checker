import { useState, useMemo, useCallback } from 'react';
import { Activity, Heart, Droplets, Plus, AlertTriangle } from 'lucide-react';
import {
  saveMetric, getRecentMetrics, checkMetricAlerts,
  type MetricType, type HealthMetric
} from '../lib/healthMetrics';

const METRIC_TABS: { id: MetricType; label: string; icon: React.ReactNode; unit: string }[] = [
  { id: 'blood_pressure', label: '血压', icon: <Activity size={14} />, unit: 'mmHg' },
  { id: 'blood_sugar', label: '血糖', icon: <Droplets size={14} />, unit: 'mmol/L' },
  { id: 'heart_rate', label: '心率', icon: <Heart size={14} />, unit: 'bpm' },
];

export function HealthMetricsTracker() {
  const [activeTab, setActiveTab] = useState<MetricType>('blood_pressure');
  const [entries, setEntries] = useState<HealthMetric[]>(() => getRecentMetrics(activeTab, 7));
  const [inputPrimary, setInputPrimary] = useState('');
  const [inputSecondary, setInputSecondary] = useState('');
  const [mealContext, setMealContext] = useState<'fasting' | 'postmeal'>('fasting');

  const alerts = useMemo(() => checkMetricAlerts(), [entries]);

  const handleTabChange = useCallback((tab: MetricType) => {
    setActiveTab(tab);
    setEntries(getRecentMetrics(tab, 7));
    setInputPrimary('');
    setInputSecondary('');
  }, []);

  const handleRecord = useCallback(() => {
    const primary = parseFloat(inputPrimary);
    if (isNaN(primary)) return;

    const metric = saveMetric({
      type: activeTab,
      valuePrimary: primary,
      valueSecondary: activeTab === 'blood_pressure' ? parseFloat(inputSecondary) || undefined : undefined,
      mealContext: activeTab === 'blood_sugar' ? mealContext : undefined,
      recordedAt: new Date().toISOString(),
    });

    setEntries(prev => [...prev.slice(-6), metric]);
    setInputPrimary('');
    setInputSecondary('');
  }, [activeTab, inputPrimary, inputSecondary, mealContext]);

  const refRange = activeTab === 'blood_pressure'
    ? '正常: <140/90'
    : activeTab === 'blood_sugar'
      ? '空腹正常: <6.1'
      : '正常: 60-100';

  const maxValue = Math.max(...entries.map(e => e.valuePrimary), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 mb-4">
        {METRIC_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {alerts.filter(a => a.type === activeTab).map((alert, i) => (
        <div key={i} className={`mb-3 rounded-lg px-3 py-2 flex items-start gap-2 ${
          alert.severity === 'danger' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <AlertTriangle size={13} className={alert.severity === 'danger' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
          <p className={`text-[11px] leading-relaxed ${alert.severity === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>{alert.message}</p>
        </div>
      ))}

      {/* Input form */}
      <div className="flex gap-2 mb-4">
        <input
          value={inputPrimary}
          onChange={e => setInputPrimary(e.target.value)}
          placeholder={activeTab === 'blood_pressure' ? '收缩压' : '数值'}
          type="number"
          className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-300 focus:outline-none"
        />
        {activeTab === 'blood_pressure' && (
          <input
            value={inputSecondary}
            onChange={e => setInputSecondary(e.target.value)}
            placeholder="舒张压"
            type="number"
            className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-300 focus:outline-none"
          />
        )}
        {activeTab === 'blood_sugar' && (
          <select
            value={mealContext}
            onChange={e => setMealContext(e.target.value as 'fasting' | 'postmeal')}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none"
          >
            <option value="fasting">空腹</option>
            <option value="postmeal">餐后</option>
          </select>
        )}
        <button onClick={handleRecord} className="rounded-lg bg-blue-500 p-1.5 text-white hover:bg-blue-600">
          <Plus size={14} />
        </button>
      </div>

      {/* Reference */}
      <p className="text-[10px] text-slate-400 mb-2">{refRange}</p>

      {/* Trend bars */}
      {entries.length > 0 ? (
        <div className="flex items-end gap-1.5 h-16">
          {entries.map((entry, i) => (
            <div key={entry.id || i} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-slate-500">{entry.valuePrimary}</span>
              <div
                className={`w-full rounded-t transition-all ${
                  activeTab === 'blood_pressure' && entry.valuePrimary >= 140 ? 'bg-red-400' :
                  activeTab === 'blood_sugar' && entry.valuePrimary >= 7.0 ? 'bg-red-400' :
                  'bg-blue-400'
                }`}
                style={{ height: `${Math.max((entry.valuePrimary / maxValue) * 100, 8)}%` }}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-4">暂无记录，开始记录第一条</p>
      )}
    </div>
  );
}
