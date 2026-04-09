create or replace function get_symptom_trends(p_city text)
returns table(symptom text, cnt bigint, report_date date)
language sql stable as $$
  select unnest(symptoms) as symptom, count(*) as cnt, created_at::date as report_date
  from anonymous_reports
  where city = p_city and created_at > now() - interval '30 days'
  group by 1, 3 order by 3 desc, 2 desc limit 100;
$$;
