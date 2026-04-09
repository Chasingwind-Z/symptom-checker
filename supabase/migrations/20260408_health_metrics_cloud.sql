create table if not exists health_metrics_cloud (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  type text not null,
  value_primary float not null,
  value_secondary float,
  meal_context text,
  recorded_at timestamptz not null,
  note text,
  created_at timestamptz default now()
);

alter table health_metrics_cloud enable row level security;
create policy "users_own_metrics" on health_metrics_cloud for all using (auth.uid() = user_id);
create index idx_metrics_user_type on health_metrics_cloud (user_id, type, recorded_at desc);
