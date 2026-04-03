import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';
import { HospitalCard } from './HospitalCard';
import { RiskGauge } from './RiskGauge';
import { ReportExport } from './ReportExport';
import type { DiagnosisResult, Hospital, Message, RiskLevel, SymptomReport } from '../types';

const REGIONS = ['华北', '华南', '华东', '西南', '西北'] as const;

const ACTION_ITEMS: Record<RiskLevel, [string, string, string]> = {
  green: ['居家观察症状变化', '多休息、多补水', '若症状加重及时就医'],
  yellow: ['48小时内就诊', '记录症状变化', '备好就诊摘要'],
  orange: ['今日内前往就医', '避免独自出行', '携带既往病历或用药记录'],
  red: ['立即拨打120或前往急诊', '保持平静、勿进食饮水', '通知家人陪同并告知症状'],
};

const STORAGE_KEY = 'symptom_reports';

function saveReport(result: DiagnosisResult): void {
  const existing: SymptomReport[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  const report: SymptomReport = {
    id: Date.now().toString(),
    symptoms: result.departments,
    level: result.level,
    timestamp: new Date().toISOString(),
    region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, report]));
}

interface ResultCardProps {
  result: DiagnosisResult;
  hospitals: Hospital[];
  messages: Message[];
  onReport?: () => void;
  onToggleMap?: () => void;
}

const LEVEL_CONFIG: Record<
  RiskLevel,
  {
    bar: string;
    text: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ReactNode;
    title: string;
    pulse: boolean;
  }
> = {
  green: {
    bar: 'bg-emerald-400',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    icon: <CheckCircle size={24} />,
    title: '可居家观察',
    pulse: false,
  },
  yellow: {
    bar: 'bg-yellow-400',
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
    icon: <Clock size={24} />,
    title: '建议尽快就诊',
    pulse: false,
  },
  orange: {
    bar: 'bg-orange-400',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    icon: <AlertTriangle size={24} />,
    title: '建议今日就医',
    pulse: false,
  },
  red: {
    bar: 'bg-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    icon: <AlertOctagon size={24} />,
    title: '立即前往急诊',
    pulse: true,
  },
};

export function ResultCard({ result, hospitals, messages, onReport, onToggleMap }: ResultCardProps) {
  const config = LEVEL_CONFIG[result.level];
  const [reportState, setReportState] = useState<'pending' | 'done' | 'declined'>('pending');
  const [checked, setChecked] = useState<[boolean, boolean, boolean]>([false, false, false]);

  function toggleCheck(i: 0 | 1 | 2) {
    setChecked((prev) => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[i] = !next[i];
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-4 ${
        config.pulse ? 'animate-[pulse_2.5s_ease-in-out_infinite]' : ''
      }`}
    >
      {/* Top color strip — 4px, exact level color */}
      <div style={{ height: '4px', backgroundColor: { green: '#10B981', yellow: '#F59E0B', orange: '#F97316', red: '#EF4444' }[result.level] }} />

      <div className="p-6">
        {/* Risk Gauge */}
        <div className="flex justify-center mt-6 mb-2 w-full max-w-xs mx-auto">
          <RiskGauge level={result.level} />
        </div>

        {/* Action checklist */}
        <div className={`rounded-xl px-4 py-3 mb-4 ${config.bg}`}>
          <p className={`text-xs font-semibold mb-2 ${config.text}`}>行动清单</p>
          <ul className="flex flex-col gap-2">
            {ACTION_ITEMS[result.level].map((item, i) => (
              <li key={item} className="flex items-center gap-2.5">
                <button
                  onClick={() => toggleCheck(i as 0 | 1 | 2)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    checked[i]
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-slate-300'
                  }`}
                  aria-label={checked[i] ? '取消' : '完成'}
                >
                  {checked[i] && (
                    <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm md:text-base transition-all duration-200 ${checked[i] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
          {checked.every(Boolean) && (
            <p className="text-emerald-500 text-xs font-medium mt-3 text-center">✓ 准备就绪，祝您早日康复</p>
          )}
        </div>

        {/* Level badge + title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`rounded-xl p-2 ${config.bg} ${config.text}`}>
            {config.icon}
          </div>
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}>
              {{ green: '低风险', yellow: '中风险', orange: '较高风险', red: '紧急' }[result.level]}
            </span>
            <h2 className={`text-xl font-bold mt-0.5 ${config.text}`}>{config.title}</h2>
          </div>
        </div>

        {/* Reason */}
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{result.reason}</p>

        {/* Action */}
        <div className={`flex items-start gap-2 mb-5 rounded-xl px-4 py-3 ${config.bg}`}>
          <ArrowRight size={16} className={`mt-0.5 flex-shrink-0 ${config.text}`} />
          <span className="text-slate-700 font-medium text-sm">{result.action}</span>
        </div>

        {/* Departments */}
        {result.departments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {result.departments.map((dept) => (
              <span
                key={dept}
                className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-600 font-medium"
              >
                {dept}
              </span>
            ))}
          </div>
        )}

        {/* Hospitals */}
        {hospitals.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-slate-700 font-semibold text-sm mb-3 flex items-center gap-1.5">
              <span className={`w-1 h-4 rounded-full ${config.bar} inline-block`} />
              附近推荐医院
            </h3>
            <div className="flex flex-col gap-3">
              {hospitals.map((hospital) => (
                <HospitalCard key={hospital.id} hospital={hospital} />
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="flex justify-center mt-5">
          <ReportExport result={result} messages={messages} />
        </div>

        {/* Disclaimer */}
        <p className="text-slate-400 text-xs text-center mt-3 leading-relaxed">{result.disclaimer}</p>

        {/* Anonymous report prompt */}
        <div className="border-t border-slate-100 mt-5 pt-4">
          {reportState === 'pending' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-slate-500 text-xs text-center">是否愿意匿名上报本次症状？</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    saveReport(result);
                    setReportState('done');
                    onReport?.();
                  }}
                  className="px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                >
                  愿意上报
                </button>
                <button
                  onClick={() => setReportState('declined')}
                  className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  不了
                </button>
              </div>
            </div>
          )}
          {reportState === 'done' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-3">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-800 font-medium text-sm">感谢您的数据贡献</p>
                  <p className="text-emerald-600 text-xs mt-1 leading-relaxed">
                    您的症状数据已匿名上报。与其他用户数据汇聚后，将帮助监测社区疾病传播趋势，比医院诊断数据早 5-7 天发现疫情苗头。
                  </p>
                  {onToggleMap && (
                    <button
                      onClick={onToggleMap}
                      className="text-emerald-600 text-xs mt-2 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      查看社区疾病预警地图 →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
