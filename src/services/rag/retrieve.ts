import type { Population } from '../../types';

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  population: string;
  sourceType: string;
  sourceRef: string;
  sourceDate: string;
  reviewStatus: string;
  similarity: number;
  zhSummary?: string;
}

export interface RetrievalResult {
  chunks: KnowledgeChunk[];
  query: string;
  population: Population;
  empty: boolean;
  fallbackUsed: boolean;
  stats: {
    total: number;
    bySource: Record<string, number>;
  };
}

// ---------------------------------------------------------------------------
// Embedding generation — 2-tier fallback: BGE-M3 → none (text search)
// ---------------------------------------------------------------------------

interface EmbeddingResult {
  embedding: number[] | null;
  method: 'bge-m3' | 'none';
}

async function generateQueryEmbedding(text: string): Promise<EmbeddingResult> {
  // Tier 1: BGE-M3 via configured endpoint
  try {
    const embeddingUrl = import.meta.env.VITE_EMBEDDING_URL;
    if (embeddingUrl) {
      const response = await fetch(embeddingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, model: 'bge-m3' }),
      });
      if (response.ok) {
        const data = await response.json();
        const embedding = data.data?.[0]?.embedding || data.embedding;
        if (embedding && Array.isArray(embedding)) {
          return { embedding, method: 'bge-m3' };
        }
      }
    }
  } catch (e) {
    console.debug('[RAG] BGE-M3 embedding failed, falling back to text search', e);
  }

  // Tier 2: No embedding available → will use text search
  return { embedding: null, method: 'none' };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapToChunks(data: Record<string, unknown>[]): KnowledgeChunk[] {
  return data.map(d => ({
    id: d.id as string,
    title: d.title as string,
    content: d.content as string,
    population: d.population as string,
    sourceType: (d.source_type as string) || '',
    sourceRef: (d.source_ref as string) || '',
    sourceDate: (d.source_date as string) || '',
    reviewStatus: (d.review_status as string) || 'pending_medical_review',
    similarity: (d.similarity as number) || 0.8,
    zhSummary: ((d.metadata as Record<string, unknown>)?.zh_summary as string) || undefined,
  }));
}

function buildResult(
  chunks: KnowledgeChunk[],
  query: string,
  population: Population,
  fallbackUsed: boolean,
): RetrievalResult {
  const stats = {
    total: chunks.length,
    bySource: chunks.reduce((acc, c) => {
      acc[c.sourceType] = (acc[c.sourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
  return { chunks, query, population, empty: false, fallbackUsed, stats };
}

function mapPopulationToAudience(population: Population): string {
  const map: Record<string, string> = {
    self: 'general',
    pediatric: 'pediatric',
    geriatric: 'geriatric',
    chronic: 'chronic',
  };
  return map[population] || 'general';
}

// ---------------------------------------------------------------------------
// Main retrieval — explicit 2-tier fallback: vector search → text search
// ---------------------------------------------------------------------------

export async function retrieveKnowledge(
  query: string,
  population: Population,
): Promise<RetrievalResult> {
  const emptyResult: RetrievalResult = {
    chunks: [], query, population, empty: true, fallbackUsed: true,
    stats: { total: 0, bySource: {} },
  };

  try {
    const { getSupabaseClient } = await import('../../lib/supabase');
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('no client');

    const populationFilter = mapPopulationToAudience(population);

    // Tier 1: Try vector search with embedding
    const { embedding } = await generateQueryEmbedding(query);
    if (embedding) {
      try {
        const { data, error } = await supabase.rpc('match_knowledge_chunks', {
          query_embedding: embedding,
          match_threshold: 0.75,
          match_count: 5,
          filter_population: populationFilter,
        });

        if (!error && data && data.length > 0) {
          const chunks = mapToChunks(data);
          return buildResult(chunks, query, population, false);
        }
      } catch (e) {
        console.debug('[RAG] Vector search failed, trying text search', e);
      }
    }

    // Tier 2: Text search fallback
    try {
      const searchTerms = query.split(/\s+/).slice(0, 3).join(' & ');
      const { data, error } = await supabase
        .from('knowledge_chunks')
        .select('id, title, content, population, source_type, source_ref, source_date, review_status, metadata')
        .eq('is_active', true)
        .or(`population.eq.${populationFilter},population.eq.general`)
        .textSearch('content', searchTerms, { type: 'plain' })
        .limit(5);

      if (!error && data && data.length > 0) {
        const chunks = mapToChunks(data);
        return buildResult(chunks, query, population, true);
      }
    } catch (e) {
      console.debug('[RAG] Text search failed, returning empty', e);
    }
  } catch (e) {
    console.debug('[RAG] Supabase unavailable', e);
  }

  return emptyResult;
}

// ---------------------------------------------------------------------------
// Hint formatting
// ---------------------------------------------------------------------------

export function formatRetrievalHint(
  stats: { total: number; bySource: Record<string, number> },
  fallbackUsed?: boolean,
): string {
  if (stats.total === 0) return 'ℹ️ 知识库未覆盖此问题，以下为通用建议';

  const parts: string[] = [];
  if (stats.bySource.curated) parts.push(`${stats.bySource.curated} 条策展卡片`);
  if (stats.bySource.medlineplus) parts.push(`${stats.bySource.medlineplus} 条 MedlinePlus`);
  if (stats.bySource.cdc) parts.push(`${stats.bySource.cdc} 条 CDC`);

  const hint = parts.length === 1
    ? `✅ 已参考 ${parts[0]}`
    : `✅ 已参考 ${stats.total} 条医学知识（${parts.join(' + ')}）`;

  return fallbackUsed ? `${hint}（文本检索）` : hint;
}