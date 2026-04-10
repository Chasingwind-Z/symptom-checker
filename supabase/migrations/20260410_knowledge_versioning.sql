-- Add versioning fields to knowledge_chunks
alter table knowledge_chunks
  add column if not exists version integer default 1,
  add column if not exists superseded_by uuid references knowledge_chunks(id),
  add column if not exists is_active boolean default true;

-- Index for active-only queries
create index if not exists idx_knowledge_chunks_active 
  on knowledge_chunks(is_active) where is_active = true;

-- Update RPC to only return active chunks
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
      kc.is_active = true
      and (filter_population is null or kc.population in (filter_population, 'general'))
      and 1 - (kc.embedding <=> query_embedding) > match_threshold
    order by kc.embedding <=> query_embedding
    limit match_count;
end;
$$;
