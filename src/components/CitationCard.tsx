import { useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { CitationReader } from './CitationReader';

interface CitationCardProps {
  title: string;
  content?: string;
  zhSummary?: string;
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

const REVIEW_BADGES: Record<string, { label: string; className: string }> = {
  pending_medical_review: { label: '待医学审核', className: 'bg-slate-100 text-slate-500' },
  community_reviewed: { label: '社区已审', className: 'bg-blue-50 text-blue-600' },
  expert_approved: { label: '专家已审', className: 'bg-emerald-50 text-emerald-600' },
};

export function CitationCard({ title, content, zhSummary, sourceType, sourceRef, sourceDate, reviewStatus }: CitationCardProps) {
  const [readerOpen, setReaderOpen] = useState(false);
  const badge = SOURCE_BADGE[sourceType] || { label: sourceType, className: 'bg-slate-50 text-slate-600' };

  return (
    <>
      <div
        onClick={() => setReaderOpen(true)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all"
      >
        <div className="flex items-start gap-2">
          <BookOpen size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-medium text-slate-700 truncate">{title}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs ${badge.className}`}>
                {badge.label}
              </span>
              {REVIEW_BADGES[reviewStatus] && (
                <span className={`rounded-full px-2 py-0.5 text-xs ${REVIEW_BADGES[reviewStatus].className}`}>
                  {REVIEW_BADGES[reviewStatus].label}
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
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-0.5 text-xs text-blue-500 hover:underline"
                >
                  原文 <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <CitationReader
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
        title={title}
        content={content || title}
        zhSummary={zhSummary}
        sourceType={sourceType}
        sourceRef={sourceRef}
        sourceDate={sourceDate}
        reviewStatus={reviewStatus}
      />
    </>
  );
}
