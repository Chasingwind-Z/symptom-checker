import { callGateway, hasGatewayRoute } from './serverGateway';

// Production: replace direct API call with Supabase Edge Function proxy
// const AI_ENDPOINT = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/ai-proxy'
// This avoids exposing VITE_AI_API_KEY in frontend bundle.
// See supabase/functions/ai-proxy/index.ts for the proxy implementation.

const DIRECT_BASE_URL = import.meta.env.VITE_AI_BASE_URL as string | undefined;
const DEFAULT_MODEL = import.meta.env.VITE_AI_MODEL as string | undefined;
const API_KEY = import.meta.env.VITE_AI_API_KEY as string | undefined;

/** Auto-switch to omni model when messages contain image content */
function selectModel(messages: ChatMessage[]): string | undefined {
  const hasImages = messages.some(
    (m) =>
      Array.isArray(m.content) &&
      m.content.some((c: ChatContentPart) => c.type === 'image_url')
  );
  const base = DEFAULT_MODEL || 'mimo-v2-pro';
  if (hasImages) return 'mimo-v2-omni';
  return base;
}

export interface ChatToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export type ChatContentPart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image_url';
      image_url: {
        url: string;
        detail?: 'low' | 'auto' | 'high';
      };
    };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ChatContentPart[] | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ChatToolCall[];
}

interface ChatCompletionOptions {
  tools?: readonly ChatToolDefinition[] | ChatToolDefinition[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResult {
  content: string;
  toolCalls: ChatToolCall[];
  finishReason?: string | null;
}

interface ChatStreamHandlers {
  onChunk?: (content: string) => void;
  onToolCalls?: (toolCalls: ChatToolCall[]) => void;
  onDone?: (result: ChatCompletionResult) => void;
}

interface ToolAwareChatOptions extends ChatCompletionOptions {
  maxToolRounds?: number;
  executeTool?: (toolCall: ChatToolCall) => Promise<string>;
  onChunk?: (content: string) => void;
  onToolCall?: (
    toolCall: ChatToolCall,
    phase: 'start' | 'done' | 'error',
    payload?: string
  ) => void;
}

function buildHeaders(): HeadersInit {
  return {
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    'Content-Type': 'application/json',
  };
}

function readTextContent(content: unknown): string {
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text;
        }
        return '';
      })
      .join('');
  }

  return '';
}

function normalizeToolCalls(message: Record<string, unknown>): ChatToolCall[] {
  const rawToolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];

  if (rawToolCalls.length > 0) {
    return rawToolCalls
      .map((item, index) => {
        const toolCall = item as Record<string, unknown>;
        const fn = (toolCall.function ?? {}) as Record<string, unknown>;
        const name =
          typeof fn.name === 'string'
            ? fn.name
            : typeof toolCall.name === 'string'
              ? toolCall.name
              : `tool_${index}`;
        const args =
          typeof fn.arguments === 'string'
            ? fn.arguments
            : JSON.stringify(fn.arguments ?? {});

        return {
          id:
            typeof toolCall.id === 'string'
              ? toolCall.id
              : `call_${Date.now()}_${index}`,
          type: 'function' as const,
          function: {
            name,
            arguments: args,
          },
        };
      })
      .filter((item) => item.function.name);
  }

  const legacyFunctionCall = message.function_call as Record<string, unknown> | undefined;
  if (legacyFunctionCall?.name && typeof legacyFunctionCall.name === 'string') {
    return [
      {
        id: `call_${Date.now()}`,
        type: 'function',
        function: {
          name: legacyFunctionCall.name,
          arguments:
            typeof legacyFunctionCall.arguments === 'string'
              ? legacyFunctionCall.arguments
              : JSON.stringify(legacyFunctionCall.arguments ?? {}),
        },
      },
    ];
  }

  return [];
}

function buildChatRequestBody(
  messages: ChatMessage[],
  options: ChatCompletionOptions & { stream: boolean }
) {
  return {
    model: selectModel(messages),
    messages,
    stream: options.stream,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1000,
    ...(options.tools?.length
      ? {
          tools: options.tools,
          tool_choice: options.toolChoice ?? 'auto',
        }
      : {}),
  };
}

async function requestDirectChatCompletion(body: Record<string, unknown>): Promise<Response> {
  if (!DIRECT_BASE_URL) {
    throw new Error('AI 服务暂时不可用，请稍后重试。');
  }

  return fetch(`${DIRECT_BASE_URL.replace(/\/+$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
}

async function requestChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions & { stream: boolean }
): Promise<Response> {
  const body = buildChatRequestBody(messages, options) as Record<string, unknown>;
  let response: Response;

  if (hasGatewayRoute('agent-orchestrator')) {
    try {
      response = await callGateway('agent-orchestrator', {
        method: 'POST',
        path: 'chat',
        body,
      });

      if (response.ok || !DIRECT_BASE_URL) {
        return response;
      }

      if (import.meta.env.DEV) {
        console.warn('[AI Gateway] 服务端请求失败，已回退到浏览器直连模式。', response.status);
      }
    } catch (error) {
      if (!DIRECT_BASE_URL) {
        throw error;
      }
      if (import.meta.env.DEV) {
        console.warn('[AI Gateway] 服务端网关不可用，已回退到浏览器直连模式。', error);
      }
    }
  }

  response = await requestDirectChatCompletion(body);

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

async function simulateStreaming(text: string, onChunk?: (content: string) => void): Promise<void> {
  if (!onChunk || !text) return;

  const chunks = text.match(/.{1,12}/gu) ?? [text];
  for (const chunk of chunks) {
    onChunk(chunk);
    await new Promise((resolve) => window.setTimeout(resolve, 16));
  }
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const result = await chatCompletion(messages);
  return result.content;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  const response = await requestChatCompletion(messages, { ...options, stream: false });
  const data = await response.json();
  const choice = data.choices?.[0] ?? {};
  const message = (choice.message ?? {}) as Record<string, unknown>;

  return {
    content: readTextContent(message.content),
    toolCalls: normalizeToolCalls(message),
    finishReason: choice.finish_reason ?? null,
  };
}

export async function chatStream(
  messages: ChatMessage[],
  handlers: ChatStreamHandlers = {},
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  const response = await requestChatCompletion(messages, { ...options, stream: true });

  if (!response.body) {
    const result = await chatCompletion(messages, options);
    await simulateStreaming(result.content, handlers.onChunk);
    handlers.onDone?.(result);
    return result;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const toolCallBuffer = new Map<
    number,
    {
      id?: string;
      name?: string;
      arguments: string;
    }
  >();

  let buffer = '';
  let fullContent = '';
  let finishReason: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') {
        const toolCalls = Array.from(toolCallBuffer.entries())
          .map(([index, entry]) => ({
            id: entry.id ?? `call_${Date.now()}_${index}`,
            type: 'function' as const,
            function: {
              name: entry.name ?? `tool_${index}`,
              arguments: entry.arguments || '{}',
            },
          }))
          .filter((item) => item.function.name);

        const result = { content: fullContent, toolCalls, finishReason };
        handlers.onToolCalls?.(toolCalls);
        handlers.onDone?.(result);
        return result;
      }

      try {
        const parsed = JSON.parse(payload);
        const choice = parsed.choices?.[0];
        const delta = choice?.delta ?? {};

        if (typeof choice?.finish_reason === 'string') {
          finishReason = choice.finish_reason;
        }

        if (typeof delta.content === 'string') {
          fullContent += delta.content;
          handlers.onChunk?.(delta.content);
        }

        if (Array.isArray(delta.tool_calls)) {
          delta.tool_calls.forEach((item: Record<string, unknown>, index: number) => {
            const current = toolCallBuffer.get(index) ?? { arguments: '' };
            const fn = (item.function ?? {}) as Record<string, unknown>;

            current.id = typeof item.id === 'string' ? item.id : current.id;
            current.name =
              typeof fn.name === 'string' ? `${current.name ?? ''}${fn.name}` : current.name;
            if (typeof fn.arguments === 'string') {
              current.arguments += fn.arguments;
            }

            toolCallBuffer.set(index, current);
          });
        }
      } catch {
        // Ignore malformed stream chunks and continue.
      }
    }
  }

  const toolCalls = Array.from(toolCallBuffer.entries()).map(([index, entry]) => ({
    id: entry.id ?? `call_${Date.now()}_${index}`,
    type: 'function' as const,
    function: {
      name: entry.name ?? `tool_${index}`,
      arguments: entry.arguments || '{}',
    },
  }));

  const result = { content: fullContent, toolCalls, finishReason };
  handlers.onToolCalls?.(toolCalls);
  handlers.onDone?.(result);
  return result;
}

export async function runToolAwareChat(
  messages: ChatMessage[],
  options: ToolAwareChatOptions = {}
): Promise<ChatCompletionResult> {
  const conversation = [...messages];
  const maxToolRounds = options.maxToolRounds ?? 4;

  for (let round = 0; round < maxToolRounds; round += 1) {
    const result = await chatCompletion(conversation, {
      tools: options.tools,
      toolChoice: round === 0 ? options.toolChoice : options.tools?.length ? 'auto' : 'none',
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    if (result.toolCalls.length === 0 || !options.executeTool) {
      await simulateStreaming(result.content, options.onChunk);
      return result;
    }

    conversation.push({
      role: 'assistant',
      content: result.content || null,
      tool_calls: result.toolCalls,
    });

    for (const toolCall of result.toolCalls) {
      options.onToolCall?.(toolCall, 'start');

      try {
        const toolOutput = await options.executeTool(toolCall);
        options.onToolCall?.(toolCall, 'done', toolOutput);
        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolOutput,
        });
      } catch (error) {
        const errorPayload = JSON.stringify({
          ok: false,
          error: error instanceof Error ? error.message : '工具调用失败',
        });
        options.onToolCall?.(toolCall, 'error', errorPayload);
        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: errorPayload,
        });
      }
    }
  }

  const fallbackContent = '抱歉，工具调用次数较多。我先给出保守建议：若症状加重，请尽快线下就医。';
  await simulateStreaming(fallbackContent, options.onChunk);
  return {
    content: fallbackContent,
    toolCalls: [],
    finishReason: 'stop',
  };
}
