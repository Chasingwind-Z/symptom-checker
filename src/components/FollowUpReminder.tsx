import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import type { SymptomTrackingEntry } from '../types'
import { getPendingFollowUp, updateFollowUpStatus } from '../lib/symptomTracking'

function formatDaysAgo(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24))
  if (days <= 1) return '昨天'
  return `${days}天前`
}

interface Props {
  onStartConsultation?: () => void
}

export function FollowUpReminder({ onStartConsultation }: Props) {
  const [entry, setEntry] = useState<SymptomTrackingEntry | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [worseMessage, setWorseMessage] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const pending = getPendingFollowUp()
      if (pending) {
        setEntry(pending)
        // Trigger slide-in on next frame so the transition plays
        requestAnimationFrame(() => setVisible(true))
      }
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [])

  const animateOut = useCallback((onDone?: () => void) => {
    setVisible(false)
    window.setTimeout(() => {
      setDismissed(true)
      onDone?.()
    }, 300)
  }, [])

  const handleResponse = useCallback(
    (status: 'better' | 'same' | 'worse') => {
      if (!entry) return
      updateFollowUpStatus(entry.id, status)

      if (status === 'worse') {
        setWorseMessage(true)
        window.setTimeout(() => animateOut(), 2000)
      } else {
        animateOut()
      }
    },
    [entry, animateOut],
  )

  const handleClose = useCallback(() => {
    animateOut()
  }, [animateOut])

  if (dismissed || !entry) return null

  const symptomsText = entry.symptoms.join('、')
  const timeAgo = formatDaysAgo(entry.timestamp)

  return (
    <div
      className="fixed bottom-6 right-6 z-40 max-w-xs transition-all duration-300 ease-out"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(calc(100% + 2rem))',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="bg-white border border-blue-200 rounded-2xl shadow-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-semibold text-gray-800">
            👋 上次问诊回访
          </span>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors -mt-0.5 -mr-0.5"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {worseMessage ? (
          <div className="py-2">
            <p className="text-sm text-red-600 font-medium">
              建议您重新问诊或就医
            </p>
            {onStartConsultation && (
              <button
                onClick={onStartConsultation}
                className="mt-2 rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-600"
              >
                重新问诊
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              您{timeAgo}提到{symptomsText}，现在感觉怎么样？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse('better')}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                已经好多了
              </button>
              <button
                onClick={() => handleResponse('same')}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                没什么变化
              </button>
              <button
                onClick={() => handleResponse('worse')}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                更严重了
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
