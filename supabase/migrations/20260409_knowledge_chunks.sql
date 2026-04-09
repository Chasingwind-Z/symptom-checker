-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Knowledge chunks table
create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  title text not null,
  population text not null default 'general',
  source_type text not null default 'curated',
  source_ref text,
  source_date date,
  review_status text not null default 'pending_medical_review',
  metadata jsonb default '{}',
  embedding vector(1024),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table knowledge_chunks enable row level security;
create policy "public_read_knowledge" on knowledge_chunks for select using (true);
create policy "service_write_knowledge" on knowledge_chunks for insert with check (true);
create policy "service_update_knowledge" on knowledge_chunks for update using (true);

-- HNSW index for vector similarity search
create index if not exists idx_knowledge_embedding on knowledge_chunks
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);

-- Index for population filtering
create index if not exists idx_knowledge_population on knowledge_chunks (population);
create index if not exists idx_knowledge_source_type on knowledge_chunks (source_type);

-- RPC function for similarity search with population filtering
create or replace function match_knowledge_chunks(
  query_embedding vector(1024),
  match_threshold float default 0.75,
  match_count int default 5,
  filter_population text default null
)
returns table(
  id uuid,
  content text,
  title text,
  population text,
  source_type text,
  source_ref text,
  source_date date,
  review_status text,
  metadata jsonb,
  similarity float
)
language plpgsql stable as $$
begin
  return query
    select
      kc.id, kc.content, kc.title, kc.population,
      kc.source_type, kc.source_ref, kc.source_date,
      kc.review_status, kc.metadata,
      1 - (kc.embedding <=> query_embedding) as similarity
    from knowledge_chunks kc
    where
      (filter_population is null or kc.population in (filter_population, 'general'))
      and 1 - (kc.embedding <=> query_embedding) > match_threshold
    order by kc.embedding <=> query_embedding
    limit match_count;
end;
$$;
