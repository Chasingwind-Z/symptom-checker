-- 健康助手 Beta：RAG Lite 医学知识库云端脚手架
-- 目标：让本地 seeded corpus 可以平滑落到 Supabase，先做结构化全文检索，后续再升级到 pgvector

create table if not exists public.medical_knowledge_documents (
  id text primary key,
  locale text not null default 'zh-CN',
  title text not null,
  category text not null check (
    category in ('symptom_guidance', 'danger_signs', 'department_guidance', 'population_guidance', 'self_care')
  ),
  audience text not null check (
    audience in ('通用', '儿童', '老年人', '慢病患者', '孕产妇')
  ),
  triage_level public.triage_level not null default 'yellow',
  summary text not null,
  guidance text[] not null default '{}'::text[],
  danger_signs text[] not null default '{}'::text[],
  departments text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  keywords text[] not null default '{}'::text[],
  source_label text not null default 'Supabase 云端医学知识库',
  source_url text,
  version text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  is_seeded boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.medical_knowledge_documents is
'RAG Lite 医学知识文档主表，当前先支持结构化 / 关键词检索，后续可追加 embedding 列与 pgvector。';

create table if not exists public.medical_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references public.medical_knowledge_documents (id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  heading text,
  content text not null,
  token_count integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (document_id, chunk_index)
);

comment on table public.medical_knowledge_chunks is
'医学知识 chunk 层，为后续更细粒度召回、pgvector 和服务端 rerank 做准备。';

create index if not exists idx_medical_knowledge_documents_active
on public.medical_knowledge_documents (is_active, updated_at desc);

create index if not exists idx_medical_knowledge_documents_category
on public.medical_knowledge_documents (category, triage_level);

create index if not exists idx_medical_knowledge_documents_tags
on public.medical_knowledge_documents using gin (tags);

create index if not exists idx_medical_knowledge_documents_keywords
on public.medical_knowledge_documents using gin (keywords);

create index if not exists idx_medical_knowledge_chunks_document
on public.medical_knowledge_chunks (document_id, chunk_index);

create index if not exists idx_medical_knowledge_chunks_content_fts
on public.medical_knowledge_chunks using gin (to_tsvector('simple', content));

drop trigger if exists set_medical_knowledge_documents_updated_at on public.medical_knowledge_documents;
create trigger set_medical_knowledge_documents_updated_at
before update on public.medical_knowledge_documents
for each row execute function public.set_updated_at();

drop trigger if exists set_medical_knowledge_chunks_updated_at on public.medical_knowledge_chunks;
create trigger set_medical_knowledge_chunks_updated_at
before update on public.medical_knowledge_chunks
for each row execute function public.set_updated_at();

alter table public.medical_knowledge_documents enable row level security;
alter table public.medical_knowledge_chunks enable row level security;

drop policy if exists "medical_knowledge_documents_public_read" on public.medical_knowledge_documents;
create policy "medical_knowledge_documents_public_read"
on public.medical_knowledge_documents
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "medical_knowledge_chunks_public_read" on public.medical_knowledge_chunks;
create policy "medical_knowledge_chunks_public_read"
on public.medical_knowledge_chunks
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.medical_knowledge_documents d
    where d.id = medical_knowledge_chunks.document_id
      and d.is_active = true
  )
);
