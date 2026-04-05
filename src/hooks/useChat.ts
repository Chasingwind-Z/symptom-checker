import { useState, useCallback, useEffect } from 'react';
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
import type {
  AgentRoute,
  ChatImageAttachment,
  DiagnosisResult,
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

const FOLLOW_UP_STORAGE_KEY = 'symptom_followup_cases';
const FOLLOW_UP_OPTIONS = ['明显好转', '略有好转', '没有变化', '更严重了'] as const;
const FOLLOW_UP_DISTRICTS = [
  '朝阳区',
  '海淀区',
  '东城区',
  '西城区',
  '丰台区',
  '石景山区',
  '通州区',
  '顺义区',
  '昌平区',
  '大兴区',
  '房山区',
  '门头沟区',
] as const;

interface FollowUpCase {
  id: string;
  summary: string;
  level: DiagnosisResult['level'];
  createdAt: number;
  district: string;
  response?: (typeof FOLLOW_UP_OPTIONS)[number];
  respondedAt?: number;
}

function readFollowUpCases(): FollowUpCase[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(FOLLOW_UP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FollowUpCase[]) : [];
  } catch {
    return [];
  }
}

function writeFollowUpCases(cases: FollowUpCase[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FOLLOW_UP_STORAGE_KEY, JSON.stringify(cases));
}

function createFollowUpCase(userText: string, result: DiagnosisResult): FollowUpCase {
  const summary = userText.replace(/\s+/g, '').slice(0, 18) || result.reason.slice(0, 18);
  const district =
    FOLLOW_UP_DISTRICTS[Math.floor(Math.random() * FOLLOW_UP_DISTRICTS.length)];

  return {
    id: `followup-${Date.now()}`,
    summary,
    level: result.level,
    createdAt: Date.now(),
    district,
  };
}

function queueFollowUpCase(userText: string, result: DiagnosisResult) {
  const nextCase = createFollowUpCase(userText, result);
  const existing = readFollowUpCases().filter((item) => item.id !== nextCase.id);
  writeFollowUpCases([nextCase, ...existing].slice(0, 8));
}

function getDueFollowUpCase(): FollowUpCase | null {
  const reminderDelay = import.meta.env.DEV ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const now = Date.now();
  return (
    readFollowUpCases().find(
      (item) => !item.response && now - item.createdAt >= reminderDelay
    ) ?? null
  );
}

function saveFollowUpResponse(caseId: string, response: (typeof FOLLOW_UP_OPTIONS)[number]) {
  const nextCases = readFollowUpCases().map((item) =>
    item.id === caseId
      ? {
          ...item,
          response,
          respondedAt: Date.now(),
        }
      : item
  );
  writeFollowUpCases(nextCases);
}

function buildFollowUpMessage(followUpCase: FollowUpCase): Message {
  return {
    id: `followup-prompt-${followUpCase.id}`,
    role: 'assistant',
    content: `上次您提到“${followUpCase.summary}”，现在感觉怎么样了？\n{"suggestions": ["明显好转", "略有好转", "没有变化", "更严重了"]}`,
    timestamp: new Date(),
    suggestions: [...FOLLOW_UP_OPTIONS],
  };
}

export function useChat(memoryContext?: AgentMemoryContext | null) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const dueFollowUp = getDueFollowUpCase();
    return dueFollowUp ? [buildFollowUpMessage(dueFollowUp)] : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isSearchingKB, setIsSearchingKB] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [pendingFollowUp, setPendingFollowUp] = useState<FollowUpCase | null>(() =>
    getDueFollowUpCase()
  );
  const [activeAgentRoute, setActiveAgentRoute] = useState<AgentRoute | null>(null);

  useEffect(() => {
    void primeMedicalKnowledgeCorpus();

    const initWeather = async () => {
      try {
        const loc = await requestGeolocation();
        setLocationData(loc);
        const weather = await fetchWeather(loc.lat, loc.lon);
        if (weather) setWeatherData(weather);
      } catch (e) {
        console.warn('[WeatherBar] 定位失败，尝试使用默认位置:', e);
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

      const isFollowUpReply = FOLLOW_UP_OPTIONS.includes(
        displayText as (typeof FOLLOW_UP_OPTIONS)[number]
      );

      if (pendingFollowUp && isFollowUpReply) {
        saveFollowUpResponse(
          pendingFollowUp.id,
          displayText as (typeof FOLLOW_UP_OPTIONS)[number]
        );
        setPendingFollowUp(null);
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: displayText,
        timestamp: new Date(),
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
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
          pendingFollowUpSummary: pendingFollowUp?.summary ?? null,
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
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          suggestions,
          toolCalls: Array.from(toolCallMap.values()).filter((item) => item.status !== 'running'),
          agentRoute: orchestration.route,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');
        setIsLoading(false);
        setIsSearchingKB(false);

        const result = extractDiagnosis(content);
        if (result) {
          setDiagnosisResult(result);
          queueFollowUpCase(displayText, result);
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
      } catch (toolFlowError) {
        console.warn('[Chat] tool-aware flow failed, fallback to plain stream:', toolFlowError);

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
        } catch (err) {
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
          console.error('Chat error:', err);
        }
      }
    },
    [messages, isLoading, locationData, diagnosisResult, pendingFollowUp, memoryContext]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setStreamingContent('');
    setDiagnosisResult(null);
    setIsSearchingKB(false);
    setActiveToolCalls([]);
    setActiveAgentRoute(null);
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
    sendMessage,
    resetChat,
  };
}
