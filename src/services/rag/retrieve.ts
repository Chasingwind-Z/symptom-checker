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
}

export interface RetrievalResult {
  chunks: KnowledgeChunk[];
  query: string;
  population: Population;
  empty: boolean;
}

// Stub for now — will be connected to Supabase RPC in P2-W3
export async function retrieveKnowledge(
  query: string,
  population: Population,
): Promise<RetrievalResult> {
  // TODO: Generate embedding + call match_knowledge_chunks RPC
  // For now, return empty result (safe fallback)
  return {
    chunks: [],
    query,
    population,
    empty: true,
  };
}
