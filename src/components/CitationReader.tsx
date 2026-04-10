import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, AlertTriangle } from 'lucide-react';

interface CitationReaderProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
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

export function CitationReader({ open, onClose, title, content, zhSummary, sourceType, sourceRef, sourceDate, reviewStatus }: CitationReaderProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  // Disable body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const badge = SOURCE_BADGE[sourceType] || { label: sourceType, className: 'bg-slate-100 text-slate-600' };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                  {sourceDate && (
                    <span className="text-xs text-slate-400">{sourceDate}</span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-slate-800">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Review status warning */}
            {reviewStatus === 'pending_medical_review' && (
              <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-100 px-5 py-2.5">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">本条尚未经过医学审核</p>
              </div>
            )}
            {reviewStatus === 'community_reviewed' && (
              <div className="flex items-center gap-2 bg-blue-50 border-b border-blue-100 px-5 py-2.5">
                <AlertTriangle size={14} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700">本条已经过社区自审，正在寻找医学专业审核</p>
              </div>
            )}
            {reviewStatus === 'expert_approved' && (
              <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-100 px-5 py-2.5">
                <AlertTriangle size={14} className="text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-700">本条已经过医学专家审核</p>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Language toggle — only for non-curated (English) sources */}
              {sourceType !== 'curated' && zhSummary && (
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <button
                    onClick={() => setShowOriginal(false)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      !showOriginal ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    中文要点
                  </button>
                  <button
                    onClick={() => setShowOriginal(true)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      showOriginal ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    英文原文
                  </button>
                </div>
              )}

              <div className="prose prose-sm prose-slate max-w-none">
                {!showOriginal && zhSummary ? (
                  <>
                    {zhSummary.split('\n').map((p, i) => (
                      p.trim() ? <p key={i} className="text-sm text-slate-700 leading-relaxed mb-3">{p}</p> : null
                    ))}
                    <p className="text-xs text-slate-400 mt-2">⚠ 中文为编译要点，仅供快速参考</p>
                  </>
                ) : (
                  content.split('\n').map((paragraph, i) => (
                    paragraph.trim() ? (
                      <p key={i} className="text-sm text-slate-700 leading-relaxed mb-3">
                        {paragraph}
                      </p>
                    ) : null
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-3">
              {sourceType === 'curated' && (
                <p className="text-xs text-slate-400 mb-2">
                  本条内容为原创编写，参考了公开医学分级方法论
                </p>
              )}
              {sourceRef && (
                <a
                  href={sourceRef}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <ExternalLink size={12} />
                  查看原文 →
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
