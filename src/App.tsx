import { useEffect, useRef, useState } from 'react';
import { useChat } from './hooks/useChat';
import { getRecommendedHospitals } from './lib/mockHospitals';
import { getUserLocation, searchNearbyHospitals } from './lib/nearbyHospitals';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { ResultCard } from './components/ResultCard';
import { DiagnosisProgress } from './components/DiagnosisProgress';
import { ToolCallIndicator } from './components/ToolCallIndicator';
import { StatsBanner } from './components/StatsBanner';
import type { Hospital } from './types';

function getReportCount(): number {
  try {
    return (JSON.parse(localStorage.getItem('symptom_reports') ?? '[]') as unknown[]).length;
  } catch {
    return 0;
  }
}

export default function App() {
  const { messages, isLoading, streamingContent, diagnosisResult, isSearchingKB, sendMessage, resetChat } =
    useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const [reportCount, setReportCount] = useState<number>(getReportCount);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (!diagnosisResult) {
      setHospitals([]);
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col">
      <Header onReset={resetChat} />
      <StatsBanner />

      {/* Report count banner */}
      {reportCount > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 py-1.5 px-4 text-center text-xs text-blue-500">
          已有 <span className="font-semibold">{reportCount}</span> 人上报症状
        </div>
      )}

      {/* Scrollable content area */}
      <div
        className="flex-1 overflow-y-auto px-3 md:px-6"
        style={{ paddingTop: '16px', paddingBottom: '96px' }}
      >
        <div className="max-w-2xl mx-auto w-full">
          {/* Welcome screen — only when no messages yet */}
          {messages.length === 0 && <WelcomeScreen onSend={sendMessage} />}

          {/* Message list */}
          {messages.length > 0 && (
            <div className="mt-2">
              {/* Progress bar — in-flow, scrolls with content */}
              <DiagnosisProgress messages={messages} diagnosisResult={diagnosisResult} />
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  onQuickReply={sendMessage}
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
                  }}
                  isStreaming
                  onQuickReply={sendMessage}
                />
              )}

              {/* Loading indicator before first chunk */}
              {isLoading && !streamingContent && (
                <div className="flex items-end gap-2 mb-4">
                  <div className="flex-shrink-0 rounded-full p-1.5 bg-blue-100">
                    <div className="w-4 h-4 rounded-full bg-blue-300 animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <ToolCallIndicator visible={isSearchingKB} />
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
                  onReport={() => setReportCount(getReportCount())}
                />
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
