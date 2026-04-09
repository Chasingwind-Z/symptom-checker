import { ExternalLink, Globe, Search, ShieldCheck } from 'lucide-react'
import type { MedicalKnowledgeSearchResult } from '../lib/medicalKnowledge'
import { getRiskPresentation } from '../lib/riskPresentation'
import type { DiagnosisResult } from '../types'
import type { ConnectedWebSearchState } from './SearchIntelligencePanel'

interface JudgmentBasisPanelProps {
  diagnosisResult: DiagnosisResult | null
  knowledgeResult: MedicalKnowledgeSearchResult | null
  webSearch: ConnectedWebSearchState
}

function trimText(value: string, maxLength = 88) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}…` : value
}

function formatFetchedAt(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function JudgmentBasisPanel({
  diagnosisResult,
  knowledgeResult,
  webSearch,
}: JudgmentBasisPanelProps) {
  if (!diagnosisResult) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          <ShieldCheck size={12} />
          判断依据
        </div>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">完成一次问诊后，这里会整理判断依据</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          包括本次分级的主要原因、参考到的医学知识，以及可继续核对的公开资料。
        </p>
      </section>
    )
  }

  const riskMeta = getRiskPresentation(diagnosisResult.level)
  const knowledgeDocs = knowledgeResult?.documents.slice(0, 3) ?? []
  const webResults = webSearch.results?.slice(0, 2) ?? []

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            <ShieldCheck size={12} />
            判断依据
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">这次判断为什么会落到这个级别</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            先看分级理由，再看补充知识和公开资料，方便你理解“为什么这样建议”，而不是只看结论。
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${riskMeta.tone}`}>
          当前分级：{riskMeta.label}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
        <p className="text-xs text-slate-500">本次主要判断</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{diagnosisResult.reason}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{diagnosisResult.action}</p>
        {diagnosisResult.departments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {diagnosisResult.departments.map((department) => (
              <span
                key={department}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
              >
                {department}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ShieldCheck size={15} className="text-cyan-600" />
            分诊规则
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            本次分级主要基于你的症状描述、追问补充、危险信号规则，以及年龄 / 慢病等背景做了保守判断。
          </p>
        </article>

        <article className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Search size={15} className="text-violet-700" />
            医学知识参考
          </div>
          {knowledgeDocs.length > 0 ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-slate-500">
                {knowledgeResult?.sourceLabel}
                {knowledgeResult?.retrievalLabel ? ` · ${knowledgeResult.retrievalLabel}` : ''}
              </p>
              {knowledgeDocs.map((item) => (
                <div key={item.document.id} className="rounded-xl border border-violet-100 bg-white/90 px-3 py-2">
                  <p className="text-xs font-medium text-slate-800">{item.document.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {trimText(item.snippet, 92)}
                  </p>
                  {item.document.sourceLabel && (
                    <p className="text-xs text-slate-400 mt-1">参考来源：{item.document.sourceLabel}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              当前没有额外展开的知识片段，但分诊结论仍已按症状规则和风险阈值完成。
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Globe size={15} className="text-emerald-700" />
            公开资料核对
          </div>
          {webResults.length > 0 ? (
            <div className="mt-2 space-y-2">
              {webSearch.fetchedAt && (
                <p className="text-xs text-slate-500">更新时间：{formatFetchedAt(webSearch.fetchedAt)}</p>
              )}
              {webResults.map((item) => (
                <a
                  key={`${item.title}-${item.url}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-emerald-100 bg-white/90 px-3 py-2 transition-colors hover:bg-emerald-50/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800">{trimText(item.title, 44)}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {trimText(item.snippet, 86)}
                      </p>
                    </div>
                    <ExternalLink size={13} className="mt-0.5 shrink-0 text-slate-400" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              暂时没有额外联网结果时，可以先结合上面的分诊理由和用药 / 就医建议继续处理。
            </p>
          )}
        </article>
      </div>
    </section>
  )
}
