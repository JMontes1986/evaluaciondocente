create table public.profile_module_permissions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  module_key varchar(60) not null check (
    module_key in (
      'dashboard',
      'evaluaciones',
      'seguimiento',
      'docentes',
      'resultados_docentes',
      'estudiantes',
      'grados',
      'asignaturas',
      'asignaciones',
      'preguntas',
      'periodos',
      'informes',
      'importaciones'
    )
  ),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (profile_id, module_key)
);

create index profile_module_permissions_profile_idx
on public.profile_module_permissions (profile_id);

alter table public.profile_module_permissions enable row level security;

create policy "permission_read_self"
on public.profile_module_permissions
for select to authenticated
using (profile_id = (select auth.uid()));

create policy "super_admin_manage_permissions"
on public.profile_module_permissions
for all to authenticated
using ((select public.is_super_admin()))
with check ((select public.is_super_admin()));

revoke all on public.profile_module_permissions from anon;
grant select on public.profile_module_permissions to authenticated;
