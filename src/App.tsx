import { useEffect, useMemo, useRef, useState } from 'react';
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
import { WorkspaceOverviewPanel } from './components/WorkspaceOverviewPanel';
import { useHealthWorkspace } from './hooks/useHealthWorkspace';
import { usePwaInstall } from './hooks/usePwaInstall';
import type { Hospital, SendMessageInput } from './types';

function getReportCount(): number {
  try {
    return (JSON.parse(localStorage.getItem('symptom_reports') ?? '[]') as unknown[]).length;
  } catch {
    return 0;
  }
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
    sendMessage,
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

  function handleSendMessage(input: string | SendMessageInput) {
    setCurrentPage('chat');
    sendMessage(input);
  }

  function handleResetChat() {
    resetChat();
    setCurrentPage('home');
  }

  function handleOpenConversation(sessionId: string) {
    if (loadConversationSession(sessionId)) {
      setCurrentPage('chat');
    }
  }

  function handleContinueLatestConversation() {
    const latestSession = conversationSessions[0];
    if (latestSession) {
      handleOpenConversation(latestSession.id);
      return;
    }

    handleResetChat();
  }

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
