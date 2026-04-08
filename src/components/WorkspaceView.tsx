import { Search, Sparkles } from 'lucide-react'
import { Suspense, lazy, useMemo } from 'react'
import type { SidebarSection } from './AppSidebar'
import { ConversationHistoryPanel } from './ConversationHistoryPanel'
import { HealthSettingsPanel } from './HealthSettingsPanel'
import { JudgmentBasisPanel } from './JudgmentBasisPanel'
import { LazySurfaceFallback } from './LazySurfaceFallback'
import {
  RecordsCenterPanel,
  type RecordsCenterFollowUpItem,
  type RecordsCenterSummaryItem,
} from './RecordsCenterPanel'
import {
  SearchIntelligencePanel,
  type ConnectedWebSearchState,
} from './SearchIntelligencePanel'

const LazySymptomTimeline = lazy(() =>
  import('./SymptomTimeline').then((module) => ({
    default: module.SymptomTimeline,
  }))
)
import { WORKSPACE_TAB_LABELS } from '../lib/appShellUtils'
import type { ChatDensityPreference, DesktopSidebarMode, ExperienceSettings, LocationPreference, OfficialSourcePreference } from '../lib/experienceSettings'
import type { LocationData } from '../lib/geolocation'
import type { HouseholdProfileRecord } from '../lib/healthWorkspaceInsights'
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData'
import { getReportRecords } from '../lib/healthData'
import type { MedicalKnowledgeSearchResult } from '../lib/medicalKnowledge'
import type { ConversationSession, DiagnosisResult } from '../types'

const LazyMedicationRecommendationsPanel = lazy(() =>
  import('./MedicationRecommendationsPanel').then((module) => ({
    default: module.MedicationRecommendationsPanel,
  }))
)

const LazyCloudSyncCard = lazy(() =>
  import('./CloudSyncCard').then((module) => ({
    default: module.CloudSyncCard,
  }))
)

interface WorkspaceViewProps {
  workspaceSection: SidebarSection
  onSelectSection: (section: SidebarSection) => void
  recordSearchQuery: string
  onRecordSearchChange: (value: string) => void
  filteredConversationSessions: ConversationSession[]
  activeSessionId?: string | null
  onOpenSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onStartNewSession: () => void
  filteredRecordsCenterFollowUps: RecordsCenterFollowUpItem[]
  filteredRecordsCenterSummaries: RecordsCenterSummaryItem[]
  filteredCaseCount: number
  knowledgeSearchPreview: MedicalKnowledgeSearchResult | null
  connectedWebSearch: ConnectedWebSearchState
  searchPersonalizationHintVisible: boolean
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
  experienceSettings: ExperienceSettings
  currentCity?: string | null
  conversationCount: number
  conversationSessions: ConversationSession[]
  pendingFollowUpCount: number
  onDesktopSidebarModeChange: (value: DesktopSidebarMode) => void
  onLocationPreferenceChange: (value: LocationPreference) => void
  onOfficialSourcePreferenceChange: (value: OfficialSourcePreference) => void
  onChatDensityChange: (value: ChatDensityPreference) => void
  onResetExperienceSettings: () => void
  diagnosisResult: DiagnosisResult | null
  locationData: LocationData | null
  onOpenConversation: (sessionId: string) => void
  recordsCenterFollowUps: RecordsCenterFollowUpItem[]
  recordsCenterSummaries: RecordsCenterSummaryItem[]
}

export function WorkspaceView({
  workspaceSection,
  onSelectSection,
  recordSearchQuery,
  onRecordSearchChange,
  filteredConversationSessions,
  activeSessionId,
  onOpenSession,
  onDeleteSession,
  onStartNewSession,
  filteredRecordsCenterFollowUps,
  filteredRecordsCenterSummaries,
  filteredCaseCount,
  knowledgeSearchPreview,
  connectedWebSearch,
  searchPersonalizationHintVisible,
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
  experienceSettings,
  currentCity,
  conversationCount,
  conversationSessions,
  pendingFollowUpCount,
  onDesktopSidebarModeChange,
  onLocationPreferenceChange,
  onOfficialSourcePreferenceChange,
  onChatDensityChange,
  onResetExperienceSettings,
  diagnosisResult,
  locationData,
  onOpenConversation,
  recordsCenterFollowUps,
  recordsCenterSummaries,
}: WorkspaceViewProps) {
  const reportRecords = useMemo(() => getReportRecords(), []);
  return (
    <div className="space-y-4 py-5">
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

      {workspaceSection === 'search' && (
        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-slate-900">查记录</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  支持按症状、标题、建议、科室和随访说明搜索会话与记录。
                </p>
              </div>
              {recordSearchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => onRecordSearchChange('')}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                >
                  清空关键词
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={16} className="text-slate-400" />
              <input
                value={recordSearchQuery}
                onChange={(event) => onRecordSearchChange(event.target.value)}
                placeholder="例如：发烧、头痛、消化内科、复诊、去医院"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            {searchPersonalizationHintVisible && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] text-violet-700">
                <Sparkles size={12} />
                已结合档案与最近记录排序
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[11px] text-slate-500">匹配会话</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {filteredConversationSessions.length} 段
                </p>
                <p className="mt-1 text-[11px] text-slate-500">覆盖标题、提问与分诊建议。</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[11px] text-slate-500">待跟进</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {filteredRecordsCenterFollowUps.length} 项
                </p>
                <p className="mt-1 text-[11px] text-slate-500">适合搜索随访提醒与待补充信息。</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[11px] text-slate-500">问诊摘要</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{filteredCaseCount} 条</p>
                <p className="mt-1 text-[11px] text-slate-500">支持按科室、风险和摘要内容查找。</p>
              </div>
            </div>
          </section>

          {recordSearchQuery.trim() && (
            <SearchIntelligencePanel
              query={recordSearchQuery.trim()}
              knowledgeResult={knowledgeSearchPreview}
              webSearch={connectedWebSearch}
            />
          )}

          {recordSearchQuery.trim() ? (
            <>
              <ConversationHistoryPanel
                sessions={filteredConversationSessions}
                activeSessionId={activeSessionId}
                onOpenSession={onOpenSession}
                onDeleteSession={onDeleteSession}
                onStartNewSession={onStartNewSession}
                title="匹配会话"
                description={
                  searchPersonalizationHintVisible
                    ? `当前关键词“${recordSearchQuery}”命中的历史线程，已结合档案与最近记录微调排序`
                    : `当前关键词“${recordSearchQuery}”命中的历史线程`
                }
                emptyMessage="没有匹配到相关会话，请换一个症状或建议关键词。"
              />

              <RecordsCenterPanel
                statusLabel="搜索结果"
                title="匹配的记录与随访"
                helperText={
                  searchPersonalizationHintVisible
                    ? '同步展示待跟进项目和最近完成的摘要，并结合档案与最近记录微调排序。'
                    : '同步展示待跟进项目和最近完成的摘要，方便直接回看或继续咨询。'
                }
                followUps={filteredRecordsCenterFollowUps}
                recentSummaries={filteredRecordsCenterSummaries}
                emptyFollowUpsMessage="没有匹配到待跟进项目。"
                emptySummariesMessage="没有匹配到最近摘要。"
              />
            </>
          ) : (
            <section className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
              在上方输入症状、标题、科室或建议后，这里会同步展示匹配的会话、摘要和随访记录。
            </section>
          )}
        </div>
      )}

      {workspaceSection === 'evidence' && (
        <JudgmentBasisPanel
          diagnosisResult={diagnosisResult}
          knowledgeResult={knowledgeSearchPreview}
          webSearch={connectedWebSearch}
        />
      )}

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
        </div>
      )}

      {workspaceSection === 'settings' && (
        <HealthSettingsPanel
          settings={experienceSettings}
          currentCity={currentCity}
          conversationCount={conversationCount}
          pendingFollowUpCount={pendingFollowUpCount}
          sessionEmail={sessionEmail}
          onDesktopSidebarModeChange={onDesktopSidebarModeChange}
          onLocationPreferenceChange={onLocationPreferenceChange}
          onOfficialSourcePreferenceChange={onOfficialSourcePreferenceChange}
          onChatDensityChange={onChatDensityChange}
          onReset={onResetExperienceSettings}
        />
      )}

      {workspaceSection === 'history' && (
        <ConversationHistoryPanel
          sessions={filteredConversationSessions}
          activeSessionId={activeSessionId}
          onOpenSession={onOpenSession}
          onDeleteSession={onDeleteSession}
          onStartNewSession={onStartNewSession}
          title={recordSearchQuery.trim() ? '筛选后的历史会话' : '历史会话'}
          description={
            recordSearchQuery.trim()
              ? searchPersonalizationHintVisible
                ? `已按“${recordSearchQuery}”筛选历史线程，并结合档案与最近记录微调排序。`
                : `已按“${recordSearchQuery}”筛选历史线程。`
              : '所有会话会按最近更新时间排序，点击即可回到原线程继续问诊。'
          }
          emptyMessage={
            recordSearchQuery.trim()
              ? '当前关键词没有匹配到会话。'
              : '还没有历史会话。完成一次问诊后，这里会自动保存新的线程。'
          }
        />
      )}

      {workspaceSection === 'medication' && (
        <Suspense
          fallback={
            <LazySurfaceFallback
              title="正在准备用药建议"
              description="正在按需加载个性化支持方向和风险提醒，马上就好。"
            />
          }
        >
          <LazyMedicationRecommendationsPanel
            profile={profile}
            currentDiagnosis={diagnosisResult}
            activeSessionId={activeSessionId}
            conversationSessions={conversationSessions}
            recentCases={recentCases}
            currentLocation={locationData}
            onOpenConversation={onOpenConversation}
            onStartNewConversation={onStartNewSession}
          />
        </Suspense>
      )}

      {workspaceSection === 'records' && (
        <>
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
          {reportRecords.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-800 mb-2">📋 报告解读历史</p>
              {reportRecords.slice(-5).reverse().map(record => (
                <div key={record.id} className="border-t border-slate-100 py-2 first:border-t-0">
                  <p className="text-xs font-medium text-slate-700">{record.reportType}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{record.summary}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{record.analyzedAt}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
