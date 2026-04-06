import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from './hooks/useChat';
import { getRecommendedHospitals } from './lib/mockHospitals';
import { getUserLocation, searchNearbyHospitals } from './lib/nearbyHospitals';
import { buildCombinedMedicalNotes } from './lib/personalization';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { ResultCard } from './components/ResultCard';
import { DiagnosisProgress } from './components/DiagnosisProgress';
import { AgentOrchestrationPanel } from './components/AgentOrchestrationPanel';
import { ToolCallIndicator } from './components/ToolCallIndicator';
import { InfoBar } from './components/WeatherBar';
import { EpidemicDashboard } from './components/EpidemicDashboard';
import { CloudSyncCard } from './components/CloudSyncCard';
import { ConversationHistoryPanel } from './components/ConversationHistoryPanel';
import {
  RecordsCenterPanel,
  type RecordsCenterSummaryItem,
} from './components/RecordsCenterPanel';
import { WorkspaceOverviewPanel } from './components/WorkspaceOverviewPanel';
import { useHealthWorkspace } from './hooks/useHealthWorkspace';
import { usePwaInstall } from './hooks/usePwaInstall';
import type { CaseHistoryItem } from './lib/healthData';
import type { ConversationSession, Hospital, SendMessageInput } from './types';

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
    weatherData,
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
  const [, setReportCount] = useState<number>(getReportCount);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentPage, setCurrentPage] = useState<'home' | 'chat' | 'workspace' | 'map'>('home');
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
        // 定位失败或 API 失败时降级到 mock 数据
        setHospitals(getRecommendedHospitals(diagnosisResult.level, diagnosisResult.departments));
      });
  }, [diagnosisResult]);

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

  const handleOpenFollowUp = useCallback(
    (recordId: string) => {
      if (openFollowUpRecord(recordId)) {
        setCurrentPage('chat');
      }
    },
    [openFollowUpRecord]
  );

  const handleContinueLatestConversation = useCallback(() => {
    const latestSession = conversationSessions[0];
    if (latestSession) {
      handleOpenConversation(latestSession.id);
      return;
    }

    handleResetChat();
  }, [conversationSessions, handleOpenConversation, handleResetChat]);

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

  const effectivePage = currentPage === 'home' && messages.length > 0 ? 'chat' : currentPage;
  const showWorkspace = effectivePage === 'workspace';
  const showWelcome = !showWorkspace && messages.length === 0;
  const showConversationShelf = !showWorkspace && !showWelcome && conversationSessions.length > 0;
  const contentWidthClass = showWorkspace ? 'max-w-6xl' : showWelcome ? 'max-w-6xl' : 'max-w-4xl';

  if (effectivePage === 'map') {
    return <EpidemicDashboard onBack={() => setCurrentPage(messages.length > 0 ? 'chat' : 'home')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col pt-16">
      <Header
        onReset={handleResetChat}
        onOpenHome={() => setCurrentPage(messages.length > 0 ? 'chat' : 'home')}
        onOpenWorkspace={() => setCurrentPage('workspace')}
        onToggleMap={() => setCurrentPage('map')}
        sessionEmail={workspace.sessionEmail}
        cloudMode={workspace.mode}
        currentView={showWorkspace ? 'workspace' : effectivePage === 'home' ? 'home' : 'chat'}
        canInstallApp={pwa.canInstall}
        isAppInstalled={pwa.isInstalled}
        onInstallApp={() => {
          void pwa.promptInstall();
        }}
      />
      <InfoBar weather={weatherData} />

      {/* Scrollable content area */}
      <div
        className="flex-1 overflow-y-auto px-3 md:px-6"
        style={{ paddingTop: '8px', paddingBottom: '132px' }}
      >
        <div className={`${contentWidthClass} mx-auto w-full`}>
          {showWorkspace && (
            <div className="py-5 space-y-4">
              <WorkspaceOverviewPanel
                sessionEmail={workspace.sessionEmail}
                statusLabel={workspace.statusLabel}
                helperText={workspace.helperText}
                profileCompletion={profileCompletion}
                latestCase={workspace.recentCases[0]}
                latestConversation={conversationSessions[0] ?? null}
                conversationCount={conversationSessions.length}
                onStartNewConversation={handleResetChat}
                onContinueConversation={
                  conversationSessions.length > 0 ? handleContinueLatestConversation : undefined
                }
                onOpenMap={() => setCurrentPage('map')}
              />

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

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px] items-start">
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
                />

                <div className="space-y-4">
                  <ConversationHistoryPanel
                    sessions={conversationSessions}
                    activeSessionId={activeSessionId}
                    onOpenSession={handleOpenConversation}
                    onStartNewSession={handleResetChat}
                    title="最近记录与继续咨询"
                    description="继续上次问诊、回看最近判断，或从这里快速打开新的症状线程。"
                    maxItems={6}
                  />

                  <section className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-800">同步与隐私</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {workspace.sessionEmail
                        ? '当前邮箱已用于同步档案和最近问诊摘要；退出后仍会保留这台设备上的本机缓存。'
                        : '未登录时，资料和历史记录只保存在当前浏览器；登录后会自动同步到你的个人空间。'}
                    </p>
                    <div className="mt-3 space-y-2 text-[11px] text-slate-500">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="font-medium text-slate-700">当前状态</p>
                        <p className="mt-1">{workspace.statusLabel}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="font-medium text-slate-700">接下来建议</p>
                        <p className="mt-1">
                          优先补齐基础资料和最近症状变化，这样后续问诊能更少重复追问。
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {showWelcome && (
            <WelcomeScreen
              onSendMessage={handleSendMessage}
              onOpenWorkspace={() => setCurrentPage('workspace')}
              onToggleMap={() => setCurrentPage('map')}
              recentSessions={conversationSessions}
              activeSessionId={activeSessionId}
              onOpenConversation={handleOpenConversation}
            />
          )}

          {!showWorkspace && messages.length > 0 && (
            <div className="mt-2 space-y-3">
              {showConversationShelf && (
                <ConversationHistoryPanel
                  sessions={conversationSessions}
                  activeSessionId={activeSessionId}
                  onOpenSession={handleOpenConversation}
                  onStartNewSession={handleResetChat}
                  title="最近对话"
                  description="在主聊天界面就能切换到之前的问诊线程，继续补充新的症状变化。"
                  maxItems={6}
                  variant="shelf"
                  startButtonLabel="新对话"
                />
              )}

              {/* Progress bar — in-flow, scrolls with content */}
              <DiagnosisProgress messages={messages} diagnosisResult={diagnosisResult} />
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  onQuickReply={handleSendMessage}
                  diagnosisResult={!!diagnosisResult}
                />
              ))}

              {/* Streaming bubble */}
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

              {/* Loading indicator before first chunk */}
              {isLoading && !streamingContent && (
                <div className="flex items-end gap-2 mb-4">
                  <div className="flex-shrink-0 rounded-full p-1.5 bg-blue-100">
                    <div className="w-4 h-4 rounded-full bg-blue-300 animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <AgentOrchestrationPanel route={activeAgentRoute} isLive compact />
                    <ToolCallIndicator
                      visible={isSearchingKB || activeToolCalls.length > 0}
                      toolCalls={activeToolCalls}
                    />
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Result card */}
              {diagnosisResult && !isLoading && (
                <ResultCard
                  result={diagnosisResult}
                  hospitals={hospitals}
                  messages={messages}
                  profile={workspace.profile}
                  recentCases={workspace.recentCases}
                  onReport={() => setReportCount(getReportCount())}
                  onToggleMap={() => setCurrentPage('map')}
                />
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {!showWorkspace && <ChatInput onSend={handleSendMessage} isLoading={isLoading} />}
    </div>
  );
}
