import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  chatStream,
  runToolAwareChat,
  type ChatContentPart,
  type ChatMessage,
  type ChatToolCall,
} from '../lib/aiClient';
import {
  executeAgentTool,
  getAgentToolsByNames,
  toToolCallState,
} from '../lib/agentTools';
import { createAgentOrchestration } from '../agents/orchestrator';
import type { AgentMemoryContext } from '../agents/types';
import { primeMedicalKnowledgeCorpus, searchMedicalKnowledge } from '../lib/medicalKnowledge';
import { requestGeolocation, fetchWeather } from '../lib/geolocation';
import { persistCaseRecord } from '../lib/healthData';
import {
  FOLLOW_UP_RESPONSE_OPTIONS,
  getCompletedFollowUpRecords,
  getDueFollowUpRecord,
  getPendingFollowUpRecords,
  isFollowUpResponseOption,
  queueFollowUpRecord,
  readFollowUpRecords,
  saveFollowUpRecordResponse,
  subscribeToFollowUpRecords,
} from '../lib/followUpRecords';
import type {
  AgentRoute,
  ChatImageAttachment,
  ConversationSession,
  DiagnosisResult,
  FollowUpRecord,
  FollowUpResponseOption,
  Message,
  SendMessageInput,
  ToolCall,
} from '../types';
import type { WeatherData, LocationData } from '../lib/geolocation';

const VISION_INPUT_ENABLED = /^(1|true|yes)$/i.test(
  String(import.meta.env.VITE_AI_SUPPORTS_VISION ?? 'false')
);

function extractDiagnosis(content: string): DiagnosisResult | null {
  const match = content.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.level && parsed.reason && parsed.action && parsed.departments) {
      return parsed as DiagnosisResult;
    }
    return null;
  } catch {
    return null;
  }
}

function extractSuggestions(content: string): string[] | undefined {
  const suggestionsMatch = content.match(/\{"suggestions":\s*(\[[\s\S]*?\])\}/);
  if (!suggestionsMatch) return undefined;

  try {
    const parsed = JSON.parse(suggestionsMatch[1]);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : undefined;
  } catch {
    return undefined;
  }
}

function safeParseJson<T>(payload?: string): T | null {
  if (!payload) return null;
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

function formatAttachmentSize(sizeBytes: number): string {
  const sizeInMb = sizeBytes / (1024 * 1024);
  return sizeInMb >= 1
    ? `${sizeInMb.toFixed(1)} MB`
    : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function normalizeDraft(input: string | SendMessageInput): {
  text: string;
  attachments: ChatImageAttachment[];
} {
  if (typeof input === 'string') {
    return {
      text: input,
      attachments: [],
    };
  }

  return {
    text: input.text ?? '',
    attachments: input.attachments ?? [],
  };
}

function buildAttachmentFallbackText(attachments: ChatImageAttachment[]): string {
  return attachments.length > 1
    ? '我上传了几张和症状相关的图片，请告诉我还需要补充哪些信息，以及何时需要尽快线下就医。'
    : '我上传了一张和症状相关的图片，请告诉我还需要补充哪些信息，以及何时需要尽快线下就医。';
}

function buildAttachmentContext(attachments: ChatImageAttachment[]): string {
  if (attachments.length === 0) return '';

  return [
    '【图片补充信息】',
    `用户本轮附带了 ${attachments.length} 张医疗相关图片。当前版本可能无法直接识别图像像素，请仅把图片视为辅助背景，不要把它当作确诊依据。`,
    ...attachments.map(
      (attachment, index) =>
        `- 图片 ${index + 1}：${attachment.name}（${attachment.mimeType}，${formatAttachmentSize(
          attachment.sizeBytes
        )}）`
    ),
    '请明确说明：不能仅凭图片下诊断，应结合用户的文字描述、持续时间、疼痛/瘙痒/发热等信息给出谨慎分诊建议；若出现伤口恶化、明显蔓延、呼吸困难、高热等红旗信号，应建议线下就医。',
  ].join('\n');
}

function buildUserChatContent(
  text: string,
  attachments: ChatImageAttachment[]
): string | ChatContentPart[] {
  if (attachments.length === 0) return text;

  const attachmentContext = buildAttachmentContext(attachments);
  if (!VISION_INPUT_ENABLED) {
    return `${text}\n\n${attachmentContext}`;
  }

  return [
    {
      type: 'text',
      text: `${text}\n\n${attachmentContext}`,
    },
    ...attachments.map((attachment) => ({
      type: 'image_url' as const,
      image_url: {
        url: attachment.dataUrl,
        detail: 'low' as const,
      },
    })),
  ];
}

function toHistoryMessage(message: Message): ChatMessage {
  return {
    role: message.role,
    content:
      message.role === 'user'
        ? buildUserChatContent(message.content, message.attachments ?? [])
        : message.content,
  };
}

const CHAT_SESSION_STORAGE_KEY = 'symptom_chat_sessions_v1';
const MAX_CHAT_SESSIONS = 16;
const FOLLOW_UP_SUGGESTIONS_PAYLOAD = JSON.stringify({
  suggestions: [...FOLLOW_UP_RESPONSE_OPTIONS],
});

function getFollowUpPromptMessageId(recordId: string) {
  return `followup-prompt-${recordId}`;
}

function buildFollowUpMessage(followUpCase: FollowUpRecord): Message {
  return {
    id: getFollowUpPromptMessageId(followUpCase.id),
    role: 'assistant',
    content: `上次您提到“${followUpCase.summary}”，现在感觉怎么样了？\n${FOLLOW_UP_SUGGESTIONS_PAYLOAD}`,
    timestamp: new Date(),
    suggestions: [...FOLLOW_UP_RESPONSE_OPTIONS],
  };
}

function stripSessionMetadata(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const sourceText = stripSessionMetadata(firstUserMessage?.content ?? '');
  if (!sourceText) return '新的症状咨询';
  return sourceText.length > 20 ? `${sourceText.slice(0, 20).trim()}…` : sourceText;
}

function normalizeStoredMessage(raw: unknown, index: number): Message | null {
  if (!raw || typeof raw !== 'object') return null;

  const message = raw as Partial<Message>;
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null;
  }

  const timestampValue =
    typeof message.timestamp === 'string' || message.timestamp instanceof Date
      ? message.timestamp
      : new Date().toISOString();
  const parsedTimestamp = new Date(timestampValue);

  return {
    id: typeof message.id === 'string' ? message.id : `stored-message-${index}`,
    role: message.role,
    content: typeof message.content === 'string' ? message.content : '',
    timestamp: Number.isNaN(parsedTimestamp.getTime()) ? new Date() : parsedTimestamp,
    attachments: Array.isArray(message.attachments) ? message.attachments : undefined,
    suggestions: Array.isArray(message.suggestions)
      ? message.suggestions.filter((item): item is string => typeof item === 'string')
      : undefined,
    toolCalls: Array.isArray(message.toolCalls) ? message.toolCalls : undefined,
    agentRoute: message.agentRoute,
  };
}

function readConversationSessionsCache(): ConversationSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const session = item as Partial<ConversationSession>;
        const messages = Array.isArray(session.messages)
          ? session.messages
              .map((message, messageIndex) => normalizeStoredMessage(message, messageIndex))
              .filter((message): message is Message => Boolean(message))
          : [];

        if (messages.length === 0) return null;

        const createdAt = typeof session.createdAt === 'string' ? session.createdAt : new Date().toISOString();
        const updatedAt = typeof session.updatedAt === 'string' ? session.updatedAt : createdAt;
        const riskLevel =
          session.riskLevel === 'green' ||
          session.riskLevel === 'yellow' ||
          session.riskLevel === 'orange' ||
          session.riskLevel === 'red'
            ? session.riskLevel
            : null;

        return {
          id: typeof session.id === 'string' ? session.id : `chat-session-${index}`,
          title:
            typeof session.title === 'string' && session.title.trim()
              ? session.title
              : buildConversationTitle(messages),
          createdAt,
          updatedAt,
          riskLevel,
          diagnosisResult: session.diagnosisResult ?? null,
          messages,
          storage: session.storage === 'supabase' ? 'supabase' : 'local',
        } satisfies ConversationSession;
      })
      .filter((session): session is ConversationSession => Boolean(session))
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
  } catch {
    return [];
  }
}

function writeConversationSessionsCache(sessions: ConversationSession[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

export function useChat(memoryContext?: AgentMemoryContext | null) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const dueFollowUp = getDueFollowUpRecord(readFollowUpRecords());
    return dueFollowUp ? [buildFollowUpMessage(dueFollowUp)] : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isSearchingKB, setIsSearchingKB] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [followUpRecords, setFollowUpRecords] = useState<FollowUpRecord[]>(() =>
    readFollowUpRecords()
  );
  const [activeFollowUpId, setActiveFollowUpId] = useState<string | null>(() =>
    getDueFollowUpRecord(readFollowUpRecords())?.id ?? null
  );
  const [activeAgentRoute, setActiveAgentRoute] = useState<AgentRoute | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [conversationSessions, setConversationSessions] = useState<ConversationSession[]>(() =>
    readConversationSessionsCache()
  );
  const keepFollowUpPromptMessageRef = useRef(false);
  const activeFollowUpRecord = useMemo(
    () =>
      followUpRecords.find(
        (record) => record.id === activeFollowUpId && record.status === 'pending'
      ) ?? null,
    [followUpRecords, activeFollowUpId]
  );
  const pendingFollowUpRecords = useMemo(
    () => getPendingFollowUpRecords(followUpRecords),
    [followUpRecords]
  );
  const completedFollowUpRecords = useMemo(
    () => getCompletedFollowUpRecords(followUpRecords),
    [followUpRecords]
  );

  const persistConversationSession = useCallback(
    (sessionId: string, nextMessages: Message[], nextDiagnosis: DiagnosisResult | null) => {
      if (!sessionId || nextMessages.length === 0) return;

      const now = new Date().toISOString();
      setConversationSessions((prev) => {
        const existing = prev.find((session) => session.id === sessionId);
        const nextSessions = [
          {
            id: sessionId,
            title: buildConversationTitle(nextMessages),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            riskLevel: nextDiagnosis?.level ?? null,
            diagnosisResult: nextDiagnosis ?? null,
            messages: nextMessages,
            storage: 'local' as const,
          },
          ...prev.filter((session) => session.id !== sessionId),
        ].slice(0, MAX_CHAT_SESSIONS);

        writeConversationSessionsCache(nextSessions);
        return nextSessions;
      });
    },
    []
  );

  useEffect(() => {
    void primeMedicalKnowledgeCorpus();

    const initWeather = async () => {
      try {
        const loc = await requestGeolocation();
        setLocationData(loc);
        const weather = await fetchWeather(loc.lat, loc.lon);
        if (weather) setWeatherData(weather);
      } catch {
        try {
          const weather = await fetchWeather(39.92, 116.41);
          if (weather) setWeatherData(weather);
        } catch {
          // 天气获取失败时静默降级
        }
      }
    };

    initWeather();
  }, []);

  useEffect(() => {
    return subscribeToFollowUpRecords(() => {
      const nextRecords = readFollowUpRecords();
      setFollowUpRecords(nextRecords);

      if (!activeFollowUpId) {
        return;
      }

      const activeRecord = nextRecords.find((record) => record.id === activeFollowUpId);
      if (activeRecord?.status === 'pending') {
        return;
      }

      const keepPromptMessage = keepFollowUpPromptMessageRef.current;
      keepFollowUpPromptMessageRef.current = false;
      setActiveFollowUpId(null);
      if (!keepPromptMessage) {
        setMessages((prev) =>
          prev.filter((message) => message.id !== getFollowUpPromptMessageId(activeFollowUpId))
        );
      }
    });
  }, [activeFollowUpId]);

  const applyFollowUpResponse = useCallback(
    (
      recordId: string,
      response: FollowUpResponseOption,
      options?: { keepPromptMessage?: boolean }
    ) => {
      keepFollowUpPromptMessageRef.current = Boolean(options?.keepPromptMessage);
      const updatedRecord = saveFollowUpRecordResponse(recordId, response);
      keepFollowUpPromptMessageRef.current = false;
      return updatedRecord;
    },
    []
  );

  const respondToFollowUp = useCallback(
    (recordId: string, response: FollowUpResponseOption) =>
      applyFollowUpResponse(recordId, response),
    [applyFollowUpResponse]
  );

  const openFollowUpRecord = useCallback(
    (recordId: string) => {
      const targetRecord = followUpRecords.find(
        (record) => record.id === recordId && record.status === 'pending'
      );
      if (!targetRecord) {
        return false;
      }

      setMessages([buildFollowUpMessage(targetRecord)]);
      setIsLoading(false);
      setStreamingContent('');
      setDiagnosisResult(null);
      setIsSearchingKB(false);
      setActiveToolCalls([]);
      setActiveAgentRoute(null);
      setActiveFollowUpId(targetRecord.id);
      setActiveSessionId(null);
      return true;
    },
    [followUpRecords]
  );

  const sendMessage = useCallback(
    async (input: string | SendMessageInput) => {
      if (isLoading) return;

      const draft = normalizeDraft(input);
      const attachments = draft.attachments.filter(
        (attachment) => attachment.kind === 'image' && Boolean(attachment.dataUrl)
      );
      const trimmedText = draft.text.trim();
      const displayText = trimmedText || buildAttachmentFallbackText(attachments);

      if (!displayText.trim() && attachments.length === 0) return;

      const isFollowUpReply = isFollowUpResponseOption(displayText);

      if (activeFollowUpRecord && isFollowUpReply) {
        applyFollowUpResponse(activeFollowUpRecord.id, displayText, {
          keepPromptMessage: true,
        });
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: displayText,
        timestamp: new Date(),
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      const sessionId = activeSessionId ?? `chat-session-${Date.now()}`;

      if (!activeSessionId) {
        setActiveSessionId(sessionId);
      }

      setMessages((prev) => {
        const nextMessages = [...prev, userMessage];
        persistConversationSession(sessionId, nextMessages, diagnosisResult);
        return nextMessages;
      });
      setIsLoading(true);
      setStreamingContent('');
      setIsSearchingKB(true);
      setActiveToolCalls([]);

        const knowledgeSearch = searchMedicalKnowledge(displayText, { limit: 4 });
        const kbResults = knowledgeSearch.symptomMatches.slice(0, 2);
        const orchestration = createAgentOrchestration({
          userText: displayText,
          messages,
          attachments,
          locationData,
          diagnosisResult,
          kbResults,
          knowledgeSearch,
          pendingFollowUpSummary: activeFollowUpRecord?.summary ?? null,
          memoryContext,
        });
        const scopedTools = getAgentToolsByNames(orchestration.allowedToolNames);

      setActiveAgentRoute(orchestration.route);

      const toolCallMap = new Map<string, ToolCall>();
      let fullContent = '';

      const syncToolState = (
        toolCall: ChatToolCall,
        status: ToolCall['status'],
        payload?: string
      ) => {
        const parsedPayload = safeParseJson<Record<string, unknown>>(payload) ?? undefined;
        const nextToolCall = toToolCallState(toolCall, status, parsedPayload);
        toolCallMap.set(nextToolCall.id, nextToolCall);

        const nextCalls = Array.from(toolCallMap.values());
        setActiveToolCalls(nextCalls);
        setIsSearchingKB(nextCalls.some((item) => item.status === 'running'));
      };

      const finalizeAssistantMessage = (content: string) => {
        const suggestions = extractSuggestions(content);
        const result = extractDiagnosis(content);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          suggestions,
          toolCalls: Array.from(toolCallMap.values()).filter((item) => item.status !== 'running'),
          agentRoute: orchestration.route,
        };

        setMessages((prev) => {
          const nextMessages = [...prev, assistantMessage];
          persistConversationSession(sessionId, nextMessages, result ?? diagnosisResult);
          return nextMessages;
        });
        setStreamingContent('');
        setIsLoading(false);
        setIsSearchingKB(false);

        if (result) {
          setDiagnosisResult(result);
          if (!isFollowUpReply || !activeFollowUpRecord) {
            queueFollowUpRecord(displayText, result);
          }
          void persistCaseRecord({
            diagnosis: result,
            messages: [...messages, userMessage, assistantMessage],
          });
        }
      };

      const history: ChatMessage[] = [
        {
          role: 'system',
          content: orchestration.systemPrompt,
        },
        ...messages.map(toHistoryMessage),
        { role: 'user', content: buildUserChatContent(displayText, attachments) },
      ];

      try {
        const result = await runToolAwareChat(history, {
          tools: scopedTools,
          toolChoice: orchestration.preferredToolName
            ? { type: 'function', function: { name: orchestration.preferredToolName } }
            : 'auto',
          maxToolRounds: 4,
          executeTool: async (toolCall) => {
            const toolResult = await executeAgentTool(
              toolCall.function.name,
              toolCall.function.arguments,
              {
                location: locationData,
                diagnosis: diagnosisResult
                  ? {
                      level: diagnosisResult.level,
                      departments: diagnosisResult.departments,
                    }
                  : null,
              }
            );

            return JSON.stringify(toolResult, null, 2);
          },
          onChunk: (chunk) => {
            fullContent += chunk;
            setStreamingContent(fullContent);
          },
          onToolCall: (toolCall, phase, payload) => {
            if (phase === 'start') {
              syncToolState(toolCall, 'running');
              return;
            }
            syncToolState(toolCall, phase === 'done' ? 'done' : 'error', payload);
          },
        });

        const finalContent =
          fullContent || result.content || '抱歉，我暂时无法生成完整回复，请稍后重试。';
        finalizeAssistantMessage(finalContent);
      } catch {
        if (toolCallMap.size === 0) {
          setActiveToolCalls([
            {
              id: 'tool-fallback',
              name: 'tool-fallback',
              displayName: '调用工具',
              status: 'error',
              summary: '工具链暂时不可用，已切换普通回复',
            },
          ]);
        }

        fullContent = '';

        try {
          await chatStream(history, {
            onChunk: (chunk) => {
              fullContent += chunk;
              setStreamingContent(fullContent);
            },
          });

          finalizeAssistantMessage(fullContent || '抱歉，连接出现问题，请稍后重试。');
        } catch {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '抱歉，连接出现问题，请稍后重试。',
            timestamp: new Date(),
            toolCalls: Array.from(toolCallMap.values()),
            agentRoute: orchestration.route,
          };
          setMessages((prev) => [...prev, errorMessage]);
          setStreamingContent('');
          setIsLoading(false);
          setIsSearchingKB(false);
        }
      }
    },
    [
      activeSessionId,
      messages,
      isLoading,
      locationData,
      diagnosisResult,
      activeFollowUpRecord,
      memoryContext,
      applyFollowUpResponse,
      persistConversationSession,
    ]
  );

  const loadConversationSession = useCallback(
    (sessionId: string) => {
      const target =
        conversationSessions.find((session) => session.id === sessionId) ??
        readConversationSessionsCache().find((session) => session.id === sessionId);

      if (!target) {
        return false;
      }

      setActiveSessionId(target.id);
      setMessages(target.messages);
      setDiagnosisResult(target.diagnosisResult);
      setActiveFollowUpId(null);
      setIsLoading(false);
      setStreamingContent('');
      setIsSearchingKB(false);
      setActiveToolCalls([]);
      setActiveAgentRoute(null);
      return true;
    },
    [conversationSessions]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setStreamingContent('');
    setDiagnosisResult(null);
    setIsSearchingKB(false);
    setActiveToolCalls([]);
    setActiveAgentRoute(null);
    setActiveFollowUpId(null);
    setActiveSessionId(null);
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    diagnosisResult,
    isSearchingKB,
    activeToolCalls,
    activeAgentRoute,
    weatherData,
    locationData,
    activeSessionId,
    conversationSessions,
    followUpRecords,
    pendingFollowUpRecords,
    completedFollowUpRecords,
    activeFollowUpRecord,
    followUpResponseOptions: FOLLOW_UP_RESPONSE_OPTIONS,
    sendMessage,
    respondToFollowUp,
    openFollowUpRecord,
    loadConversationSession,
    resetChat,
  };
}
