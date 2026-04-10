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

const POPULATION_TO_AUDIENCE: Record<string, string[]> = {
  self: ['通用'],
  pediatric: ['儿童', '通用'],
  geriatric: ['老年人', '通用'],
  chronic: ['慢病患者', '通用'],
};

function localKeywordSearch(_query: string, _population: Population): KnowledgeChunk[] {
  try {
    // Simple keyword matching fallback — returns empty for now,
    // will be enhanced when seed data is available in Supabase
    return [];
  } catch {
    return [];
  }
}

export async function retrieveKnowledge(
  query: string,
  population: Population,
): Promise<RetrievalResult> {
  const allowedAudiences = POPULATION_TO_AUDIENCE[population] ?? ['通用'];

  // Try Supabase RPC first (lexical + optional vector search)
  try {
    const { getSupabaseClient } = await import('../../lib/supabase');
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('no client');

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'match_medical_knowledge_chunks',
      { query_text: query, match_count: 8 },
    );

    if (!rpcError && rpcData && rpcData.length > 0) {
      // Fetch parent document metadata so we can filter by audience/population
      const docIds = [...new Set(rpcData.map((r: { document_id: string }) => r.document_id))];
      const { data: docs } = await supabase
        .from('medical_knowledge_documents')
        .select('id, title, audience, source_label, source_url, updated_at')
        .in('id', docIds);

      const docMap = new Map(
        (docs ?? []).map((d: Record<string, unknown>) => [d.id as string, d]),
      );

      const chunks: KnowledgeChunk[] = rpcData
        .map((r: Record<string, unknown>) => {
          const doc = docMap.get(r.document_id as string) as Record<string, unknown> | undefined;
          if (!doc) return null;
          // Population filter: only allow matching audiences
          if (!allowedAudiences.includes(doc.audience as string)) return null;
          return {
            id: r.chunk_id as string,
            title: (doc.title as string) ?? '',
            content: r.content as string,
            population: doc.audience as string,
            sourceType: (doc.source_label as string) ?? 'curated',
            sourceRef: (doc.source_url as string) ?? '',
            sourceDate: (doc.updated_at as string) ?? '',
            reviewStatus: 'pending_medical_review',
            similarity: (r.vector_score as number) ?? (r.lexical_rank as number) ?? 0.8,
          } satisfies KnowledgeChunk;
        })
        .filter((c: KnowledgeChunk | null): c is KnowledgeChunk => c !== null)
        .slice(0, 5);

      if (chunks.length > 0) {
        const stats = {
          total: chunks.length,
          bySource: chunks.reduce((acc, c) => {
            acc[c.sourceType] = (acc[c.sourceType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };
        return { chunks, query, population, empty: false, fallbackUsed: false, stats };
      }
    }

    // Fallback: direct text search on chunks joined with documents
    const queryTerms = query.split(/\s+/).filter(w => w.length > 1).slice(0, 3).join(' & ');
    if (queryTerms) {
      const { data: chunkRows, error: chunkErr } = await supabase
        .from('medical_knowledge_chunks')
        .select(`
          id, content, heading, document_id,
          medical_knowledge_documents!inner(id, title, audience, source_label, source_url, updated_at)
        `)
        .textSearch('content', queryTerms, { type: 'plain' })
        .in('medical_knowledge_documents.audience', allowedAudiences)
        .limit(5);

      if (!chunkErr && chunkRows && chunkRows.length > 0) {
        const chunks: KnowledgeChunk[] = chunkRows.map((row: Record<string, unknown>) => {
          const doc = row.medical_knowledge_documents as Record<string, unknown> | undefined;
          return {
            id: row.id as string,
            title: (doc?.title as string) ?? (row.heading as string) ?? '',
            content: row.content as string,
            population: (doc?.audience as string) ?? '通用',
            sourceType: (doc?.source_label as string) ?? 'curated',
            sourceRef: (doc?.source_url as string) ?? '',
            sourceDate: (doc?.updated_at as string) ?? '',
            reviewStatus: 'pending_medical_review',
            similarity: 0.7,
          };
        });

        const stats = {
          total: chunks.length,
          bySource: chunks.reduce((acc, c) => {
            acc[c.sourceType] = (acc[c.sourceType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };
        return { chunks, query, population, empty: false, fallbackUsed: false, stats };
      }
    }
  } catch {
    // Supabase unavailable, fall through to local fallback
  }

  // Local fallback
  const localResults = localKeywordSearch(query, population);
  const stats = {
    total: localResults.length,
    bySource: localResults.reduce((acc, c) => {
      acc[c.sourceType] = (acc[c.sourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
  return {
    chunks: localResults,
    query,
    population,
    empty: localResults.length === 0,
    fallbackUsed: true,
    stats,
  };
}

export function formatRetrievalHint(stats: { total: number; bySource: Record<string, number> }): string {
  if (stats.total === 0) return 'ℹ️ 知识库未覆盖此问题，以下为通用建议';

  const parts: string[] = [];
  if (stats.bySource.curated) parts.push(`${stats.bySource.curated} 条策展卡片`);
  if (stats.bySource.medlineplus) parts.push(`${stats.bySource.medlineplus} 条 MedlinePlus`);
  if (stats.bySource.cdc) parts.push(`${stats.bySource.cdc} 条 CDC`);

  if (parts.length === 1) return `✅ 已参考 ${parts[0]}`;
  return `✅ 已参考 ${stats.total} 条医学知识（${parts.join(' + ')}）`;
}
