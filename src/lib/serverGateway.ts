export type GatewayService = 'agent-orchestrator' | 'official-source-fetch' | 'knowledge-sync';

type GatewayProvider = 'client' | 'supabase' | 'custom' | 'auto';

interface GatewayRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  path?: string;
  headers?: HeadersInit;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

const gatewayProvider = (
  (import.meta.env.VITE_GATEWAY_PROVIDER as string | undefined)?.trim().toLowerCase() || 'client'
) as GatewayProvider;

const internalApiBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_INTERNAL_API_BASE_URL as string | undefined
);
const supabaseUrl = normalizeBaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseFunctionsBaseUrl =
  normalizeBaseUrl(import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined) ??
  (supabaseUrl ? `${supabaseUrl}/functions/v1` : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export class GatewayNotConfiguredError extends Error {
  constructor(service: GatewayService) {
    super(`Server gateway for "${service}" is not configured.`);
    this.name = 'GatewayNotConfiguredError';
  }
}

function normalizeBaseUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : undefined;
}

function joinUrl(base: string, ...parts: string[]): string {
  const normalized = parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');

  return normalized ? `${base}/${normalized}` : base;
}

function shouldUseSupabaseGateway(): boolean {
  return Boolean(
    supabaseFunctionsBaseUrl && (gatewayProvider === 'supabase' || gatewayProvider === 'auto')
  );
}

function isBodyInit(value: GatewayRequestOptions['body']): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

function buildGatewayHeaders(headers?: HeadersInit, includeJsonContentType = false): Headers {
  const merged = new Headers(headers);

  if (includeJsonContentType && !merged.has('Content-Type')) {
    merged.set('Content-Type', 'application/json');
  }

  if (supabaseAnonKey) {
    if (!merged.has('apikey')) {
      merged.set('apikey', supabaseAnonKey);
    }
    if (!merged.has('Authorization')) {
      merged.set('Authorization', `Bearer ${supabaseAnonKey}`);
    }
  }

  return merged;
}

export function resolveGatewayUrl(service: GatewayService, path = ''): string | null {
  if (internalApiBaseUrl) {
    return joinUrl(internalApiBaseUrl, service, path);
  }

  if (shouldUseSupabaseGateway() && supabaseFunctionsBaseUrl) {
    return joinUrl(supabaseFunctionsBaseUrl, service, path);
  }

  return null;
}

export function hasGatewayRoute(service: GatewayService): boolean {
  return Boolean(resolveGatewayUrl(service));
}

export function isGatewayNotConfiguredError(error: unknown): error is GatewayNotConfiguredError {
  return error instanceof GatewayNotConfiguredError;
}

export async function callGateway(
  service: GatewayService,
  options: GatewayRequestOptions = {}
): Promise<Response> {
  const url = resolveGatewayUrl(service, options.path);
  if (!url) {
    throw new GatewayNotConfiguredError(service);
  }

  const rawBody = options.body;
  const body =
    rawBody === undefined || rawBody === null
      ? undefined
      : isBodyInit(rawBody)
        ? rawBody
        : JSON.stringify(rawBody);

  return fetch(url, {
    ...options,
    headers: buildGatewayHeaders(
      options.headers,
      body !== undefined && !(rawBody instanceof FormData) && !isBodyInit(rawBody)
    ),
    body,
  });
}

export async function callGatewayJson<T>(
  service: GatewayService,
  options: GatewayRequestOptions = {}
): Promise<T> {
  const response = await callGateway(service, options);

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(detail || `Gateway request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
