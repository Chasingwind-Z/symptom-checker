-- 健康助手 Beta：混合检索 / 向量预备升级
-- 目标：在不打破本地 fallback 的前提下，为 chunk 级召回、全文检索和 pgvector 预埋做好结构准备

create extension if not exists vector with schema extensions;

alter table public.medical_knowledge_documents
  add column if not exists search_text text;

create or replace function public.set_medical_knowledge_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text := btrim(
    coalesce(new.title, '') || ' ' ||
    coalesce(new.summary, '') || ' ' ||
    coalesce(array_to_string(new.guidance, ' '), '') || ' ' ||
    coalesce(array_to_string(new.danger_signs, ' '), '') || ' ' ||
    coalesce(array_to_string(new.departments, ' '), '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '') || ' ' ||
    coalesce(array_to_string(new.keywords, ' '), '')
  );
  return new;
end;
$$;

drop trigger if exists set_medical_knowledge_search_text on public.medical_knowledge_documents;

create trigger set_medical_knowledge_search_text
before insert or update of title, summary, guidance, danger_signs, departments, tags, keywords
on public.medical_knowledge_documents
for each row
execute function public.set_medical_knowledge_search_text();

update public.medical_knowledge_documents
set search_text = btrim(
  coalesce(title, '') || ' ' ||
  coalesce(summary, '') || ' ' ||
  coalesce(array_to_string(guidance, ' '), '') || ' ' ||
  coalesce(array_to_string(danger_signs, ' '), '') || ' ' ||
  coalesce(array_to_string(departments, ' '), '') || ' ' ||
  coalesce(array_to_string(tags, ' '), '') || ' ' ||
  coalesce(array_to_string(keywords, ' '), '')
)
where search_text is null or search_text = '';

alter table public.medical_knowledge_chunks
  add column if not exists search_terms text[] not null default '{}'::text[],
  add column if not exists semantic_text text,
  add column if not exists embedding_model text,
  add column if not exists embedding_status text not null default 'pending' check (
    embedding_status in ('pending', 'ready', 'failed', 'skipped')
  ),
  add column if not exists embedding_updated_at timestamptz,
  add column if not exists embedding_dimensions integer,
  add column if not exists embedding extensions.vector(1536);

comment on column public.medical_knowledge_documents.search_text is
'用于全文 / hybrid 检索的聚合字段，便于后续服务端 FTS + rerank。';

comment on column public.medical_knowledge_chunks.search_terms is
'客户端 query expansion 和服务端混合召回可共用的关键词数组。';

comment on column public.medical_knowledge_chunks.semantic_text is
'为未来 embedding 输入、语义摘要和服务端 rerank 预留的文本字段。';

comment on column public.medical_knowledge_chunks.embedding is
'可选的 pgvector embedding 列；未接入向量服务时允许为空。';

create index if not exists idx_medical_knowledge_documents_search_fts
on public.medical_knowledge_documents using gin (to_tsvector('simple', coalesce(search_text, '')));

create index if not exists idx_medical_knowledge_chunks_search_terms
on public.medical_knowledge_chunks using gin (search_terms);

create index if not exists idx_medical_knowledge_chunks_semantic_fts
on public.medical_knowledge_chunks using gin (
  to_tsvector('simple', coalesce(content, '') || ' ' || coalesce(semantic_text, ''))
);

create index if not exists idx_medical_knowledge_chunks_embedding_status
on public.medical_knowledge_chunks (embedding_status, updated_at desc);

create or replace function public.match_medical_knowledge_chunks(
  query_text text,
  match_count integer default 8
)
returns table (
  chunk_id uuid,
  document_id text,
  chunk_index integer,
  heading text,
  content text,
  lexical_rank real,
  vector_score real
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select nullif(trim(regexp_replace(coalesce(query_text, ''), '\s+', ' ', 'g')), '') as q
  )
  select
    c.id as chunk_id,
    c.document_id,
    c.chunk_index,
    c.heading,
    c.content,
    ts_rank(
      to_tsvector('simple', coalesce(c.content, '') || ' ' || coalesce(c.semantic_text, '')),
      plainto_tsquery('simple', normalized.q)
    ) as lexical_rank,
    null::real as vector_score
  from normalized
  join public.medical_knowledge_chunks c on normalized.q is not null
  where to_tsvector('simple', coalesce(c.content, '') || ' ' || coalesce(c.semantic_text, ''))
    @@ plainto_tsquery('simple', normalized.q)
  order by lexical_rank desc, c.updated_at desc
  limit greatest(1, least(match_count, 12));
$$;

grant execute on function public.match_medical_knowledge_chunks(text, integer) to anon, authenticated;

comment on function public.match_medical_knowledge_chunks(text, integer) is
'当前返回 lexical_rank 并预留 vector_score，后续可直接升级为 pgvector + hybrid rerank RPC。';
