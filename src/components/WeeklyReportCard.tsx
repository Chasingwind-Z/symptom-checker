import { Calendar, Activity, Pill, Clock, CheckCircle } from 'lucide-react';
import type { WeeklyReportData } from '../lib/weeklyReport';

const RISK_EMOJI: Record<string, string> = {
  green: '🟢', yellow: '🟡', orange: '🟠', red: '🔴', pending: '⚪',
};

interface WeeklyReportCardProps {
  report: WeeklyReportData;
  onClose: () => void;
}

export function WeeklyReportCard({ report, onClose }: WeeklyReportCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Calendar size={18} />
            <p className="text-base font-semibold">家庭健康周报</p>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-white">
            {report.weekRange}
          </span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatBlock icon={<Activity size={14} className="text-blue-500" />} label="问诊" value={`${report.consultationCount}次`} />
          <StatBlock icon={<Pill size={14} className="text-violet-500" />} label="药箱" value={`${report.medicationUsed.length}种`} />
          <StatBlock icon={<Clock size={14} className="text-amber-500" />} label="待复诊" value={`${report.pendingAppointments}个`} />
        </div>

        {/* Risk breakdown */}
        {report.consultationCount > 0 && (
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-600 mb-1.5">风险分布</p>
            <div className="flex gap-3">
              {Object.entries(report.riskLevelBreakdown).map(([level, count]) => (
                <span key={level} className="text-xs text-slate-600">
                  {RISK_EMOJI[level] || '⚪'} {count}次
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main symptoms */}
        {report.mainSymptoms.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">主要症状</p>
            <div className="flex flex-wrap gap-1.5">
              {report.mainSymptoms.map(s => (
                <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        <div className="space-y-1.5">
          {report.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">{h}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center">长按截图分享给家人</p>

        <button onClick={onClose} className="w-full rounded-xl bg-slate-100 py-2 text-sm text-slate-600 hover:bg-slate-200 transition-colors">
          关闭
        </button>
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
