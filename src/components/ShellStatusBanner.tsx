import { AlertTriangle, CheckCircle2, RefreshCw, WifiOff } from 'lucide-react'

export type ShellBannerTone = 'warning' | 'success' | 'info'

export interface ShellBannerAction {
  label: string
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
}

export interface ShellStatusBannerProps {
  tone: ShellBannerTone
  title: string
  description: string
  primaryAction?: ShellBannerAction
  secondaryAction?: ShellBannerAction
}

const SHELL_BANNER_STYLES: Record<
  ShellBannerTone,
  {
    container: string
    icon: string
    title: string
    description: string
    primaryButton: string
    secondaryButton: string
  }
> = {
  warning: {
    container: 'border-amber-200 bg-amber-50/95',
    icon: 'bg-amber-100 text-amber-700',
    title: 'text-amber-950',
    description: 'text-amber-900/80',
    primaryButton: 'bg-amber-700 text-white hover:bg-amber-800',
    secondaryButton: 'border border-amber-200 bg-white text-amber-900 hover:bg-amber-100',
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50/95',
    icon: 'bg-emerald-100 text-emerald-700',
    title: 'text-emerald-950',
    description: 'text-emerald-900/80',
    primaryButton: 'bg-emerald-700 text-white hover:bg-emerald-800',
    secondaryButton: 'border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100',
  },
  info: {
    container: 'border-sky-200 bg-sky-50/95',
    icon: 'bg-sky-100 text-sky-700',
    title: 'text-sky-950',
    description: 'text-sky-900/80',
    primaryButton: 'bg-sky-700 text-white hover:bg-sky-800',
    secondaryButton: 'border border-sky-200 bg-white text-sky-900 hover:bg-sky-100',
  },
}

export function ShellStatusBanner({
  tone,
  title,
  description,
  primaryAction,
  secondaryAction,
}: ShellStatusBannerProps) {
  const Icon = tone === 'warning' ? WifiOff : tone === 'success' ? CheckCircle2 : AlertTriangle
  const styles = SHELL_BANNER_STYLES[tone]

  const renderAction = (
    action: ShellBannerAction,
    variant: 'primary' | 'secondary'
  ) => (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled || action.isLoading}
      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton
      }`}
    >
      {action.isLoading && <RefreshCw size={14} className="animate-spin" />}
      {action.label}
    </button>
  )

  return (
    <section
      className={`rounded-2xl border px-4 py-3 shadow-sm ${styles.container}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`rounded-2xl p-2 ${styles.icon}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
            <p className={`mt-1 text-sm leading-relaxed ${styles.description}`}>{description}</p>
          </div>
        </div>

        {(secondaryAction || primaryAction) && (
          <div className="flex flex-wrap gap-2">
            {secondaryAction && renderAction(secondaryAction, 'secondary')}
            {primaryAction && renderAction(primaryAction, 'primary')}
          </div>
        )}
      </div>
    </section>
  )
}
