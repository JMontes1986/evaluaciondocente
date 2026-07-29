alter table public.academic_years enable row level security;
alter table public.grades enable row level security;
alter table public.subjects enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.evaluation_periods enable row level security;
alter table public.evaluation_questions enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_answers enable row level security;
alter table public.profiles enable row level security;
alter table public.student_sessions enable row level security;
alter table public.report_links enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role in ('SUPER_ADMIN', 'ADMIN')
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = 'SUPER_ADMIN'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

create policy "profile_read_self" on public.profiles for select to authenticated using (id = auth.uid());
create policy "super_admin_manage_profiles" on public.profiles for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "admin_academic_years" on public.academic_years for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_grades" on public.grades for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_subjects" on public.subjects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_teachers" on public.teachers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_students" on public.students for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_assignments" on public.teacher_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_periods" on public.evaluation_periods for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_questions" on public.evaluation_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_evaluations_read" on public.evaluations for select to authenticated using (public.is_admin());
create policy "admin_answers_read" on public.evaluation_answers for select to authenticated using (public.is_admin());
create policy "admin_report_links" on public.report_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_audit_read" on public.audit_logs for select to authenticated using (public.is_admin());

revoke all on public.students, public.student_sessions, public.evaluations, public.evaluation_answers, public.audit_logs from anon;
