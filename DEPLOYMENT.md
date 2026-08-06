# Despliegue y migraciones

Ejecuta las migraciones en orden, una sola vez, en el proyecto Supabase de destino:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions.sql`
4. `supabase/migrations/004_indexes.sql`
5. `supabase/migrations/005_official_evaluation_questions.sql`
6. `supabase/migrations/006_system_settings.sql`
7. `supabase/migrations/007_module_permissions.sql`
8. `supabase/migrations/008_audit_logs_indexes.sql`
9. `supabase/migrations/009_security_hardening.sql`
10. `supabase/migrations/010_harden_evaluation_submission.sql`
11. `supabase/migrations/011_profile_teacher_link.sql`
12. `supabase/migrations/012_single_active_evaluation_period.sql`

Con Supabase CLI, desde la raíz del repositorio:

```powershell
supabase link --project-ref <PROJECT_REF>
supabase db push
```

No se debe desplegar la aplicación hasta que `supabase db push` termine correctamente.

Confirma inmediatamente el estado remoto:

```powershell
supabase migration list --linked
```

La columna remota debe mostrar como aplicadas las versiones `001` a `012`. La presencia de los archivos locales no demuestra que la base remota esté actualizada.

Como comprobación directa en SQL Editor, esta consulta debe devolver cuatro filas: `009`, `010`, `011` y `012`.

```sql
select version
from supabase_migrations.schema_migrations
where version in ('009', '010', '011', '012')
order by version;
```

## Verificación crítica de permisos

Después de aplicar las doce migraciones, ejecuta esta consulta en el SQL Editor de Supabase. Debe devolver **cero filas**:

```sql
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'get_teacher_report',
    'get_dashboard_statistics',
    'submit_teacher_evaluation'
  )
  and lower(grantee) in ('public', 'anon', 'authenticated')
  and privilege_type = 'EXECUTE';
```

La comprobación complementaria debe devolver exactamente tres filas con `service_role` y `EXECUTE`:

```sql
select
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'get_teacher_report',
    'get_dashboard_statistics',
    'submit_teacher_evaluation'
  )
  and grantee = 'service_role'
  and privilege_type = 'EXECUTE';
```

Las migraciones `009_security_hardening.sql` y `010_harden_evaluation_submission.sql` revocan explícitamente `EXECUTE` a `public`, `anon` y `authenticated` sobre las RPC protegidas. Las funciones quedan disponibles únicamente para el código confiable del servidor mediante `service_role`. La migración `010` también comprueba la coincidencia de año académico y aplica `allow_feedback` dentro de la transacción.

## Verificación crítica de aislamiento docente

La migración `011_profile_teacher_link.sql` debe haber creado la columna y el índice único. Esta consulta debe devolver dos filas, ambas con `is_present = true`:

```sql
select 'profiles.teacher_id' as invariant,
       exists (
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'profiles'
           and column_name = 'teacher_id'
           and data_type = 'uuid'
       ) as is_present
union all
select 'profiles_teacher_id_unique',
       to_regclass('public.profiles_teacher_id_unique') is not null;
```

La migración `012_single_active_evaluation_period.sql` debe haber creado el índice de período único y no puede haber más de un período activo. Esta consulta debe devolver `index_exists = true` y `active_periods` igual a `0` o `1`:

```sql
select
  to_regclass('public.evaluation_periods_single_active_idx') is not null as index_exists,
  count(*) filter (where active) as active_periods
from public.evaluation_periods;
```

Si cualquiera de estas comprobaciones falla, detén el despliegue y ejecuta `supabase db push` contra el proyecto correcto antes de habilitar el acceso de usuarios.

## Rotación de secretos

No guardes contraseñas, claves de Supabase ni tokens en el repositorio. Si una credencial fue expuesta, rótala antes del despliegue y revoca las sesiones activas.
