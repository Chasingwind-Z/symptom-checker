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
                title="\u6b63\u5728\u6253\u5f00\u5065\u5eb7\u6863\u6848"
                description="\u6b63\u5728\u6309\u9700\u52a0\u8f7d\u540c\u6b65\u72b6\u6001\u3001\u6863\u6848\u6458\u8981\u548c\u4e2a\u6027\u5316\u8d44\u6599\u5361\u7247\u3002"
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
          <HealthSettingsPanel
            currentCity={currentCity}
            conversationCount={conversationCount}
            pendingFollowUpCount={pendingFollowUpCount}
            sessionEmail={sessionEmail}
          />
          <MedicineBoxPanel />
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
            title="\u5386\u53f2\u4f1a\u8bdd"
            description="\u6240\u6709\u4f1a\u8bdd\u4f1a\u6309\u6700\u8fd1\u66f4\u65b0\u65f6\u95f4\u6392\u5e8f\uff0c\u70b9\u51fb\u5373\u53ef\u56de\u5230\u539f\u7ebf\u7a0b\u7ee7\u7eed\u95ee\u8bca\u3002"
            emptyMessage="\u8fd8\u6ca1\u6709\u5386\u53f2\u4f1a\u8bdd\u3002\u5b8c\u6210\u4e00\u6b21\u95ee\u8bca\u540e\uff0c\u8fd9\u91cc\u4f1a\u81ea\u52a8\u4fdd\u5b58\u65b0\u7684\u7ebf\u7a0b\u3002"
          />
          <RecordsCenterPanel
            statusLabel={pendingFollowUpCount > 0 ? '\u5f85\u5904\u7406\u968f\u8bbf\u4e0e\u6700\u8fd1\u6458\u8981' : '\u968f\u8bbf\u4e0e\u8bb0\u5f55'}
            helperText={
              pendingFollowUpCount > 0
                ? '\u4f18\u5148\u56de\u590d\u5f85\u8ddf\u8fdb\u9879\u76ee\uff0c\u518d\u7ee7\u7eed\u6253\u5f00\u6700\u8fd1\u5b8c\u6210\u7684\u6458\u8981\u6216\u539f\u95ee\u8bca\u8bb0\u5f55\u3002'
                : '\u65b0\u7684\u968f\u8bbf\u63d0\u9192\u548c\u6700\u8fd1\u5b8c\u6210\u7684\u6458\u8981\u4f1a\u7edf\u4e00\u6c47\u603b\u5728\u8fd9\u91cc\uff0c\u65b9\u4fbf\u968f\u65f6\u56de\u770b\u548c\u7ee7\u7eed\u54a8\u8be2\u3002'
            }
            followUps={recordsCenterFollowUps}
            recentSummaries={recordsCenterSummaries}
            emptyFollowUpsMessage="\u5f53\u524d\u6ca1\u6709\u5f85\u56de\u590d\u968f\u8bbf\u3002\u65b0\u7684\u590d\u8bca\u63d0\u9192\u6216\u89c2\u5bdf\u4efb\u52a1\u51fa\u73b0\u540e\uff0c\u4f1a\u81ea\u52a8\u6c47\u603b\u5728\u8fd9\u91cc\u3002"
            emptySummariesMessage="\u8fd8\u6ca1\u6709\u6700\u8fd1\u5b8c\u6210\u7684\u6458\u8981\u3002\u5b8c\u6210\u4e00\u6b21\u95ee\u8bca\u6216\u968f\u8bbf\u540e\uff0c\u8bb0\u5f55\u4e2d\u5fc3\u4f1a\u81ea\u52a8\u5c55\u793a\u53ef\u7ee7\u7eed\u6253\u5f00\u7684\u8bb0\u5f55\u3002"
          />
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 px-1">\u75c7\u72b6\u8ffd\u8e2a\u65f6\u95f4\u7ebf</p>
            <Suspense
              fallback={
                <LazySurfaceFallback
                  title="\u6b63\u5728\u52a0\u8f7d\u65f6\u95f4\u7ebf"
                  description="\u6b63\u5728\u6309\u9700\u52a0\u8f7d\u75c7\u72b6\u8ffd\u8e2a\u65f6\u95f4\u7ebf\u7ec4\u4ef6\u3002"
                />
              }
            >
              <LazySymptomTimeline onStartConsultation={onStartNewSession} />
            </Suspense>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 px-1">\u5065\u5eb7\u6307\u6807\u8ffd\u8e2a</p>
            <HealthMetricsTracker />
          </div>
          {weeklyReport && (
            <WeeklyReportCard report={weeklyReport} onClose={() => setWeeklyReport(null)} />
          )}
          {reportRecords.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-800 mb-2">\ud83d\udccb \u62a5\u544a\u89e3\u8bfb\u5386\u53f2</p>
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
