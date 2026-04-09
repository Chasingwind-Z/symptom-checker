create table if not exists symptom_knowledge (
  id text primary key,
  title text not null,
  category text,
  summary text,
  guidance jsonb,
  danger_signs jsonb,
  departments jsonb,
  tags jsonb,
  keywords jsonb,
  triage_level text,
  audience text,
  updated_at timestamptz default now()
);

alter table symptom_knowledge enable row level security;
create policy "public_read" on symptom_knowledge for select using (true);
create index idx_sk_keywords on symptom_knowledge using gin (keywords);
