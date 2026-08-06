do $$
begin
  update public.evaluation_periods
  set active = false
  where active
    and id <> (select id from public.evaluation_periods where active order by start_date desc, created_at desc, id desc limit 1);
end $$;

create unique index if not exists evaluation_periods_single_active_idx
  on public.evaluation_periods ((active))
  where active;
