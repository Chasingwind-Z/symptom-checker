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
    sendMessage,
    resetChat,
  } = useChat(chatMemoryContext);

  const bottomRef = useRef<HTMLDivElement>(null);
  const [, setReportCount] = useState<number>(getReportCount);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentPage, setCurrentPage] = useState<'home' | 'chat' | 'workspace' | 'map'>('home');

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

  const effectivePage = currentPage === 'home' && messages.length > 0 ? 'chat' : currentPage;
  const showWorkspace = effectivePage === 'workspace';
  const showWelcome = !showWorkspace && messages.length === 0;

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
        <div className="max-w-2xl mx-auto w-full">
          {showWorkspace && (
            <div className="py-5 space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">账号与健康档案</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      这里集中管理邮箱登录、个人资料、近期问诊记录与同步状态；游客也可以先使用本机记录。
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(messages.length > 0 ? 'chat' : 'home')}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {messages.length > 0 ? '继续问诊' : '返回首页'}
                    </button>
                    <button
                      onClick={() => setCurrentPage('map')}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      查看疾病地图
                    </button>
                  </div>
                </div>
              </section>

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
            </div>
          )}

          {showWelcome && (
            <WelcomeScreen
              onSendMessage={handleSendMessage}
              onOpenWorkspace={() => setCurrentPage('workspace')}
              onToggleMap={() => setCurrentPage('map')}
            />
          )}

          {!showWorkspace && messages.length > 0 && (
            <div className="mt-2">
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
