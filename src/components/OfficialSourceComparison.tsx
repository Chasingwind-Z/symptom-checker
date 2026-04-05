import { CloudOff, ExternalLink, LoaderCircle, RefreshCcw, ShieldCheck } from 'lucide-react';
import type { OfficialSourceRecord, OfficialSourceSyncStatus } from '../types';
import { formatOfficialSourceTime } from '../lib/officialSources';

interface OfficialSourceComparisonProps {
  records: OfficialSourceRecord[];
  syncStatus?: OfficialSourceSyncStatus;
  title?: string;
  subtitle?: string;
  theme?: 'light' | 'dark';
}

function getModeBadge(syncStatus?: OfficialSourceSyncStatus): string {
  if (!syncStatus) return '本地资料';

  if (syncStatus.mode === 'server-live') {
    return '云端同步';
  }

  if (syncStatus.mode === 'server-cache') {
    return '最近同步';
  }

  return '本地资料';
}

function getFreshnessBadge(syncStatus?: OfficialSourceSyncStatus): string {
  if (!syncStatus) return '人工维护';

  switch (syncStatus.freshness) {
    case 'fresh':
      return '近 24h';
    case 'recent':
      return '近 7 天';
    case 'stale':
      return '待刷新';
    default:
      return '人工维护';
  }
}

export function OfficialSourceComparison({
  records,
  syncStatus,
  title = '官方公开资料对照卡',
  subtitle = '优先展示官方公开资料；如云端暂不可用，会自动保留人工整理的本地摘要。',
  theme = 'light',
}: OfficialSourceComparisonProps) {
  const isDark = theme === 'dark';
  const badgeLabel = getModeBadge(syncStatus);
  const freshnessLabel = getFreshnessBadge(syncStatus);
  const syncToneClass = isDark
    ? syncStatus?.mode === 'server-live'
      ? 'bg-cyan-500/10 text-cyan-200'
      : syncStatus?.mode === 'server-cache'
      ? 'bg-violet-500/10 text-violet-200'
      : 'bg-amber-500/10 text-amber-200'
    : syncStatus?.mode === 'server-live'
    ? 'bg-emerald-50 text-emerald-700'
    : syncStatus?.mode === 'server-cache'
    ? 'bg-violet-50 text-violet-700'
    : 'bg-amber-50 text-amber-700';
  const freshnessToneClass = isDark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600';

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        isDark ? 'border-cyan-500/20 bg-white/5' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className={isDark ? 'text-cyan-300' : 'text-emerald-600'} />
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</p>
          </div>
          <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${syncToneClass}`}>{badgeLabel}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${freshnessToneClass}`}>{freshnessLabel}</span>
        </div>
      </div>

      {syncStatus && (
        <div
          className={`mt-3 rounded-xl border px-3 py-2 ${
            isDark ? 'border-white/10 bg-slate-950/45' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2">
              {syncStatus.state === 'loading' ? (
                <LoaderCircle
                  size={14}
                  className={`mt-0.5 animate-spin ${isDark ? 'text-cyan-200' : 'text-emerald-600'}`}
                />
              ) : syncStatus.state === 'error' ? (
                <CloudOff size={14} className={`mt-0.5 ${isDark ? 'text-amber-200' : 'text-amber-700'}`} />
              ) : (
                <RefreshCcw size={14} className={`mt-0.5 ${isDark ? 'text-cyan-200' : 'text-emerald-600'}`} />
              )}
              <div>
                <p className={`text-[11px] font-medium ${isDark ? 'text-white/85' : 'text-slate-700'}`}>
                  {syncStatus.summary}
                </p>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
                  {syncStatus.note}
                </p>
              </div>
            </div>
            <div className={`text-[10px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              {syncStatus.lastSyncTime
                ? `最近同步 ${formatOfficialSourceTime(syncStatus.lastSyncTime)}`
                : syncStatus.latestRecordTime
                ? `资料更新 ${formatOfficialSourceTime(syncStatus.latestRecordTime)}`
                : '当前使用内置资料'}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2.5">
        {records.map((record) => {
          const cardBody = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                      {record.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        isDark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {record.sourceType}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        isDark ? 'bg-amber-500/10 text-amber-200' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                    {record.sourceLabel} · 更新于 {formatOfficialSourceTime(record.lastUpdated)}
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
                  {record.linkLabel ?? '查看原文'}
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
