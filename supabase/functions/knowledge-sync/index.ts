import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

interface KnowledgeSyncRequestBody {
  documents?: Array<Record<string, unknown>>;
  chunks?: Array<Record<string, unknown>>;
  replaceExisting?: boolean;
}

function readEnv(name: string): string | undefined {
  return Deno.env.get(name)?.trim();
}

const SUPABASE_URL = readEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = readEnv('SUPABASE_SERVICE_ROLE_KEY');
const KNOWLEDGE_SYNC_TOKEN = readEnv('KNOWLEDGE_SYNC_TOKEN');

function isAuthorized(req: Request): boolean {
  if (!KNOWLEDGE_SYNC_TOKEN) return false;

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const headerToken = req.headers.get('x-knowledge-sync-token')?.trim();
  return bearer === KNOWLEDGE_SYNC_TOKEN || headerToken === KNOWLEDGE_SYNC_TOKEN;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return jsonResponse({
      ok: true,
      service: 'knowledge-sync',
      configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && KNOWLEDGE_SYNC_TOKEN),
      tables: ['medical_knowledge_documents', 'medical_knowledge_chunks'],
      note: 'POST seeded documents/chunks here to populate the cloud RAG corpus.',
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      {
        ok: false,
        error: 'missing_env',
        message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets.',
      },
      500
    );
  }

  if (!KNOWLEDGE_SYNC_TOKEN) {
    return jsonResponse(
      {
        ok: false,
        error: 'missing_sync_token',
        message: 'Set KNOWLEDGE_SYNC_TOKEN in Edge Function secrets before enabling sync.',
      },
      500
    );
  }

  if (!isAuthorized(req)) {
    return jsonResponse(
      {
        ok: false,
        error: 'unauthorized',
        message: 'Provide a valid x-knowledge-sync-token or Bearer token.',
      },
      401
    );
  }

  let body: KnowledgeSyncRequestBody;
  try {
    body = (await req.json()) as KnowledgeSyncRequestBody;
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const documents = Array.isArray(body.documents) ? body.documents : [];
  const chunks = Array.isArray(body.chunks) ? body.chunks : [];
  const replaceExisting = Boolean(body.replaceExisting);

  if (documents.length === 0) {
    return jsonResponse(
      {
        ok: false,
        error: 'documents_required',
        message: 'Request body must include a non-empty "documents" array.',
      },
      400
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    if (replaceExisting) {
      const { error: deleteChunksError } = await supabase
        .from('medical_knowledge_chunks')
        .delete()
        .gte('chunk_index', 0);
      if (deleteChunksError) {
        throw deleteChunksError;
      }

      const { error: deleteDocumentsError } = await supabase
        .from('medical_knowledge_documents')
        .delete()
        .neq('id', '');
      if (deleteDocumentsError) {
        throw deleteDocumentsError;
      }
    }

    const { error: documentsError } = await supabase
      .from('medical_knowledge_documents')
      .upsert(documents, { onConflict: 'id' });

    if (documentsError) {
      throw documentsError;
    }

    if (chunks.length > 0) {
      const { error: chunksError } = await supabase
        .from('medical_knowledge_chunks')
        .upsert(chunks, { onConflict: 'document_id,chunk_index' });

      if (chunksError) {
        throw chunksError;
      }
    }

    return jsonResponse({
      ok: true,
      service: 'knowledge-sync',
      documentCount: documents.length,
      chunkCount: chunks.length,
      replaceExisting,
      sourceLabel: 'Supabase 云端医学知识库',
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: 'sync_failed',
        message: error instanceof Error ? error.message : 'Unknown sync failure',
        documentCount: documents.length,
        chunkCount: chunks.length,
        replaceExisting,
      },
      500
    );
  }
});
