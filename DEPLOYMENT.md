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

Con Supabase CLI, desde la raíz del repositorio:

```powershell
supabase link --project-ref <PROJECT_REF>
supabase db push
```

No se debe desplegar la aplicación hasta que `supabase db push` termine correctamente.

## Verificación crítica de permisos

Después de aplicar las nueve migraciones, ejecuta esta consulta en el SQL Editor de Supabase. Debe devolver **cero filas** para `anon` y `authenticated`:

```sql
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('get_teacher_report', 'get_dashboard_statistics')
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'EXECUTE';
```

La comprobación complementaria debe devolver `service_role` con `EXECUTE` para ambas funciones:

```sql
select
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('get_teacher_report', 'get_dashboard_statistics')
  and grantee = 'service_role'
  and privilege_type = 'EXECUTE';
```

Las migraciones `009_security_hardening.sql` y `010_harden_evaluation_submission.sql` revocan explícitamente `EXECUTE` a `public`, `anon` y `authenticated` sobre las RPC protegidas. Las funciones quedan disponibles únicamente para el código confiable del servidor mediante `service_role`. La migración `010` también comprueba la coincidencia de año académico y aplica `allow_feedback` dentro de la transacción.

## Rotación de secretos

No guardes contraseñas, claves de Supabase ni tokens en el repositorio. Si una credencial fue expuesta, rótala antes del despliegue y revoca las sesiones activas.
