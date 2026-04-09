import { ArrowRight, Users } from 'lucide-react'
import type { ProfileDraft } from '../lib/healthData'
import type { HouseholdProfileRecord } from '../lib/healthWorkspaceInsights'

interface HouseholdProfileSwitcherProps {
  currentProfile: ProfileDraft
  householdProfiles: HouseholdProfileRecord[]
  isSwitchingId?: string | null
  onSwitchProfile: (record: HouseholdProfileRecord) => void
  onManageProfiles: () => void
}

function getCurrentProfileLabel(profile: ProfileDraft) {
  const name = profile.displayName.trim()
  if (name) return name
  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : null
  if (age !== null && age < 18) return '孩子'
  if (age !== null && age >= 60) return '长辈'
  return '本人'
}

function buildRecordSummary(record: HouseholdProfileRecord) {
  return [
    record.relationship,
    record.profile.birthYear ? `${new Date().getFullYear() - record.profile.birthYear} 岁` : '',
    record.profile.chronicConditions ? `慢病：${record.profile.chronicConditions.slice(0, 10)}` : '',
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ')
}

export function HouseholdProfileSwitcher({
  currentProfile,
  householdProfiles,
  isSwitchingId,
  onSwitchProfile,
  onManageProfiles,
}: HouseholdProfileSwitcherProps) {
  if (householdProfiles.length === 0) return null

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            <Users size={12} />
            当前为谁咨询
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            正在为「{getCurrentProfileLabel(currentProfile)}」问诊
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            切换到家人后，会自动沿用对应档案里的年龄、慢病和现用药。
          </p>
        </div>
        <button
          type="button"
          onClick={onManageProfiles}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          管理
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {householdProfiles.slice(0, 4).map((record) => (
          <button
            key={record.id}
            type="button"
            onClick={() => onSwitchProfile(record)}
            disabled={isSwitchingId === record.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:border-cyan-200 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-800">{record.label}</p>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
                {record.relationship}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isSwitchingId === record.id ? '切换中…' : buildRecordSummary(record) || '载入这个家庭档案'}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
