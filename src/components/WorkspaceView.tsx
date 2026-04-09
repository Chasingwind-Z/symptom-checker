import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import type { SidebarSection } from './AppSidebar'
import { ConversationHistoryPanel } from './ConversationHistoryPanel'
import { HealthSettingsPanel } from './HealthSettingsPanel'
import { LazySurfaceFallback } from './LazySurfaceFallback'
import { MedicineBoxPanel } from './MedicineBoxPanel'
import {
  RecordsCenterPanel,
  type RecordsCenterFollowUpItem,
  type RecordsCenterSummaryItem,
} from './RecordsCenterPanel'

const LazySymptomTimeline = lazy(() =>
  import('./SymptomTimeline').then((module) => ({
    default: module.SymptomTimeline,
  }))
)
import { WORKSPACE_TAB_LABELS } from '../lib/appShellUtils'
import type { HouseholdProfileRecord } from '../lib/healthWorkspaceInsights'
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData'
import { getReportRecords } from '../lib/healthData'
import { shouldGenerateWeeklyReport, generateWeeklyReport, markWeeklyReportGenerated, type WeeklyReportData } from '../lib/weeklyReport'
import { WeeklyReportCard } from './WeeklyReportCard'
import { HealthMetricsTracker } from './HealthMetricsTracker'
import type { ConversationSession } from '../types'

const LazyCloudSyncCard = lazy(() =>
  import('./CloudSyncCard').then((module) => ({
    default: module.CloudSyncCard,
  }))
)

interface WorkspaceViewProps {
  workspaceSection: SidebarSection
  onSelectSection: (section: SidebarSection) => void
  filteredConversationSessions: ConversationSession[]
  activeSessionId?: string | null
  onOpenSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onStartNewSession: () => void
  workspaceMode: 'local' | 'cloud-ready' | 'cloud-session' | 'error'
  workspaceStatusLabel: string
  workspaceHelperText: string
  profile: ProfileDraft
  recentCases: CaseHistoryItem[]
  householdProfiles: HouseholdProfileRecord[]
  reportCount: number
  sessionEmail: string | null
  onRefreshWorkspace: () => Promise<void>
  isRefreshingWorkspace: boolean
  onSaveProfile: (patch: Partial<ProfileDraft>) => Promise<unknown>
  onApplyDemoPersona: (personaId: string) => Promise<unknown>
  onSaveHouseholdProfile: (input: {
    id?: string
    label: string
    relationship: string
    profile: ProfileDraft
  }) => HouseholdProfileRecord[]
  onRemoveHouseholdProfile: (id: string) => HouseholdProfileRecord[]
  onOpenWorkspaceSection: (section: SidebarSection) => void
  onOpenAuth: () => void
  currentCity?: string | null
  conversationCount: number
  pendingFollowUpCount: number
  recordsCenterFollowUps: RecordsCenterFollowUpItem[]
  recordsCenterSummaries: RecordsCenterSummaryItem[]
}

export function WorkspaceView({
  workspaceSection,
  onSelectSection,
  filteredConversationSessions,
  activeSessionId,
  onOpenSession,
  onDeleteSession,
  onStartNewSession,
  workspaceMode,
  workspaceStatusLabel,
  workspaceHelperText,
  profile,
  recentCases,
  householdProfiles,
  reportCount,
  sessionEmail,
  onRefreshWorkspace,
  isRefreshingWorkspace,
  onSaveProfile,
  onApplyDemoPersona,
  onSaveHouseholdProfile,
  onRemoveHouseholdProfile,
  onOpenWorkspaceSection,
  onOpenAuth,
  currentCity,
  conversationCount,
  pendingFollowUpCount,
  recordsCenterFollowUps,
  recordsCenterSummaries,
}: WorkspaceViewProps) {
  const reportRecords = useMemo(() => getReportRecords(), []);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);

  useEffect(() => {
    if (shouldGenerateWeeklyReport() && recentCases.length > 0) {
      const report = generateWeeklyReport(recentCases);
      window.setTimeout(() => setWeeklyReport(report), 0);
      markWeeklyReportGenerated();
    }
  }, [recentCases]);

  return (
    <div className="space-y-4 py-5">
      {weeklyReport && (
        <div className="mb-4">
          <WeeklyReportCard report={weeklyReport} onClose={() => setWeeklyReport(null)} />
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {(Object.keys(WORKSPACE_TAB_LABELS) as SidebarSection[]).map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => onSelectSection(section)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              workspaceSection === section
                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {WORKSPACE_TAB_LABELS[section]}
          </button>
        ))}
      </div>

      {workspaceSection === 'profile' && (
        <div className="space-y-4">
          <Suspense
            fallback={
              <LazySurfaceFallback
                title="正在打开健康档案"
                description="正在按需加载同步状态、档案摘要和个性化资料卡片。"
              />
            }
          >
            <LazyCloudSyncCard
              mode={workspaceMode}
              statusLabel={workspaceStatusLabel}
              helperText={workspaceHelperText}
              recentCases={recentCases}
              profile={profile}
              householdProfiles={householdProfiles}
              reportCount={reportCount}
              sessionEmail={sessionEmail}
              onRefresh={onRefreshWorkspace}
              isRefreshing={isRefreshingWorkspace}
              onSaveProfile={onSaveProfile}
              onApplyDemoPersona={onApplyDemoPersona}
              onSaveHouseholdProfile={onSaveHouseholdProfile}
              onRemoveHouseholdProfile={onRemoveHouseholdProfile}
              onOpenWorkspaceSection={onOpenWorkspaceSection}
              onOpenAuth={onOpenAuth}
            />
          </Suspense>
          <MedicineBoxPanel />
          <HealthSettingsPanel
            currentCity={currentCity}
            conversationCount={conversationCount}
            pendingFollowUpCount={pendingFollowUpCount}
            sessionEmail={sessionEmail}
          />
        </div>
      )}

      {workspaceSection === 'records' && (
        <div className="space-y-6">
          <ConversationHistoryPanel
            sessions={filteredConversationSessions}
            activeSessionId={activeSessionId}
            onOpenSession={onOpenSession}
            onDeleteSession={onDeleteSession}
            onStartNewSession={onStartNewSession}
            title="历史会话"
            description="所有会话会按最近更新时间排序，点击即可回到原线程继续问诊。"
            emptyMessage="还没有历史会话。完成一次问诊后，这里会自动保存新的线程。"
          />
          <RecordsCenterPanel
            statusLabel={pendingFollowUpCount > 0 ? '待处理随访与最近摘要' : '随访与记录'}
            helperText={
              pendingFollowUpCount > 0
                ? '优先回复待跟进项目，再继续打开最近完成的摘要或原问诊记录。'
                : '新的随访提醒和最近完成的摘要会统一汇总在这里，方便随时回看和继续咨询。'
            }
            followUps={recordsCenterFollowUps}
            recentSummaries={recordsCenterSummaries}
            emptyFollowUpsMessage="当前没有待回复随访。新的复诊提醒或观察任务出现后，会自动汇总在这里。"
            emptySummariesMessage="还没有最近完成的摘要。完成一次问诊或随访后，记录中心会自动展示可继续打开的记录。"
          />
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 px-1">症状追踪时间线</p>
            <Suspense
              fallback={
                <LazySurfaceFallback
                  title="正在加载时间线"
                  description="正在按需加载症状追踪时间线组件。"
                />
              }
            >
              <LazySymptomTimeline onStartConsultation={onStartNewSession} />
            </Suspense>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 px-1">健康指标追踪</p>
            <HealthMetricsTracker />
          </div>
          {weeklyReport && (
            <WeeklyReportCard report={weeklyReport} onClose={() => setWeeklyReport(null)} />
          )}
          {reportRecords.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-800 mb-2">📋 报告解读历史</p>
              {reportRecords.slice(-5).reverse().map(record => (
                <div key={record.id} className="border-t border-slate-100 py-2 first:border-t-0">
                  <p className="text-xs font-medium text-slate-700">{record.reportType}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{record.summary}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{record.analyzedAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
