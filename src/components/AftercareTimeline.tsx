import { Clock3, ShieldAlert } from 'lucide-react'
import type { AftercarePlan } from '../lib/aftercarePlan'

const STEP_TONE_CLASS = {
  green: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
  yellow: 'border-amber-100 bg-amber-50/80 text-amber-700',
  orange: 'border-orange-100 bg-orange-50/80 text-orange-700',
  red: 'border-rose-100 bg-rose-50/80 text-rose-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
} as const

interface AftercareTimelineProps {
  plan: AftercarePlan
}

export function AftercareTimeline({ plan }: AftercareTimelineProps) {
  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600">
            <Clock3 size={12} />
            诊后计划
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">{plan.headline}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{plan.note}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {plan.steps.map((step) => (
          <article key={step.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                STEP_TONE_CLASS[step.tone]
              }`}
            >
              {step.windowLabel}
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{step.title}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{step.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-600">
        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-slate-500" />
        这份计划用于帮助你安排接下来几步，不替代医生面诊；一旦出现明显加重或新的危险信号，应及时升级处理。
      </div>
    </section>
  )
}
