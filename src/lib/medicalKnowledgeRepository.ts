import type { Database } from '../types/supabase';
import { callGatewayJson } from './serverGateway';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import type {
  MedicalKnowledgeAudience,
  MedicalKnowledgeCategory,
  MedicalKnowledgeChunk,
  MedicalKnowledgeDocument,
  MedicalKnowledgeRetrievalMode,
  MedicalKnowledgeStorageMode,
} from './medicalKnowledge';

const MEDICAL_KNOWLEDGE_CLOUD_CACHE_KEY = 'symptom_medical_knowledge_cloud_cache_v2';
const DEFAULT_CLOUD_SOURCE_LABEL = 'Supabase 云端医学知识库';
const CLOUD_FETCH_TTL_MS = 5 * 60 * 1000;
const cloudKnowledgeEnabled =
  (import.meta.env.VITE_ENABLE_CLOUD_KNOWLEDGE as string | undefined)?.trim().toLowerCase() !==
  'false';

type MedicalKnowledgeDocumentRow = Database['public']['Tables']['medical_knowledge_documents']['Row'];
type MedicalKnowledgeChunkRow = Database['public']['Tables']['medical_knowledge_chunks']['Row'];

type MedicalKnowledgeCloudState = 'disabled' | 'idle' | 'loading' | 'ready' | 'error';

interface PersistedMedicalKnowledgeCache {
  documents: MedicalKnowledgeDocument[];
  chunks: MedicalKnowledgeChunk[];
  sourceLabel: string;
  lastUpdated: string;
  fetchedAt: number;
  retrievalMode: MedicalKnowledgeRetrievalMode;
  vectorReady: boolean;
}

export interface MedicalKnowledgeCloudSnapshot {
  state: MedicalKnowledgeCloudState;
  documents: MedicalKnowledgeDocument[];
  chunks: MedicalKnowledgeChunk[];
  sourceLabel: string;
  storageMode: MedicalKnowledgeStorageMode;
  retrievalMode: MedicalKnowledgeRetrievalMode;
  vectorReady: boolean;
  lastUpdated: string;
  fetchedAt: number;
  error?: string;
}

export interface MedicalKnowledgeSyncPayload {
  documents: Database['public']['Tables']['medical_knowledge_documents']['Insert'][];
  chunks: Database['public']['Tables']['medical_knowledge_chunks']['Insert'][];
  replaceExisting?: boolean;
}

export interface MedicalKnowledgeSyncResponse {
  ok: boolean;
  documentCount: number;
  chunkCount: number;
  replaceExisting: boolean;
  sourceLabel?: string;
  lastSyncedAt?: string;
  error?: string;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function deriveLastUpdated(documents: MedicalKnowledgeDocument[]): string {
  const candidates = documents
    .map((document) => document.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => left.localeCompare(right));

  return candidates.at(-1) ?? new Date().toISOString();
}

function getDefaultStorageMode(): MedicalKnowledgeStorageMode {
  return isSupabaseConfigured && cloudKnowledgeEnabled
    ? 'seeded-local-supabase-ready'
    : 'seeded-local';
}

function getDefaultRetrievalMode(): MedicalKnowledgeRetrievalMode {
  return 'hybrid-local';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createSnapshot(
  state: MedicalKnowledgeCloudState,
  overrides: Partial<MedicalKnowledgeCloudSnapshot> = {}
): MedicalKnowledgeCloudSnapshot {
  return {
    state,
    documents: [],
    chunks: [],
    sourceLabel: DEFAULT_CLOUD_SOURCE_LABEL,
    storageMode: getDefaultStorageMode(),
    retrievalMode: getDefaultRetrievalMode(),
    vectorReady: false,
    lastUpdated: '',
    fetchedAt: 0,
    ...overrides,
  };
}

function readPersistedCache(): PersistedMedicalKnowledgeCache | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(MEDICAL_KNOWLEDGE_CLOUD_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedMedicalKnowledgeCache>;
    if (!Array.isArray(parsed.documents) || parsed.documents.length === 0) {
      return null;
    }

    return {
      documents: parsed.documents as MedicalKnowledgeDocument[],
      chunks: Array.isArray(parsed.chunks)
        ? (parsed.chunks as MedicalKnowledgeChunk[])
        : [],
      sourceLabel:
        typeof parsed.sourceLabel === 'string' && parsed.sourceLabel.trim()
          ? parsed.sourceLabel
          : DEFAULT_CLOUD_SOURCE_LABEL,
      lastUpdated:
        typeof parsed.lastUpdated === 'string' && parsed.lastUpdated.trim()
          ? parsed.lastUpdated
          : deriveLastUpdated(parsed.documents as MedicalKnowledgeDocument[]),
      fetchedAt: typeof parsed.fetchedAt === 'number' ? parsed.fetchedAt : Date.now(),
      retrievalMode:
        typeof parsed.retrievalMode === 'string'
          ? (parsed.retrievalMode as MedicalKnowledgeRetrievalMode)
          : getDefaultRetrievalMode(),
      vectorReady: parsed.vectorReady === true,
    };
  } catch {
    return null;
  }
}

function persistSnapshot(snapshot: MedicalKnowledgeCloudSnapshot) {
  if (typeof window === 'undefined' || snapshot.documents.length === 0) return;

  try {
    const cache: PersistedMedicalKnowledgeCache = {
      documents: snapshot.documents,
      chunks: snapshot.chunks,
      sourceLabel: snapshot.sourceLabel,
      lastUpdated: snapshot.lastUpdated,
      fetchedAt: snapshot.fetchedAt,
      retrievalMode: snapshot.retrievalMode,
      vectorReady: snapshot.vectorReady,
    };
    localStorage.setItem(MEDICAL_KNOWLEDGE_CLOUD_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 本地缓存失败时静默降级，不影响搜索逻辑
  }
}

function mapDocumentRow(row: MedicalKnowledgeDocumentRow): MedicalKnowledgeDocument {
  return {
    id: row.id,
    title: row.title,
    category: row.category as MedicalKnowledgeCategory,
    audience: row.audience as MedicalKnowledgeAudience,
    triageLevel: row.triage_level,
    summary: row.summary,
    guidance: toStringArray(row.guidance),
    dangerSigns: toStringArray(row.danger_signs),
    departments: toStringArray(row.departments),
    tags: toStringArray(row.tags),
    keywords: toStringArray(row.keywords),
    sourceLabel: row.source_label?.trim() || DEFAULT_CLOUD_SOURCE_LABEL,
    updatedAt: row.updated_at || row.version || new Date().toISOString(),
  };
}

function mapChunkRow(row: MedicalKnowledgeChunkRow): MedicalKnowledgeChunk {
  const metadata = isRecord(row.metadata) ? row.metadata : {};

  return {
    id: row.id,
    documentId: row.document_id,
    chunkIndex: row.chunk_index,
    heading: row.heading,
    content: row.content,
    tokenCount: row.token_count,
    metadata: {
      category:
        typeof metadata.category === 'string'
          ? (metadata.category as MedicalKnowledgeCategory)
          : undefined,
      audience:
        typeof metadata.audience === 'string'
          ? (metadata.audience as MedicalKnowledgeAudience)
          : undefined,
      triageLevel:
        typeof metadata.triage_level === 'string'
          ? (metadata.triage_level as MedicalKnowledgeDocument['triageLevel'])
          : undefined,
      tags: toStringArray(metadata.tags),
      searchTerms: toStringArray(row.search_terms ?? metadata.search_terms),
      semanticHints: toStringArray(metadata.semantic_hints),
      sourceLabel:
        typeof metadata.source_label === 'string' ? metadata.source_label : DEFAULT_CLOUD_SOURCE_LABEL,
      embeddingModel:
        typeof row.embedding_model === 'string'
          ? row.embedding_model
          : typeof metadata.embedding_model === 'string'
            ? metadata.embedding_model
            : null,
      embeddingDimensions:
        typeof row.embedding_dimensions === 'number'
          ? row.embedding_dimensions
          : typeof metadata.embedding_dimensions === 'number'
            ? metadata.embedding_dimensions
            : null,
      embeddingStatus:
        typeof row.embedding_status === 'string'
          ? row.embedding_status
          : typeof metadata.embedding_status === 'string'
            ? metadata.embedding_status
            : 'pending',
      vectorScore:
        typeof metadata.vector_score === 'number'
          ? metadata.vector_score
          : typeof metadata.similarity_score === 'number'
            ? metadata.similarity_score
            : null,
    },
    sourceLabel:
      typeof metadata.source_label === 'string' ? metadata.source_label : DEFAULT_CLOUD_SOURCE_LABEL,
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function hasVectorReadyMetadata(chunks: MedicalKnowledgeChunk[]): boolean {
  return chunks.some((chunk) => {
    const metadata = chunk.metadata;
    return (
      metadata.embeddingStatus === 'ready' ||
      typeof metadata.embeddingModel === 'string' ||
      typeof metadata.vectorScore === 'number'
    );
  });
}

async function fetchKnowledgeChunks(client: NonNullable<ReturnType<typeof getSupabaseClient>>) {
  const preferredSelect = [
    'id',
    'document_id',
    'chunk_index',
    'heading',
    'content',
    'token_count',
    'search_terms',
    'semantic_text',
    'embedding_model',
    'embedding_status',
    'embedding_updated_at',
    'embedding_dimensions',
    'metadata',
    'updated_at',
  ].join(', ');

  const preferredResponse = (await client
    .from('medical_knowledge_chunks')
    .select(preferredSelect)
    .order('document_id', { ascending: true })
    .order('chunk_index', { ascending: true })) as {
    data: MedicalKnowledgeChunkRow[] | null;
    error: Error | null;
  };

  let responseData: MedicalKnowledgeChunkRow[] = Array.isArray(preferredResponse.data)
    ? preferredResponse.data
    : [];
  let responseError = preferredResponse.error;

  if (
    responseError &&
    /(search_terms|semantic_text|embedding_model|embedding_status|embedding_updated_at|embedding_dimensions)/i.test(
      responseError.message
    )
  ) {
    const fallbackResponse = (await client
      .from('medical_knowledge_chunks')
      .select('id, document_id, chunk_index, heading, content, token_count, metadata, updated_at')
      .order('document_id', { ascending: true })
      .order('chunk_index', { ascending: true })) as {
      data: MedicalKnowledgeChunkRow[] | null;
      error: Error | null;
    };

    responseData = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
    responseError = fallbackResponse.error;
  }

  if (responseError) {
    throw responseError;
  }

  return responseData;
}

const persistedCache =
  isSupabaseConfigured && cloudKnowledgeEnabled ? readPersistedCache() : null;

let cloudSnapshot: MedicalKnowledgeCloudSnapshot =
  persistedCache && persistedCache.documents.length > 0
    ? createSnapshot('ready', {
        documents: persistedCache.documents,
        chunks: persistedCache.chunks,
        sourceLabel: persistedCache.sourceLabel,
        storageMode: 'supabase-public',
        retrievalMode: persistedCache.retrievalMode,
        vectorReady: persistedCache.vectorReady,
        lastUpdated: persistedCache.lastUpdated,
        fetchedAt: persistedCache.fetchedAt,
      })
    : createSnapshot(isSupabaseConfigured && cloudKnowledgeEnabled ? 'idle' : 'disabled');

let cloudFetchPromise: Promise<MedicalKnowledgeCloudSnapshot> | null = null;

export function getCloudMedicalKnowledgeSnapshot(): MedicalKnowledgeCloudSnapshot {
  if (!isSupabaseConfigured || !cloudKnowledgeEnabled) {
    return createSnapshot('disabled');
  }

  return cloudSnapshot;
}

export async function primeCloudMedicalKnowledgeDocuments(
  options: { force?: boolean } = {}
): Promise<MedicalKnowledgeCloudSnapshot> {
  if (!isSupabaseConfigured || !cloudKnowledgeEnabled) {
    cloudSnapshot = createSnapshot('disabled');
    return cloudSnapshot;
  }

  const now = Date.now();
  if (
    !options.force &&
    cloudSnapshot.state === 'ready' &&
    cloudSnapshot.documents.length > 0 &&
    now - cloudSnapshot.fetchedAt < CLOUD_FETCH_TTL_MS
  ) {
    return cloudSnapshot;
  }

  if (cloudFetchPromise) {
    return cloudFetchPromise;
  }

  const client = getSupabaseClient();
  if (!client) {
    cloudSnapshot = createSnapshot('error', {
      storageMode: 'supabase-fallback-local',
      retrievalMode: 'hybrid-local',
      error: 'Supabase 客户端不可用，已回退到本地知识库。',
    });
    return cloudSnapshot;
  }

  cloudSnapshot = {
    ...cloudSnapshot,
    state: 'loading',
    storageMode: cloudSnapshot.documents.length > 0 ? 'supabase-public' : 'supabase-fallback-local',
    retrievalMode: cloudSnapshot.documents.length > 0 ? cloudSnapshot.retrievalMode : 'hybrid-local',
  };

  cloudFetchPromise = (async () => {
    try {
      const { data, error } = await client
        .from('medical_knowledge_documents')
        .select(
          [
            'id',
            'title',
            'category',
            'audience',
            'triage_level',
            'summary',
            'guidance',
            'danger_signs',
            'departments',
            'tags',
            'keywords',
            'source_label',
            'version',
            'updated_at',
          ].join(', ')
        )
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const rows = Array.isArray(data) ? ((data as unknown) as MedicalKnowledgeDocumentRow[]) : [];
      const documents = rows.map(mapDocumentRow);
      const chunkRows = await fetchKnowledgeChunks(client);
      const chunks = chunkRows.map(mapChunkRow);
      const vectorReady = hasVectorReadyMetadata(chunks);

      if (documents.length === 0) {
        cloudSnapshot = createSnapshot('idle', {
          storageMode: 'supabase-fallback-local',
          retrievalMode: 'hybrid-local',
          error: '云端知识库暂时为空，继续使用本地 seeded corpus。',
        });
        return cloudSnapshot;
      }

      cloudSnapshot = createSnapshot('ready', {
        documents,
        chunks,
        sourceLabel: documents[0]?.sourceLabel?.trim() || DEFAULT_CLOUD_SOURCE_LABEL,
        storageMode: 'supabase-public',
        retrievalMode: vectorReady ? 'hybrid-cloud-vector-ready' : 'hybrid-cloud',
        vectorReady,
        lastUpdated: deriveLastUpdated(documents),
        fetchedAt: Date.now(),
      });
      persistSnapshot(cloudSnapshot);
      return cloudSnapshot;
    } catch (error) {
      const message = error instanceof Error ? error.message : '云端知识库加载失败';
      if (import.meta.env.DEV) {
        console.warn('[MedicalKnowledge] 云端知识库加载失败，已回退到本地语料：', message);
      }

      cloudSnapshot =
        cloudSnapshot.documents.length > 0
            ? {
                ...cloudSnapshot,
                state: 'ready',
                storageMode: 'supabase-public',
                retrievalMode: cloudSnapshot.vectorReady
                  ? 'hybrid-cloud-vector-ready'
                  : 'hybrid-cloud',
                error: message,
              }
            : createSnapshot('error', {
                storageMode: 'supabase-fallback-local',
                retrievalMode: 'hybrid-local',
                error: message,
              });
      return cloudSnapshot;
    } finally {
      cloudFetchPromise = null;
    }
  })();

  return cloudFetchPromise;
}

export async function syncMedicalKnowledgeToGateway(
  payload: MedicalKnowledgeSyncPayload,
  syncToken?: string
): Promise<MedicalKnowledgeSyncResponse> {
  const headers = syncToken ? { 'x-knowledge-sync-token': syncToken } : undefined;

  return callGatewayJson<MedicalKnowledgeSyncResponse>('knowledge-sync', {
    method: 'POST',
    headers,
    body: (payload as unknown) as Record<string, unknown>,
  });
}
