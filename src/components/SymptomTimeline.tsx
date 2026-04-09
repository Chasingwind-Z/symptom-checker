import { useState, useEffect } from 'react'
import { Activity, CheckCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react'
import type { SymptomTrackingEntry } from '../types'
import { getRecentTracking, updateFollowUpStatus, deleteTrackingEntry } from '../lib/symptomTracking'

const LEVEL_COLORS: Record<string, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-400',
  red: 'bg-red-500',
}

const LEVEL_LABELS: Record<string, string> = {
  green: '低风险',
  yellow: '中风险',
  orange: '较高',
  red: '紧急',
}

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  pending: { text: '追踪中', className: 'text-slate-500' },
  better: { text: '已好转', className: 'text-emerald-600' },
  same: { text: '没有变化', className: 'text-yellow-600' },
  worse: { text: '更严重了', className: 'text-red-600' },
}

const FOLLOW_UP_DELAY = 48 * 60 * 60 * 1000

function formatTimeAgo(timestamp: number, referenceNow: number): string {
  const diff = referenceNow - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  return `${days}天前`
}

interface Props {
  onStartConsultation?: () => void
}

export function SymptomTimeline({ onStartConsultation }: Props) {
  const [entries, setEntries] = useState<SymptomTrackingEntry[]>([])
  const [followUpId, setFollowUpId] = useState<string | null>(null)
  const [now, setNow] = useState(0)

  useEffect(() => {
    window.setTimeout(() => {
      setNow(Date.now())
      setEntries(getRecentTracking(5))
    }, 0)
  }, [])

  function handleFollowUp(entryId: string, status: 'better' | 'same' | 'worse') {
    updateFollowUpStatus(entryId, status)
    setEntries(getRecentTracking(5))
    setFollowUpId(null)
  }

  function handleDelete(entryId: string) {
    deleteTrackingEntry(entryId)
    setEntries(getRecentTracking(5))
  }

  function needsFollowUp(entry: SymptomTrackingEntry): boolean {
    return entry.followUpStatus === 'pending' && now - entry.timestamp >= FOLLOW_UP_DELAY
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Activity size={16} />
          暂无症状追踪记录
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Activity size={16} />
        症状追踪
      </div>

      <div className="space-y-0">
        {entries.map((entry, idx) => {
          const isLast = idx === entries.length - 1
          const statusInfo = STATUS_LABELS[entry.followUpStatus] ?? STATUS_LABELS.pending

          return (
            <div key={entry.id} className="group relative pl-6 pb-4">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[5px] top-3 bottom-0 w-0.5 bg-slate-200" />
              )}

              {/* Timeline dot */}
              <div
                className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ring-2 ring-white ${LEVEL_COLORS[entry.level] ?? 'bg-slate-300'}`}
              />

              {/* Entry content */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={12} />
                    {formatTimeAgo(entry.timestamp, now)}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${LEVEL_COLORS[entry.level] ?? 'bg-slate-300'} text-white`}
                    >
                      {LEVEL_LABELS[entry.level] ?? entry.level}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {entry.symptoms.join(' + ')}
                  </p>

                  {/* Follow-up status */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    {entry.followUpStatus === 'better' && <CheckCircle size={12} className="text-emerald-500" />}
                    {entry.followUpStatus === 'worse' && <AlertTriangle size={12} className="text-red-500" />}
                    <span className={statusInfo.className}>{statusInfo.text}</span>
                  </div>

                  {/* "更严重了" advice */}
                  {entry.followUpStatus === 'worse' && (
                    <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                      <span>建议您重新问诊或就医</span>
                      {onStartConsultation && (
                        <button
                          onClick={onStartConsultation}
                          className="ml-2 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white transition hover:bg-red-600"
                        >
                          重新问诊
                        </button>
                      )}
                    </div>
                  )}

                  {/* Follow-up button */}
                  {needsFollowUp(entry) && followUpId !== entry.id && (
                    <button
                      onClick={() => setFollowUpId(entry.id)}
                      className="mt-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
                    >
                      回访
                    </button>
                  )}

                  {/* Follow-up options */}
                  {followUpId === entry.id && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleFollowUp(entry.id, 'better')}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100"
                      >
                        已好转
                      </button>
                      <button
                        onClick={() => handleFollowUp(entry.id, 'same')}
                        className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs text-yellow-700 transition hover:bg-yellow-100"
                      >
                        没有变化
                      </button>
                      <button
                        onClick={() => handleFollowUp(entry.id, 'worse')}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 transition hover:bg-red-100"
                      >
                        更严重了
                      </button>
                    </div>
                  )}

                  {entry.notes && (
                    <p className="mt-1 text-xs text-slate-400 italic">{entry.notes}</p>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-red-400 group-hover:opacity-100"
                  title="删除记录"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
