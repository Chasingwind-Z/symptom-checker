import { ExternalLink, Globe, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import type { MedicalKnowledgeSearchResult } from '../lib/medicalKnowledge';

export interface ConnectedWebSearchState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  sourceLabel?: string;
  fetchedAt?: string;
  message?: string;
  results?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

interface SearchIntelligencePanelProps {
  query: string;
  knowledgeResult: MedicalKnowledgeSearchResult | null;
  webSearch: ConnectedWebSearchState;
}

function trimText(value: string, maxLength = 88) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}…` : value;
}

function buildBingSearchUrl(query: string) {
  return `https://cn.bing.com/search?q=${encodeURIComponent(`${query} 官方 指南 注意事项`)}`;
}

function formatFetchedAt(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getKnowledgeStorageLabel(storageMode?: string) {
  if (!storageMode) return '内置基础资料'
  return storageMode.includes('supabase') ? '已同步资料库' : '内置基础资料'
}

function getKnowledgeCategoryLabel(category: string) {
  switch (category) {
    case 'danger_signs':
      return '危险信号'
    case 'department_guidance':
      return '科室建议'
    case 'population_guidance':
      return '重点人群'
    case 'self_care':
      return '居家处理'
    default:
      return '症状资料'
  }
}

export function SearchIntelligencePanel({
  query,
  knowledgeResult,
  webSearch,
}: SearchIntelligencePanelProps) {
  const knowledgeDocs = knowledgeResult?.documents.slice(0, 4) ?? [];
  const webResults = webSearch.results?.slice(0, 3) ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] text-violet-700">
            <Sparkles size={12} />
            相关资料
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-900">同一个问题，直接看可继续核对的资料</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            输入症状或问题后，这里会整理本次判断可参考的资料、更新时间、适用人群和公开来源。
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500">
          当前检索：{query}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-violet-700" />
                <p className="text-sm font-semibold text-slate-800">资料参考</p>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {knowledgeResult
                  ? `${knowledgeResult.sourceLabel} · ${knowledgeResult.retrievalLabel}`
                  : '会优先展示与当前问题最相关的资料片段、危险信号和处理建议。'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {knowledgeResult?.focusPopulation && (
                <span className="rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-[10px] text-violet-700">
                  重点人群：{knowledgeResult.focusPopulation}
                </span>
              )}
              {knowledgeResult && (
                <span className="rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-[10px] text-slate-500">
                  {getKnowledgeStorageLabel(knowledgeResult.storageMode)}
                </span>
              )}
            </div>
          </div>

          {knowledgeDocs.length > 0 ? (
            <div className="mt-3 space-y-3">
              {knowledgeResult && (
                <div className="rounded-2xl border border-violet-100 bg-white/90 px-4 py-3 text-[11px] leading-relaxed text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">
                      资料状态：{getKnowledgeStorageLabel(knowledgeResult.storageMode)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      更新时间：{knowledgeResult.lastUpdated || '最近一次同步'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      命中资料：{knowledgeDocs.length} 条
                    </span>
                    {knowledgeResult.queryExpansions.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        补充词：{knowledgeResult.queryExpansions.slice(0, 2).join('、')}
                      </span>
                    )}
                  </div>
                  <p className="mt-2">这里只保留你现在最值得先看的资料，不展示底层实现细节。</p>
                </div>
              )}
              {knowledgeDocs.map((item) => (
                <article
                  key={item.document.id}
                  className="rounded-2xl border border-violet-100 bg-white/90 px-4 py-4"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{item.document.title}</p>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                      {getKnowledgeCategoryLabel(item.document.category)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      {item.document.audience}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.snippet}</p>
                  {item.matchedTerms.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.matchedTerms.slice(0, 4).map((term) => (
                        <span
                          key={term}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.reasons.length > 0 && (
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                      相关原因：{trimText(item.reasons.join('；'), 92)}
                    </p>
                  )}
                  {item.document.sourceLabel && (
                    <p className="text-xs text-slate-400 mt-1">参考来源：{item.document.sourceLabel}</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-violet-100 bg-white/80 px-4 py-4 text-sm text-slate-500">
              当前关键词还没有命中明显的知识片段；可以换成更具体的症状、部位、持续时间或药名。
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-emerald-700" />
                <p className="text-sm font-semibold text-slate-800">公开资料核对</p>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {webSearch.sourceLabel || '优先展示可继续核对的公开资料；暂时没有时会给你一个外部检索入口。'}
              </p>
            </div>
            {webSearch.fetchedAt && (
              <span className="rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-[10px] text-slate-500">
                {formatFetchedAt(webSearch.fetchedAt)}
              </span>
            )}
          </div>

          {webSearch.status === 'loading' ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white/90 px-3 py-2 text-sm text-emerald-700">
              <Loader2 size={14} className="animate-spin" />
              正在整理公开资料结果…
            </div>
          ) : webResults.length > 0 ? (
            <div className="mt-3 space-y-3">
              {webResults.map((item) => (
                <a
                  key={`${item.title}-${item.url}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-emerald-100 bg-white/90 px-4 py-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{trimText(item.title, 52)}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {trimText(item.snippet, 120)}
                      </p>
                    </div>
                    <ExternalLink size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-emerald-100 bg-white/80 px-4 py-4">
              <p className="text-sm text-slate-600">
                {webSearch.message || '暂时没有拿到更多公开资料，可以先从外部继续核对。'}
              </p>
              <a
                href={buildBingSearchUrl(query)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                继续查公开资料
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
