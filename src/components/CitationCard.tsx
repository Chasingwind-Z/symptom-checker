import { BookOpen, ExternalLink } from 'lucide-react';

interface CitationCardProps {
  title: string;
  sourceType: string;
  sourceRef: string;
  sourceDate?: string;
  reviewStatus: string;
}

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  curated: { label: '自策展', className: 'bg-blue-50 text-blue-700' },
  medlineplus: { label: 'MedlinePlus', className: 'bg-emerald-50 text-emerald-700' },
  cdc: { label: 'CDC', className: 'bg-violet-50 text-violet-700' },
};

export function CitationCard({ title, sourceType, sourceRef, sourceDate, reviewStatus }: CitationCardProps) {
  const badge = SOURCE_BADGE[sourceType] || { label: sourceType, className: 'bg-slate-50 text-slate-600' };

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-start gap-2">
        <BookOpen size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-medium text-slate-700 truncate">{title}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs ${badge.className}`}>
              {badge.label}
            </span>
            {reviewStatus === 'pending_medical_review' && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                待医学审核
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {sourceDate && (
              <span className="text-xs text-slate-400">{sourceDate}</span>
            )}
            {sourceRef && (
              <a
                href={sourceRef}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-xs text-blue-500 hover:underline"
              >
                原文 <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
