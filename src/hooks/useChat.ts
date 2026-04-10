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
import { quickTriage, getMaxFollowups, type UrgencyLevel } from '../lib/quickTriage';
import { primeMedicalKnowledgeCorpus, searchMedicalKnowledge } from '../lib/medicalKnowledge';
import { requestGeolocation, fetchWeather } from '../lib/geolocation';
import { loadCloudConversationSessions, persistCaseRecord } from '../lib/healthData';
import { saveTrackingEntry } from '../lib/symptomTracking';
import { submitAnonymousReport } from '../lib/epidemicDataEngine';
import { retrieveKnowledge } from '../services/rag/retrieve';
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
import { AI_VISION_ENABLED } from '../lib/aiCapabilities';
import { subscribeToSupabaseAuth } from '../lib/supabase';

type StoredChatImageAttachment = Pick<
  ChatImageAttachment,
  'id' | 'kind' | 'name' | 'mimeType' | 'sizeBytes'
> &
  Partial<Pick<ChatImageAttachment, 'previewUrl' | 'dataUrl'>>;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  const imageLabel = attachments.length > 1 ? '这几张图片' : '这张图片';
  return `我上传了${imageLabel}。请先告诉我图里最明显的异常或可读文字，再告诉我还需要补充哪些信息，以及何时需要尽快线下就医。`;
}

function buildAttachmentContext(attachments: ChatImageAttachment[]): string {
  if (attachments.length === 0) return '';

  return [
    '【图片补充信息】',
    `用户本轮附带了 ${attachments.length} 张医疗相关图片。${
      AI_VISION_ENABLED
        ? '当前模型可接收图片，请先概括你能直接看到的异常、药盒/报告上的可读文字，再明确哪些结论仍不能仅凭图片确认。'
        : '当前 AI 环境不具备图片像素识别能力，图片未以视觉方式传入，下方仅为文件元数据。请主动引导用户用文字描述图片内容（部位、颜色、范围、持续时间等），不要依赖图片信息做分诊判断。'
    }`,
    ...attachments.map(
      (attachment, index) =>
        `- 图片 ${index + 1}：${attachment.name}（${attachment.mimeType}，${formatAttachmentSize(
          attachment.sizeBytes
        )}）`
    ),
    '- 若是皮疹/伤口：可描述颜色、范围、渗出、是否蔓延，但不要把图片直接当作确诊依据。',
    '- 若是药盒/药板：可先识别通用名、剂量、剂型或常见禁忌，再提醒核对年龄、过敏史、慢病和现用药。',
    '- 若是化验/检查单：只总结图片里能清晰读到的关键指标或结论，并说明哪些异常仍需线下复核。',
    '请明确说明：不能仅凭图片下诊断，应结合用户的文字描述、持续时间、疼痛/瘙痒/发热等信息给出谨慎分诊建议；若出现伤口恶化、明显蔓延、呼吸困难、高热等红旗信号，应建议线下就医。',
  ].join('\n');
}

function getChatConnectionFallbackMessage(): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return '当前网络不可用，已先保留这次输入。恢复连接后可重新发送，之前的问诊记录仍可继续查看。';
  }

  return '抱歉，连接出现问题，请稍后重试。当前问诊记录已保留。';
}

function buildUserChatContent(
  text: string,
  attachments: ChatImageAttachment[]
): string | ChatContentPart[] {
  if (attachments.length === 0) return text;

  const attachmentContext = buildAttachmentContext(attachments);
  const textWithAttachmentContext = [text, attachmentContext].filter(Boolean).join('\n\n');
  const attachmentsWithImageData = attachments.filter((attachment) => Boolean(attachment.dataUrl));

  if (!AI_VISION_ENABLED || attachmentsWithImageData.length === 0) {
    return textWithAttachmentContext;
  }

  return [
    {
      type: 'text',
      text: textWithAttachmentContext,
    },
    ...attachmentsWithImageData.map((attachment) => ({
      type: 'image_url' as const,
      image_url: {
        url: attachment.dataUrl,
        detail: 'auto' as const,
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

function normalizeStoredAttachment(raw: unknown, index: number): ChatImageAttachment | null {
  if (!isRecord(raw)) return null;

  const previewUrl = typeof raw.previewUrl === 'string' ? raw.previewUrl : '';
  const dataUrl = typeof raw.dataUrl === 'string' ? raw.dataUrl : previewUrl;

  return {
    id: typeof raw.id === 'string' ? raw.id : `stored-attachment-${index}`,
    kind: 'image',
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : `图片 ${index + 1}`,
    mimeType: typeof raw.mimeType === 'string' && raw.mimeType.trim() ? raw.mimeType : 'image/jpeg',
    sizeBytes: typeof raw.sizeBytes === 'number' ? raw.sizeBytes : 0,
    previewUrl,
    dataUrl,
  };
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
    attachments: Array.isArray(message.attachments)
      ? message.attachments
          .map((attachment, attachmentIndex) =>
            normalizeStoredAttachment(attachment, attachmentIndex)
          )
          .filter((attachment): attachment is ChatImageAttachment => Boolean(attachment))
      : undefined,
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
      .map<ConversationSession | null>((item, index) => {
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
        const storage = session.storage === 'supabase' ? 'supabase' : 'local';
        if (storage === 'supabase') return null;

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
          storage: 'local' as const,
        } satisfies ConversationSession;
      })
      .filter((session): session is ConversationSession => session !== null)
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
  } catch {
    return [];
  }
}

function serializeConversationSessions(sessions: ConversationSession[]) {
  return sessions
    .filter((session) => session.storage === 'local')
    .map((session) => ({
      ...session,
      messages: session.messages.map((message) => ({
        ...message,
        timestamp:
          message.timestamp instanceof Date
            ? message.timestamp.toISOString()
            : new Date(message.timestamp).toISOString(),
        // Intentionally strip raw image payloads from long-lived local cache to avoid
        // exceeding browser storage limits. Full previews stay in the live in-memory session.
        attachments: message.attachments?.map(
          (attachment): StoredChatImageAttachment => ({
            id: attachment.id,
            kind: attachment.kind,
            name: attachment.name,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
          })
        ),
      })),
    }));
}

function sortConversationSessions(sessions: ConversationSession[]) {
  return [...sessions].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function upsertConversationSession(
  sessions: ConversationSession[],
  nextSession: ConversationSession
): ConversationSession[] {
  return sortConversationSessions(
    [nextSession, ...sessions.filter((session) => session.id !== nextSession.id)].slice(
      0,
      MAX_CHAT_SESSIONS
    )
  );
}

function mergeConversationSessions(
  localSessions: ConversationSession[],
  cloudSessions: ConversationSession[]
) {
  const seen = new Set<string>();
  return sortConversationSessions(
    [...localSessions, ...cloudSessions].filter((session) => {
      if (seen.has(session.id)) return false;
      seen.add(session.id);
      return true;
    })
  );
}

function writeConversationSessionsCache(sessions: ConversationSession[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      CHAT_SESSION_STORAGE_KEY,
      JSON.stringify(serializeConversationSessions(sessions))
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Chat] 会话缓存写入失败，已保留当前页面中的会话状态。', error);
    }
  }
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
  const [pendingFollowUp, setPendingFollowUp] = useState<{ date: string; note: string } | null>(null);
  const [activeAgentRoute, setActiveAgentRoute] = useState<AgentRoute | null>(null);
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('green');
  const [followupCount, setFollowupCount] = useState(0);
  const maxFollowups = getMaxFollowups(urgencyLevel);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionStorage, setActiveSessionStorage] = useState<ConversationSession['storage'] | null>(
    null
  );
  const [localConversationSessions, setLocalConversationSessions] = useState<ConversationSession[]>(() =>
    readConversationSessionsCache()
  );
  const [cloudConversationSessions, setCloudConversationSessions] = useState<ConversationSession[]>([]);
  const keepFollowUpPromptMessageRef = useRef(false);
  const latestRagCitations = useRef<Array<{ title: string; content?: string; sourceType: string; sourceRef: string; sourceDate?: string; reviewStatus: string }>>([]);
  const conversationSessions = useMemo(
    () => mergeConversationSessions(localConversationSessions, cloudConversationSessions),
    [cloudConversationSessions, localConversationSessions]
  );
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
  const refreshCloudSessions = useCallback(async () => {
    const nextSessions = await loadCloudConversationSessions(MAX_CHAT_SESSIONS);
    setCloudConversationSessions(nextSessions);
  }, []);

  const persistConversationSession = useCallback(
    (
      sessionId: string,
      nextMessages: Message[],
      nextDiagnosis: DiagnosisResult | null,
      storage: ConversationSession['storage'] = activeSessionStorage ?? 'local'
    ) => {
      if (!sessionId || nextMessages.length === 0) return;

      const now = new Date().toISOString();
      const buildNextSession = (createdAt?: string): ConversationSession => ({
        id: sessionId,
        title: buildConversationTitle(nextMessages),
        createdAt: createdAt ?? now,
        updatedAt: now,
        riskLevel: nextDiagnosis?.level ?? null,
        diagnosisResult: nextDiagnosis ?? null,
        messages: nextMessages,
        storage,
      });

      if (storage === 'supabase') {
        setCloudConversationSessions((prev) => {
          const existing = prev.find((session) => session.id === sessionId);
          return upsertConversationSession(prev, buildNextSession(existing?.createdAt));
        });
        return;
      }

      setLocalConversationSessions((prev) => {
        const existing = prev.find((session) => session.id === sessionId);
        const nextSessions = upsertConversationSession(prev, buildNextSession(existing?.createdAt));
        writeConversationSessionsCache(nextSessions);
        return nextSessions;
      });
    },
    [activeSessionStorage]
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
    const initialRefreshId = window.setTimeout(() => {
      void refreshCloudSessions();
    }, 0);
    const unsubscribeAuth = subscribeToSupabaseAuth(() => {
      void refreshCloudSessions();
    });

    return () => {
      window.clearTimeout(initialRefreshId);
      unsubscribeAuth();
    };
  }, [refreshCloudSessions]);

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
      setActiveSessionStorage(null);
      return true;
    },
    [followUpRecords]
  );

  const promoteConversationSessionToCloud = useCallback(
    (
      sessionId: string,
      caseId: string,
      nextMessages: Message[],
      nextDiagnosis: DiagnosisResult | null
    ) => {
      const now = new Date().toISOString();

      setLocalConversationSessions((prev) => {
        const nextSessions = prev.filter((session) => session.id !== sessionId);
        writeConversationSessionsCache(nextSessions);
        return nextSessions;
      });

      setCloudConversationSessions((prev) =>
        upsertConversationSession(prev, {
          id: caseId,
          title: buildConversationTitle(nextMessages),
          createdAt: now,
          updatedAt: now,
          riskLevel: nextDiagnosis?.level ?? null,
          diagnosisResult: nextDiagnosis ?? null,
          messages: nextMessages,
          storage: 'supabase',
        })
      );

      if (activeSessionId === sessionId || activeSessionId === null) {
        setActiveSessionId(caseId);
        setActiveSessionStorage('supabase');
      }
    },
    [activeSessionId]
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

      // Quick triage on first message to determine urgency and followup limits
      if (messages.length === 0) {
        const urgency = quickTriage(displayText);
        setUrgencyLevel(urgency);
      }

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
      const sessionStorage = activeSessionStorage ?? 'local';

      if (!activeSessionId) {
        setActiveSessionId(sessionId);
        setActiveSessionStorage('local');
      }

      setMessages((prev) => {
        const nextMessages = [...prev, userMessage];
        persistConversationSession(sessionId, nextMessages, diagnosisResult, sessionStorage);
        return nextMessages;
      });
      setIsLoading(true);
      setStreamingContent('');
      setIsSearchingKB(true);
      setActiveToolCalls([]);

        const knowledgeSearch = await searchMedicalKnowledge(displayText, { limit: 6 });
        const kbResults = knowledgeSearch.symptomMatches.slice(0, 2);

        // RAG retrieval (gracefully degradable)
        let ragResults: { chunks: Array<{ title: string; content: string; sourceType: string; sourceRef: string; reviewStatus: string }>; empty: boolean } | undefined;
        try {
          const ragPopulation = memoryContext?.population || 'self';
          const ragResult = await retrieveKnowledge(displayText, ragPopulation);
          ragResults = {
            chunks: ragResult.chunks.map(c => ({
              title: c.title,
              content: c.content,
              sourceType: c.sourceType,
              sourceRef: c.sourceRef,
              reviewStatus: c.reviewStatus,
            })),
            empty: ragResult.empty,
          };
          latestRagCitations.current = ragResult.chunks.map(c => ({
            title: c.title,
            content: c.content || undefined,
            sourceType: c.sourceType,
            sourceRef: c.sourceRef,
            sourceDate: c.sourceDate || undefined,
            reviewStatus: c.reviewStatus,
          }));
        } catch {
          latestRagCitations.current = [];
        }

        // Compute urgency for this turn (use latest state for first message, or current state)
        const currentUrgency = messages.length === 0 ? quickTriage(displayText) : urgencyLevel;
        const currentMaxFollowups = getMaxFollowups(currentUrgency);

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
          ragResults,
          urgencyLevel: currentUrgency,
          maxFollowups: currentMaxFollowups,
          followupCount,
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

        // Track followup count: if AI asks a question (has suggestions, no diagnosis), increment
        const isAiQuestion = !result && (suggestions != null || content.includes('？') || content.includes('?'));
        if (isAiQuestion) {
          setFollowupCount((prev) => prev + 1);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          suggestions,
          toolCalls: Array.from(toolCallMap.values()).filter((item) => item.status !== 'running'),
          agentRoute: orchestration.route,
          ragCitations: latestRagCitations.current.length > 0 ? latestRagCitations.current : undefined,
        };

        setMessages((prev) => {
          const nextMessages = [...prev, assistantMessage];
          persistConversationSession(sessionId, nextMessages, result ?? diagnosisResult, sessionStorage);
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
          // Auto-submit anonymous report (fire and forget)
          submitAnonymousReport({
            city: locationData?.city || '未知',
            district: undefined,
            symptoms: [result.reason.slice(0, 50)],
            level: result.level,
            age_group: memoryContext?.profile?.birthYear
              ? (new Date().getFullYear() - memoryContext.profile.birthYear > 60 ? '60+'
                : new Date().getFullYear() - memoryContext.profile.birthYear < 18 ? '<18' : '18-60')
              : undefined,
          }).catch(() => {/* silent */});
          // Save symptom tracking entry
          try {
            const symptomsList = result.reason ? [result.reason] : [displayText];
            const severity = result.level === 'green' ? 'mild' as const : result.level === 'red' ? 'severe' as const : 'moderate' as const;
            saveTrackingEntry({
              sessionId,
              timestamp: Date.now(),
              symptoms: symptomsList,
              severity,
              level: result.level,
            });
          } catch { /* tracking is non-critical */ }
          const finalSessionMessages = [...messages, userMessage, assistantMessage];
          void persistCaseRecord({
            caseId: sessionStorage === 'supabase' ? sessionId : undefined,
            diagnosis: result,
            messages: finalSessionMessages,
          }).then((persisted) => {
            if (persisted.storedIn === 'supabase') {
              promoteConversationSessionToCloud(
                sessionId,
                persisted.caseId,
                finalSessionMessages,
                result
              );
              void refreshCloudSessions();
            }
          });
        }

        // Follow-up keyword detection (runs once per finalized message)
        const FOLLOWUP_KEYWORDS = ['复查', '复诊', '随访', '一周后', '两周后', '三天后', '一个月后', '回来复查', '定期检查'];
        const hasFollowUp = FOLLOWUP_KEYWORDS.some((kw) => content.includes(kw));
        if (hasFollowUp) {
          let daysLater = 7;
          if (content.includes('三天后') || content.includes('3天后')) daysLater = 3;
          if (content.includes('两周后') || content.includes('2周后')) daysLater = 14;
          if (content.includes('一个月后')) daysLater = 30;
          const scheduledDate = new Date(Date.now() + daysLater * 24 * 60 * 60 * 1000).toISOString();
          window.setTimeout(() => {
            setPendingFollowUp({ date: scheduledDate, note: `AI建议${daysLater}天后复查` });
          }, 0);
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
              summary: '系统正在调整，已为你生成回复',
            },
          ]);
        }

        fullContent = '';
        const fallbackErrorMessage = getChatConnectionFallbackMessage();

        try {
          await chatStream(history, {
            onChunk: (chunk) => {
              fullContent += chunk;
              setStreamingContent(fullContent);
            },
          });

          finalizeAssistantMessage(fullContent || fallbackErrorMessage);
        } catch {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fallbackErrorMessage,
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
      activeSessionStorage,
      messages,
      isLoading,
      locationData,
      diagnosisResult,
      activeFollowUpRecord,
      memoryContext,
      urgencyLevel,
      followupCount,
      applyFollowUpResponse,
      persistConversationSession,
      promoteConversationSessionToCloud,
      refreshCloudSessions,
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
      setActiveSessionStorage(target.storage);
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

  const deleteConversationSession = useCallback(
    (sessionId: string) => {
      const target = conversationSessions.find((session) => session.id === sessionId) ?? null
      if (!target) return null

      if (target.storage === 'supabase') {
        setCloudConversationSessions((prev) => prev.filter((session) => session.id !== sessionId))
      } else {
        const nextSessions = localConversationSessions.filter((session) => session.id !== sessionId)
        setLocalConversationSessions(nextSessions)
        writeConversationSessionsCache(nextSessions)
      }

      if (activeSessionId === sessionId) {
        setMessages([])
        setDiagnosisResult(null)
        setIsLoading(false)
        setStreamingContent('')
        setIsSearchingKB(false)
        setActiveToolCalls([])
        setActiveAgentRoute(null)
        setActiveFollowUpId(null)
        setActiveSessionId(null)
        setActiveSessionStorage(null)
      }

      return target
    },
    [activeSessionId, conversationSessions, localConversationSessions]
  )

  const restoreConversationSession = useCallback(
    (session: ConversationSession) => {
      if (session.storage === 'supabase') {
        setCloudConversationSessions((prev) => upsertConversationSession(prev, session))
        return true
      }

      const nextSessions = upsertConversationSession(localConversationSessions, session)
      setLocalConversationSessions(nextSessions)
      writeConversationSessionsCache(nextSessions)
      return true
    },
    [localConversationSessions]
  )

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
    setActiveSessionStorage(null);
    setUrgencyLevel('green');
    setFollowupCount(0);
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
    urgencyLevel,
    followupCount,
    maxFollowups,
    sendMessage,
    respondToFollowUp,
    openFollowUpRecord,
    loadConversationSession,
    deleteConversationSession,
    restoreConversationSession,
    resetChat,
    pendingFollowUp,
    setPendingFollowUp,
  };
}
