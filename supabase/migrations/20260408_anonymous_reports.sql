create table if not exists anonymous_reports (
  id uuid primary key default gen_random_uuid(),
  city text,
  district text,
  symptoms text[],
  level text,
  age_group text,
  created_at timestamptz default now()
);

alter table anonymous_reports enable row level security;

-- Anyone can insert (anonymous)
create policy "insert_anon" on anonymous_reports for insert with check (true);

-- Anyone can read aggregated data
create policy "select_agg" on anonymous_reports for select using (true);

-- Index for aggregation queries
create index idx_reports_city_created on anonymous_reports (city, created_at desc);
create index idx_reports_district on anonymous_reports (district, created_at desc);
