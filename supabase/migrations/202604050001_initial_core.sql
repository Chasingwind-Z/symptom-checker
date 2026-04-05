-- 健康助手 Beta：Supabase 初始核心表结构
-- 目标：为档案、病例历史、消息流、随访、匿名上报和证据来源预留稳定底座

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'triage_level') then
    create type public.triage_level as enum ('green', 'yellow', 'orange', 'red');
  end if;

  if not exists (select 1 from pg_type where typname = 'case_status') then
    create type public.case_status as enum ('active', 'closed', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'case_message_role') then
    create type public.case_message_role as enum ('system', 'user', 'assistant', 'tool');
  end if;

  if not exists (select 1 from pg_type where typname = 'followup_status') then
    create type public.followup_status as enum ('pending', 'sent', 'completed', 'dismissed');
  end if;

  if not exists (select 1 from pg_type where typname = 'evidence_source_type') then
    create type public.evidence_source_type as enum ('knowledge_base', 'guideline', 'web', 'manual_review');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  birth_year integer check (birth_year between 1900 and extract(year from now())::integer),
  gender text,
  city text,
  medical_notes text,
  emergency_contact jsonb not null default '{}'::jsonb,
  consent_version text,
  locale text not null default 'zh-CN',
  preferred_language text not null default 'zh-CN',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz
);

comment on table public.profiles is '用户基础档案与长期资料（中文优先）';

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  status public.case_status not null default 'active',
  channel text not null default 'web',
  is_anonymous boolean not null default false,
  chief_complaint text not null,
  structured_summary jsonb not null default '{}'::jsonb,
  triage_level public.triage_level,
  triage_reason text,
  recommendation text,
  location_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz
);

comment on table public.cases is '单次问诊/分诊记录，未来可由 Edge Functions 聚合结构化输出';

create table if not exists public.case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  role public.case_message_role not null,
  content text not null,
  tool_name text,
  sequence_no integer not null check (sequence_no > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (case_id, sequence_no)
);

comment on table public.case_messages is '病例消息明细，保留用户、助手与工具轨迹';

create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  status public.followup_status not null default 'pending',
  reminder_channel text not null default 'in_app',
  summary text,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  completed_at timestamptz,
  response_label text,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.followups is '随访计划与用户反馈，可由定时 Edge Functions 触发提醒';

create table if not exists public.anonymous_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases (id) on delete set null,
  district text,
  age_band text,
  risk_level public.triage_level,
  symptom_tags text[] not null default '{}'::text[],
  report_payload jsonb not null default '{}'::jsonb,
  reported_at timestamptz not null default timezone('utc', now())
);

comment on table public.anonymous_reports is '脱敏聚合上报，用于社区症状热度与公共卫生预警';

create table if not exists public.evidence_sources (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases (id) on delete cascade,
  source_type public.evidence_source_type not null,
  title text not null,
  source_url text,
  publisher text,
  published_at timestamptz,
  summary text,
  citation_snippet text,
  confidence numeric(4, 3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.evidence_sources is '结构化证据来源，支持知识库、指南与联网检索结果留痕';

create index if not exists idx_cases_user_created_at on public.cases (user_id, created_at desc);
create index if not exists idx_case_messages_case_seq on public.case_messages (case_id, sequence_no);
create index if not exists idx_followups_user_status on public.followups (user_id, status, scheduled_for);
create index if not exists idx_anonymous_reports_reported_at on public.anonymous_reports (reported_at desc);
create index if not exists idx_evidence_sources_case_id on public.evidence_sources (case_id, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_cases_updated_at on public.cases;
create trigger set_cases_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

drop trigger if exists set_followups_updated_at on public.followups;
create trigger set_followups_updated_at
before update on public.followups
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_messages enable row level security;
alter table public.followups enable row level security;
alter table public.anonymous_reports enable row level security;
alter table public.evidence_sources enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "cases_manage_own" on public.cases;
create policy "cases_manage_own"
on public.cases
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "case_messages_manage_own" on public.case_messages;
create policy "case_messages_manage_own"
on public.case_messages
for all
to authenticated
using (
  exists (
    select 1
    from public.cases c
    where c.id = case_messages.case_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.cases c
    where c.id = case_messages.case_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "followups_manage_own" on public.followups;
create policy "followups_manage_own"
on public.followups
for all
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.cases c
    where c.id = followups.case_id
      and c.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.cases c
    where c.id = followups.case_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "evidence_sources_select_own" on public.evidence_sources;
create policy "evidence_sources_select_own"
on public.evidence_sources
for select
to authenticated
using (
  case_id is null
  or exists (
    select 1
    from public.cases c
    where c.id = evidence_sources.case_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "evidence_sources_insert_own" on public.evidence_sources;
create policy "evidence_sources_insert_own"
on public.evidence_sources
for insert
to authenticated
with check (
  case_id is null
  or exists (
    select 1
    from public.cases c
    where c.id = evidence_sources.case_id
      and c.user_id = auth.uid()
  )
);

-- anonymous_reports 默认不对前端开放：推荐由 Edge Functions / service_role 写入。
