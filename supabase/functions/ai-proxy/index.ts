// ============================================================================
// Supabase Edge Function: ai-proxy
// ============================================================================
//
// A lightweight AI API proxy that keeps the AI_API_KEY on the server side,
// preventing it from being exposed in the frontend JavaScript bundle.
//
// Deployment
// ----------
//   supabase functions deploy ai-proxy
//
// Required secrets (set once per project)
// ---------------------------------------
//   supabase secrets set AI_API_KEY=sk-xxxxx AI_BASE_URL=https://api.openai.com
//
// Optional secrets
// ----------------
//   supabase secrets set AI_DEFAULT_MODEL=gpt-4o-mini
//
// Frontend usage
// --------------
//   POST https://<project-ref>.supabase.co/functions/v1/ai-proxy
//   Body: { "messages": [...], "model": "gpt-4o-mini" }
//   The response is streamed back in OpenAI-compatible SSE format.
//
// ============================================================================

import { corsHeaders, jsonResponse } from '../_shared/http.ts';

// ---------------------------------------------------------------------------
// Environment – secrets are injected by `supabase secrets set ...`
// ---------------------------------------------------------------------------
const AI_API_KEY = Deno.env.get('AI_API_KEY');
const AI_BASE_URL = Deno.env.get('AI_BASE_URL');
const AI_DEFAULT_MODEL = Deno.env.get('AI_DEFAULT_MODEL') ?? 'gpt-4o-mini';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProxyRequestBody {
  messages: unknown[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: unknown[];
  tool_choice?: unknown;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request): Promise<Response> => {
  // ---- CORS preflight ----
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ---- Only accept POST ----
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // ---- Validate server-side config ----
  if (!AI_BASE_URL || !AI_API_KEY) {
    return jsonResponse(
      {
        ok: false,
        error: 'missing_env',
        message:
          'AI_BASE_URL and AI_API_KEY must be configured. ' +
          'Run: supabase secrets set AI_API_KEY=xxx AI_BASE_URL=xxx',
      },
      500,
    );
  }

  // ---- Parse incoming request ----
  let body: ProxyRequestBody;
  try {
    body = (await req.json()) as ProxyRequestBody;
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ ok: false, error: 'messages_required' }, 400);
  }

  // ---- Build upstream request (OpenAI-compatible format) ----
  const upstreamUrl = `${AI_BASE_URL.replace(/\/+$/, '')}/v1/chat/completions`;
  const useStream = body.stream !== false; // default to streaming

  const upstreamBody = JSON.stringify({
    model: body.model ?? AI_DEFAULT_MODEL,
    messages: body.messages,
    stream: useStream,
    temperature: body.temperature ?? 0.3,
    max_tokens: body.max_tokens ?? 1000,
    ...(Array.isArray(body.tools) && body.tools.length > 0
      ? { tools: body.tools, tool_choice: body.tool_choice ?? 'auto' }
      : {}),
  });

  // ---- Forward to AI provider ----
  const upstream = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: upstreamBody,
  });

  const contentType =
    upstream.headers.get('content-type') ?? 'application/json; charset=utf-8';

  // ---- Relay error responses ----
  if (!upstream.ok) {
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': contentType },
    });
  }

  // ---- Stream the response back to the client ----
  if (useStream && upstream.body) {
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  }

  // ---- Non-streaming: return full JSON response ----
  return new Response(await upstream.text(), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': contentType },
  });
});
