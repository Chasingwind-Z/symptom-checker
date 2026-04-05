import { corsHeaders, jsonResponse } from '../_shared/http.ts';

interface ChatRequestBody {
  model?: string;
  messages?: unknown[];
  stream?: boolean;
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
  max_tokens?: number;
}

function readEnv(name: string, fallback?: string): string | undefined {
  return Deno.env.get(name) ?? fallback;
}

const AI_BASE_URL =
  readEnv('AI_BASE_URL') ?? readEnv('VITE_AI_BASE_URL') ?? readEnv('OPENAI_BASE_URL');
const AI_MODEL =
  readEnv('AI_MODEL') ?? readEnv('VITE_AI_MODEL') ?? readEnv('OPENAI_MODEL') ?? 'gpt-4o-mini';
const AI_API_KEY =
  readEnv('AI_API_KEY') ?? readEnv('VITE_AI_API_KEY') ?? readEnv('OPENAI_API_KEY');

function buildUpstreamHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(AI_API_KEY ? { Authorization: `Bearer ${AI_API_KEY}` } : {}),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return jsonResponse({
      ok: true,
      service: 'agent-orchestrator',
      configured: Boolean(AI_BASE_URL),
      model: AI_MODEL,
      note: 'POST chat payloads here to keep model orchestration server-side.',
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
  }

  if (!AI_BASE_URL) {
    return jsonResponse(
      {
        ok: false,
        error: 'missing_env',
        message: 'Set AI_BASE_URL (and usually AI_API_KEY) in Supabase Edge Function secrets.',
      },
      500
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ ok: false, error: 'messages_required' }, 400);
  }

  const upstream = await fetch(`${AI_BASE_URL.replace(/\/+$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: buildUpstreamHeaders(),
    body: JSON.stringify({
      model: body.model || AI_MODEL,
      messages: body.messages,
      stream: Boolean(body.stream),
      temperature: body.temperature ?? 0.3,
      max_tokens: body.max_tokens ?? 1000,
      ...(Array.isArray(body.tools) && body.tools.length > 0
        ? {
            tools: body.tools,
            tool_choice: body.tool_choice ?? 'auto',
          }
        : {}),
    }),
  });

  const contentType = upstream.headers.get('content-type') ?? 'application/json; charset=utf-8';

  if (!upstream.ok) {
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
      },
    });
  }

  if (body.stream && upstream.body) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  }

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
    },
  });
});
