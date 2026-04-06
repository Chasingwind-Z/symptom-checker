import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppSidebar, type SidebarSection } from './components/AppSidebar';
import { AgentOrchestrationPanel } from './components/AgentOrchestrationPanel';
import { AuthDialog } from './components/AuthDialog';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { CloudSyncCard } from './components/CloudSyncCard';
import { ConversationHistoryPanel } from './components/ConversationHistoryPanel';
import { DiagnosisProgress } from './components/DiagnosisProgress';
import { EpidemicDashboard } from './components/EpidemicDashboard';
import { Header } from './components/Header';
import { MedicationRecommendationsPanel } from './components/MedicationRecommendationsPanel';
import {
  RecordsCenterPanel,
  type RecordsCenterSummaryItem,
} from './components/RecordsCenterPanel';
import { ResultCard } from './components/ResultCard';
import { ToolCallIndicator } from './components/ToolCallIndicator';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useChat } from './hooks/useChat';
import { useHealthWorkspace } from './hooks/useHealthWorkspace';
import { usePwaInstall } from './hooks/usePwaInstall';
import type { CaseHistoryItem } from './lib/healthData';
import { getRecommendedHospitals } from './lib/mockHospitals';
import { getUserLocation, searchNearbyHospitals } from './lib/nearbyHospitals';
import { buildCombinedMedicalNotes } from './lib/personalization';
import type { ConversationSession, Hospital, SendMessageInput } from './types';

const WORKSPACE_TAB_LABELS: Record<SidebarSection, string> = {
  search: '搜索记录',
  profile: '健康档案',
  history: '历史会话',
  records: '记录中心',
  medication: '用药建议',
};

function getReportCount(): number {
  try {
    return (JSON.parse(localStorage.getItem('symptom_reports') ?? '[]') as unknown[]).length;
  } catch {
    return 0;
  }
}

function stripRecordMetadata(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRecordKey(content: string): string {
  return stripRecordMetadata(content).replace(/[^a-z0-9\u4e00-\u9fff]/gi, '').toLowerCase();
}

function matchesSearchQuery(value: string | null | undefined, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return normalizeRecordKey(value ?? '').includes(normalizedQuery);
}

function getConversationReferenceText(session: ConversationSession): string {
  const firstUserMessage = session.messages.find((message) => message.role === 'user');
  return stripRecordMetadata(firstUserMessage?.content ?? session.title);
}

function findMatchingConversation(
  summary: string,
  sessions: ConversationSession[]
): ConversationSession | null {
  const summaryKey = normalizeRecordKey(summary);
  if (!summaryKey) return null;

  return (
    sessions.find((session) => {
      const sessionKey = normalizeRecordKey(getConversationReferenceText(session));
      return Boolean(sessionKey) && (sessionKey.includes(summaryKey) || summaryKey.includes(sessionKey));
    }) ?? null
  );
}

function findMatchingCase(summary: string, recentCases: CaseHistoryItem[]): CaseHistoryItem | null {
  const summaryKey = normalizeRecordKey(summary);
  if (!summaryKey) return null;

  return (
    recentCases.find((item) => {
      const caseKey = normalizeRecordKey(item.chiefComplaint);
      return Boolean(caseKey) && (caseKey.includes(summaryKey) || summaryKey.includes(caseKey));
    }) ?? null
  );
}

function formatDateTimeLabel(value: string | number): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '刚刚';

  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function trimText(text: string, maxLength = 92): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

function getConversationSourceLabel(storage: ConversationSession['storage']): string {
  return storage === 'supabase' ? '云端会话' : '本机会话';
}

function getCaseSourceLabel(source: CaseHistoryItem['source']): string {
  return source === 'supabase' ? '云端摘要' : '本机摘要';
}

export default function App() {
  const workspace = useHealthWorkspace();
  const pwa = usePwaInstall();
  const chatMemoryContext = useMemo(
    () => ({
      profile: {
        ...workspace.profile,
        medicalNotes: buildCombinedMedicalNotes(workspace.profile),
      },
      recentCases: workspace.recentCases,
    }),
    [workspace.profile, workspace.recentCases]
  );
  const {
    messages,
    isLoading,
    streamingContent,
    diagnosisResult,
    isSearchingKB,
    activeToolCalls,
    activeAgentRoute,
    activeSessionId,
    conversationSessions,
    pendingFollowUpRecords,
    completedFollowUpRecords,
    activeFollowUpRecord,
    sendMessage,
    openFollowUpRecord,
    loadConversationSession,
    resetChat,
  } = useChat(chatMemoryContext);

  const bottomRef = useRef<HTMLDivElement>(null);
  const previousShellStateRef = useRef<{
    page: 'home' | 'chat' | 'workspace';
    section: SidebarSection;
  }>({
    page: 'home',
    section: 'profile',
  });
  const [, setReportCount] = useState<number>(getReportCount);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentPage, setCurrentPage] = useState<'home' | 'chat' | 'workspace' | 'map'>('home');
  const [workspaceSection, setWorkspaceSection] = useState<SidebarSection>('profile');
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const profileCompletion = useMemo(
    () =>
      Math.round(
        ([
          workspace.profile.displayName,
          workspace.profile.city,
          workspace.profile.birthYear,
          workspace.profile.gender,
          workspace.profile.medicalNotes,
          workspace.profile.chronicConditions,
          workspace.profile.allergies,
          workspace.profile.currentMedications,
          workspace.profile.careFocus,
        ].filter(Boolean).length /
          9) *
          100
      ) || 0,
    [workspace.profile]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (!diagnosisResult) {
      return;
    }
    getUserLocation()
      .then(([lng, lat]) => searchNearbyHospitals(lng, lat, diagnosisResult.level))
      .then(setHospitals)
      .catch(() => {
        setHospitals(getRecommendedHospitals(diagnosisResult.level, diagnosisResult.departments));
      });
  }, [diagnosisResult]);

  const defaultWorkspaceSection: SidebarSection = 'profile';

  const handleSendMessage = useCallback(
    (input: string | SendMessageInput) => {
      setCurrentPage('chat');
      sendMessage(input);
    },
    [sendMessage]
  );

  const handleResetChat = useCallback(() => {
    resetChat();
    setCurrentPage('home');
  }, [resetChat]);

  const handleOpenConversation = useCallback(
    (sessionId: string) => {
      if (loadConversationSession(sessionId)) {
        setCurrentPage('chat');
      }
    },
    [loadConversationSession]
  );

  const handleOpenWorkspaceSection = useCallback((section: SidebarSection) => {
    setWorkspaceSection(section);
    setCurrentPage('workspace');
  }, []);

  const handleOpenWorkspace = useCallback(() => {
    setWorkspaceSection(defaultWorkspaceSection);
    setCurrentPage('workspace');
  }, [defaultWorkspaceSection]);

  const handleRecordSearchChange = useCallback((value: string) => {
    setRecordSearchQuery(value);
    if (value.trim()) {
      setWorkspaceSection('search');
      setCurrentPage('workspace');
    }
  }, []);

  const handleOpenMap = useCallback(() => {
    const previousPage =
      currentPage === 'workspace'
        ? 'workspace'
        : currentPage === 'home' && messages.length > 0
          ? 'chat'
          : currentPage === 'map'
            ? 'home'
            : currentPage;

    previousShellStateRef.current = {
      page: previousPage,
      section: workspaceSection,
    };
    setCurrentPage('map');
  }, [currentPage, messages.length, workspaceSection]);

  const handleOpenAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true);
  }, []);

  const handleCloseAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false);
  }, []);

  const handleOpenFollowUp = useCallback(
    (recordId: string) => {
      if (openFollowUpRecord(recordId)) {
        setCurrentPage('chat');
      }
    },
    [openFollowUpRecord]
  );

  const recordsCenterFollowUps = useMemo(() => {
    return pendingFollowUpRecords.map((record) => {
      const matchedSession = findMatchingConversation(record.summary, conversationSessions);
      const matchedCase = findMatchingCase(record.summary, workspace.recentCases);
      const summaryContext =
        matchedSession?.diagnosisResult?.reason ??
        matchedCase?.assistantPreview ??
        `系统已为“${record.summary}”生成后续跟进提醒，建议补充症状变化和就诊进度。`;

      return {
        id: record.id,
        title: record.summary,
        summary: trimText(`围绕这次记录继续补充变化：${summaryContext}`),
        statusLabel: activeFollowUpRecord?.id === record.id ? '正在回复' : '待跟进',
        metaLabel: `回访时间 · ${formatDateTimeLabel(record.dueAt)}`,
        sourceLabel: matchedSession
          ? `${getConversationSourceLabel(matchedSession.storage)} · 原问诊`
          : matchedCase
            ? `${getCaseSourceLabel(matchedCase.source)} · 问诊摘要`
            : '自动随访',
        riskLevel: matchedSession?.riskLevel ?? matchedCase?.triageLevel ?? record.level,
        tags: [record.district],
        isActive: activeFollowUpRecord?.id === record.id,
        primaryAction: {
          label: activeFollowUpRecord?.id === record.id ? '继续回复' : '回复随访',
          onClick: () => handleOpenFollowUp(record.id),
          tone: 'primary' as const,
        },
        secondaryAction: matchedSession
          ? {
              label: '打开记录',
              onClick: () => handleOpenConversation(matchedSession.id),
            }
          : undefined,
      };
    });
  }, [
    activeFollowUpRecord,
    conversationSessions,
    handleOpenConversation,
    handleOpenFollowUp,
    pendingFollowUpRecords,
    workspace.recentCases,
  ]);

  const recordsCenterSummaries = useMemo(() => {
    const items: RecordsCenterSummaryItem[] = [];
    const linkedSessionIds = new Set<string>();

    completedFollowUpRecords.slice(0, 3).forEach((record) => {
      const matchedSession = findMatchingConversation(record.summary, conversationSessions);
      const matchedCase = findMatchingCase(record.summary, workspace.recentCases);
      if (matchedSession) {
        linkedSessionIds.add(matchedSession.id);
      }

      const responseLabel = record.response ? `最近一次随访反馈：${record.response}。` : '该随访已完成。';
      const contextSummary =
        matchedSession?.diagnosisResult?.reason ??
        matchedCase?.assistantPreview ??
        '可继续打开相关记录，回看上次的问诊判断与后续建议。';

      items.push({
        id: `followup-summary-${record.id}`,
        title: `随访 · ${record.summary}`,
        summary: trimText(`${responseLabel}${contextSummary}`),
        metaLabel: `完成于 ${formatDateTimeLabel(record.respondedAt ?? record.createdAt)}`,
        sourceLabel: matchedSession
          ? `${getConversationSourceLabel(matchedSession.storage)} · 已完成随访`
          : matchedCase
            ? `${getCaseSourceLabel(matchedCase.source)} · 已完成随访`
            : '已完成随访',
        departments: matchedSession?.diagnosisResult?.departments ?? matchedCase?.departments ?? [],
        riskLevel: matchedSession?.riskLevel ?? matchedCase?.triageLevel ?? record.level,
        primaryAction: matchedSession
          ? {
              label: '继续咨询',
              onClick: () => handleOpenConversation(matchedSession.id),
              tone: 'primary',
            }
          : undefined,
      });
    });

    conversationSessions
      .filter((session) => session.diagnosisResult && !linkedSessionIds.has(session.id))
      .slice(0, Math.max(0, 4 - items.length))
      .forEach((session) => {
        items.push({
          id: session.id,
          title: session.title,
          summary: trimText(
            session.diagnosisResult?.reason ?? '已生成分诊摘要，可继续回到原会话补充新的变化。'
          ),
          metaLabel: `更新于 ${formatDateTimeLabel(session.updatedAt)}`,
          sourceLabel: getConversationSourceLabel(session.storage),
          departments: session.diagnosisResult?.departments ?? [],
          riskLevel: session.riskLevel ?? session.diagnosisResult?.level ?? null,
          primaryAction: {
            label: '继续咨询',
            onClick: () => handleOpenConversation(session.id),
            tone: 'primary',
          },
        });
      });

    return items;
  }, [completedFollowUpRecords, conversationSessions, handleOpenConversation, workspace.recentCases]);

  const normalizedSearchQuery = useMemo(
    () => normalizeRecordKey(recordSearchQuery),
    [recordSearchQuery]
  );

  const filteredConversationSessions = useMemo(() => {
    if (!normalizedSearchQuery) return conversationSessions;

    return conversationSessions.filter((session) =>
      [
        session.title,
        getConversationReferenceText(session),
        session.diagnosisResult?.reason,
        session.diagnosisResult?.action,
        session.diagnosisResult?.departments.join(' '),
      ].some((value) => matchesSearchQuery(value, normalizedSearchQuery))
    );
  }, [conversationSessions, normalizedSearchQuery]);

  const filteredRecordsCenterFollowUps = useMemo(() => {
    if (!normalizedSearchQuery) return recordsCenterFollowUps;

    return recordsCenterFollowUps.filter((item) =>
      [
        item.title,
        item.summary,
        item.statusLabel,
        item.metaLabel,
        item.sourceLabel,
        item.tags?.join(' '),
        item.riskLevel ?? '',
      ].some((value) => matchesSearchQuery(value, normalizedSearchQuery))
    );
  }, [normalizedSearchQuery, recordsCenterFollowUps]);

  const filteredRecordsCenterSummaries = useMemo(() => {
    if (!normalizedSearchQuery) return recordsCenterSummaries;

    return recordsCenterSummaries.filter((item) =>
      [
        item.title,
        item.summary,
        item.metaLabel,
        item.sourceLabel,
        item.departments?.join(' '),
        item.riskLevel ?? '',
      ].some((value) => matchesSearchQuery(value, normalizedSearchQuery))
    );
  }, [normalizedSearchQuery, recordsCenterSummaries]);

  const filteredCaseCount = useMemo(() => {
    if (!normalizedSearchQuery) return workspace.recentCases.length;

    return workspace.recentCases.filter((item) =>
      [
        item.chiefComplaint,
        item.assistantPreview,
        item.departments.join(' '),
        item.triageLevel,
        item.status,
      ].some((value) => matchesSearchQuery(String(value ?? ''), normalizedSearchQuery))
    ).length;
  }, [normalizedSearchQuery, workspace.recentCases]);

  const effectivePage = currentPage === 'home' && messages.length > 0 ? 'chat' : currentPage;
  const showWorkspace = effectivePage === 'workspace';
  const showWelcome = !showWorkspace && messages.length === 0;
  const showConversationShelf = !showWorkspace && !showWelcome && conversationSessions.length > 0;
  const contentWidthClass = showWorkspace
    ? workspaceSection === 'profile'
      ? 'max-w-6xl'
      : 'max-w-5xl'
    : showWelcome
      ? 'max-w-5xl'
      : 'max-w-4xl';

  const activeConversation = useMemo(
    () => conversationSessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, conversationSessions]
  );

  const currentConversationTitle =
    activeConversation?.title ??
    trimText(messages.find((message) => message.role === 'user')?.content ?? '当前问诊', 28);

  const pageHeader = useMemo(() => {
    if (effectivePage === 'workspace') {
      switch (workspaceSection) {
        case 'search':
          return {
            title: '搜索记录',
            subtitle: recordSearchQuery.trim()
              ? `已筛到 ${filteredConversationSessions.length} 段会话、${filteredRecordsCenterFollowUps.length} 项待跟进、${filteredCaseCount} 条摘要线索。`
              : '按症状、标题、科室或建议快速查找历史会话与记录。',
          };
        case 'profile':
          return {
            title: '健康档案',
            subtitle: '只保留账号、同步与基础资料，不再把记录和说明卡堆在同一页。',
          };
        case 'history':
          return {
            title: '历史会话',
            subtitle: recordSearchQuery.trim()
              ? `已按“${recordSearchQuery}”筛选历史线程。`
              : '所有问诊会按线程保存，方便随时回到原上下文继续咨询。',
          };
        case 'medication':
          return {
            title: '用药建议',
            subtitle:
              '把最近问诊里的 OTC / 家庭处理方向前置展示出来，并保留风险提醒与回到原线程的入口。',
          };
        default:
          return {
            title: '记录中心',
            subtitle:
              pendingFollowUpRecords.length > 0
                ? `当前有 ${pendingFollowUpRecords.length} 项待跟进，建议优先处理。`
                : '最近摘要与随访记录会集中显示在这里。',
          };
      }
    }

    if (effectivePage === 'chat') {
      return {
        title: currentConversationTitle,
        subtitle: activeFollowUpRecord
          ? `正在回复随访：${activeFollowUpRecord.summary}`
          : diagnosisResult
            ? '已生成分诊建议，可继续补充新的症状变化。'
            : '继续补充症状持续时间、变化和已采取的处理方式。',
      };
    }

    return {
      title: '开始症状自查',
      subtitle:
        conversationSessions.length > 0
          ? '左侧会保留最近问诊线程，方便随时继续。'
          : '先描述不适，再按提示补充关键信息。',
    };
  }, [
    activeFollowUpRecord,
    conversationSessions.length,
    currentConversationTitle,
    diagnosisResult,
    effectivePage,
    filteredCaseCount,
    filteredConversationSessions.length,
    filteredRecordsCenterFollowUps.length,
    pendingFollowUpRecords.length,
    recordSearchQuery,
    workspaceSection,
  ]);

  if (effectivePage === 'map') {
    return (
      <EpidemicDashboard
        onBack={() => {
          const previousShellState = previousShellStateRef.current;
          setWorkspaceSection(previousShellState.section);
          setCurrentPage(previousShellState.page);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 lg:flex">
      <AppSidebar
        activeSection={showWorkspace ? workspaceSection : effectivePage === 'chat' ? 'chat' : null}
        searchQuery={recordSearchQuery}
        onSearchQueryChange={handleRecordSearchChange}
        sessions={filteredConversationSessions}
        totalSessionCount={conversationSessions.length}
        activeSessionId={activeSessionId}
        onOpenSession={handleOpenConversation}
        onStartNewSession={handleResetChat}
        onSelectChat={() => setCurrentPage(messages.length > 0 ? 'chat' : 'home')}
        onSelectSearch={() => handleOpenWorkspaceSection('search')}
        onSelectProfile={() => handleOpenWorkspaceSection('profile')}
        onSelectHistory={() => handleOpenWorkspaceSection('history')}
        onSelectRecords={() => handleOpenWorkspaceSection('records')}
        onSelectMedication={() => handleOpenWorkspaceSection('medication')}
        onOpenMap={handleOpenMap}
        onOpenAuth={handleOpenAuthDialog}
        sessionEmail={workspace.sessionEmail}
        statusLabel={workspace.statusLabel}
        profileCompletion={profileCompletion}
        pendingFollowUpCount={pendingFollowUpRecords.length}
      />

      <div className="flex min-h-screen flex-1 flex-col">
          <Header
            title={pageHeader.title}
            subtitle={pageHeader.subtitle}
            onReset={handleResetChat}
            onOpenWorkspace={handleOpenWorkspace}
            onToggleMap={handleOpenMap}
            onOpenAuth={handleOpenAuthDialog}
            sessionEmail={workspace.sessionEmail}
            currentView={showWorkspace ? 'workspace' : effectivePage === 'home' ? 'home' : 'chat'}
            canInstallApp={pwa.canInstall}
            isAppInstalled={pwa.isInstalled}
            onInstallApp={() => {
              void pwa.promptInstall();
          }}
        />

        <div
          className="flex-1 overflow-y-auto px-4 md:px-6"
          style={{ paddingBottom: showWorkspace ? '40px' : '132px' }}
        >
          <div className={`${contentWidthClass} mx-auto w-full`}>
            {showWorkspace && (
              <div className="space-y-4 py-5">
                <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                  {(Object.keys(WORKSPACE_TAB_LABELS) as SidebarSection[]).map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => handleOpenWorkspaceSection(section)}
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
                          <p className="text-sm font-semibold text-slate-900">统一搜索</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            支持按症状、标题、建议、科室和随访说明搜索会话与记录。
                          </p>
                        </div>
                        {recordSearchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => setRecordSearchQuery('')}
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
                          onChange={(event) => setRecordSearchQuery(event.target.value)}
                          placeholder="例如：发烧、头痛、消化内科、复诊、去医院"
                          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />
                      </div>

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

                    {recordSearchQuery.trim() ? (
                      <>
                        <ConversationHistoryPanel
                          sessions={filteredConversationSessions}
                          activeSessionId={activeSessionId}
                          onOpenSession={handleOpenConversation}
                          onStartNewSession={handleResetChat}
                          title="匹配会话"
                          description={`当前关键词“${recordSearchQuery}”命中的历史线程`}
                          emptyMessage="没有匹配到相关会话，请换一个症状或建议关键词。"
                        />

                        <RecordsCenterPanel
                          statusLabel="搜索结果"
                          title="匹配的记录与随访"
                          helperText="同步展示待跟进项目和最近完成的摘要，方便直接回看或继续咨询。"
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

                {workspaceSection === 'profile' && (
                  <div className="space-y-4">
                    <CloudSyncCard
                      mode={workspace.mode}
                      statusLabel={workspace.statusLabel}
                      helperText={workspace.helperText}
                      recentCases={workspace.recentCases}
                      profile={workspace.profile}
                      sessionEmail={workspace.sessionEmail}
                      onRefresh={workspace.refresh}
                      isRefreshing={workspace.isRefreshing}
                      onSaveProfile={workspace.updateProfile}
                      onApplyDemoPersona={workspace.loadDemoPersona}
                      onOpenAuth={handleOpenAuthDialog}
                    />
                  </div>
                )}

                {workspaceSection === 'history' && (
                  <ConversationHistoryPanel
                    sessions={filteredConversationSessions}
                    activeSessionId={activeSessionId}
                    onOpenSession={handleOpenConversation}
                    onStartNewSession={handleResetChat}
                    title={recordSearchQuery.trim() ? '筛选后的历史会话' : '历史会话'}
                    description={
                      recordSearchQuery.trim()
                        ? `已按“${recordSearchQuery}”筛选历史线程。`
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
                  <MedicationRecommendationsPanel
                    profile={workspace.profile}
                    currentDiagnosis={diagnosisResult}
                    activeSessionId={activeSessionId}
                    conversationSessions={conversationSessions}
                    recentCases={workspace.recentCases}
                    onOpenConversation={handleOpenConversation}
                    onStartNewConversation={handleResetChat}
                  />
                )}

                {workspaceSection === 'records' && (
                  <RecordsCenterPanel
                    statusLabel={
                      pendingFollowUpRecords.length > 0 ? '待处理随访与最近摘要' : '随访与记录'
                    }
                    helperText={
                      pendingFollowUpRecords.length > 0
                        ? '优先回复待跟进项目，再继续打开最近完成的摘要或原问诊记录。'
                        : '新的随访提醒和最近完成的摘要会统一汇总在这里，方便随时回看和继续咨询。'
                    }
                    followUps={recordsCenterFollowUps}
                    recentSummaries={recordsCenterSummaries}
                    emptyFollowUpsMessage="当前没有待回复随访。新的复诊提醒或观察任务出现后，会自动汇总在这里。"
                    emptySummariesMessage="还没有最近完成的摘要。完成一次问诊或随访后，记录中心会自动展示可继续打开的记录。"
                  />
                )}
              </div>
            )}

            {showWelcome && (
              <WelcomeScreen
                onSendMessage={handleSendMessage}
                onOpenWorkspace={handleOpenWorkspace}
                onOpenAuth={handleOpenAuthDialog}
                onToggleMap={handleOpenMap}
                sessionEmail={workspace.sessionEmail}
                recentSessions={conversationSessions}
                activeSessionId={activeSessionId}
                onOpenConversation={handleOpenConversation}
              />
            )}

            {!showWorkspace && messages.length > 0 && (
              <div className="mt-2 space-y-3 py-4">
                {showConversationShelf && (
                  <div className="lg:hidden">
                    <ConversationHistoryPanel
                      sessions={conversationSessions}
                      activeSessionId={activeSessionId}
                      onOpenSession={handleOpenConversation}
                      onStartNewSession={handleResetChat}
                      title="最近对话"
                      description="手机端也能在主聊天界面切换到之前的问诊线程。"
                      maxItems={6}
                      variant="shelf"
                      startButtonLabel="新对话"
                    />
                  </div>
                )}

                <DiagnosisProgress messages={messages} diagnosisResult={diagnosisResult} />
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    onQuickReply={handleSendMessage}
                    diagnosisResult={!!diagnosisResult}
                  />
                ))}

                {streamingContent && (
                  <ChatBubble
                    message={{
                      id: 'streaming',
                      role: 'assistant',
                      content: streamingContent,
                      timestamp: new Date(),
                      agentRoute: activeAgentRoute ?? undefined,
                    }}
                    isStreaming
                    onQuickReply={handleSendMessage}
                    diagnosisResult={!!diagnosisResult}
                  />
                )}

                {isLoading && !streamingContent && (
                  <div className="mb-4 flex items-end gap-2">
                    <div className="flex-shrink-0 rounded-full bg-blue-100 p-1.5">
                      <div className="h-4 w-4 rounded-full bg-blue-300 animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <AgentOrchestrationPanel route={activeAgentRoute} isLive compact />
                      <ToolCallIndicator
                        visible={isSearchingKB || activeToolCalls.length > 0}
                        toolCalls={activeToolCalls}
                      />
                      <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex gap-1">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {diagnosisResult && !isLoading && (
                  <ResultCard
                    result={diagnosisResult}
                    hospitals={hospitals}
                    messages={messages}
                    profile={workspace.profile}
                    recentCases={workspace.recentCases}
                    onReport={() => setReportCount(getReportCount())}
                    onToggleMap={handleOpenMap}
                  />
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {!showWorkspace && (
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} withDesktopSidebar />
        )}
      </div>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        mode={workspace.mode}
        sessionEmail={workspace.sessionEmail}
        onClose={handleCloseAuthDialog}
        onRefresh={workspace.refresh}
      />
    </div>
  );
}
