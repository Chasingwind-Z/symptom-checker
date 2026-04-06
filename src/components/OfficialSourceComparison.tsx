import { ExternalLink, ShieldCheck } from 'lucide-react';
import type { OfficialSourceRecord } from '../types';

interface OfficialSourceComparisonProps {
  records: OfficialSourceRecord[];
  title?: string;
  subtitle?: string;
  theme?: 'light' | 'dark';
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return '';
  }
}

export function OfficialSourceComparison({
  records,
  title = '权威健康参考',
  subtitle = '以下资料来源于疾控中心、卫健委及 WHO 等公开渠道，供对照参考。',
  theme = 'light',
}: OfficialSourceComparisonProps) {
  const isDark = theme === 'dark';

  if (records.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        isDark ? 'border-cyan-500/20 bg-white/5' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck size={15} className={isDark ? 'text-cyan-300' : 'text-emerald-600'} />
        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</p>
      </div>
      <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
        {subtitle}
      </p>

      <div className="mt-3 flex flex-col gap-2.5">
        {records.map((record) => {
          const dateLabel = formatDate(record.lastUpdated);
          const cardBody = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                    {record.title}
                  </p>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                    {record.sourceLabel}{dateLabel ? ` · ${dateLabel}` : ''}
                  </p>
                </div>
                {record.url && (
                  <ExternalLink
                    size={14}
                    className={isDark ? 'text-white/35 flex-shrink-0 mt-0.5' : 'text-slate-400 flex-shrink-0 mt-0.5'}
                  />
                )}
              </div>
              <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {record.summary}
              </p>
              {record.url && (
                <div className={`mt-2 text-[11px] ${isDark ? 'text-cyan-200' : 'text-emerald-700'}`}>
                  {record.linkLabel ?? '查看详情'} →
                </div>
              )}
            </>
          );

          return record.url ? (
            <a
              key={record.id}
              href={record.url}
              target="_blank"
              rel="noreferrer"
              className={`block rounded-xl border px-3 py-3 transition-colors ${
                isDark
                  ? 'border-white/10 bg-slate-950/40 hover:border-cyan-400/35 hover:bg-slate-900/60'
                  : 'border-slate-200 bg-slate-50/80 hover:border-emerald-200 hover:bg-emerald-50/40'
              }`}
            >
              {cardBody}
            </a>
          ) : (
            <div
              key={record.id}
              className={`rounded-xl border px-3 py-3 ${
                isDark ? 'border-white/10 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'
              }`}
            >
              {cardBody}
            </div>
          );
        })}
      </div>
    </div>
  );
}
