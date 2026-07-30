create table public.system_settings (
  id smallint primary key default 1 check (id = 1),
  min_responses integer not null default 5 check (min_responses between 3 and 50),
  student_session_minutes integer not null default 120 check (student_session_minutes between 15 and 1440),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.system_settings (id, min_responses, student_session_minutes)
values (1, 5, 120)
on conflict (id) do nothing;

alter table public.system_settings enable row level security;

create policy "admin_system_settings" on public.system_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create trigger system_settings_updated
before update on public.system_settings
for each row execute function public.set_updated_at();
