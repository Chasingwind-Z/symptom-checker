import { RefreshCw } from 'lucide-react'

export function LazySurfaceFallback({
  title,
  description,
  fullHeight = false,
}: {
  title: string
  description: string
  fullHeight?: boolean
}) {
  const content = (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/95 px-6 py-7 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        <RefreshCw size={14} className="animate-spin" />
        正在准备内容
      </div>
      <h2 className="mt-3 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  )

  if (fullHeight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-4 py-6 md:px-6">
        {content}
      </div>
    )
  }

  return content
}
