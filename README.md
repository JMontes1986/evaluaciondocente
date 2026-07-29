# Evaluación Docente ColGemelli

Plataforma segura de evaluación docente para el Colegio Franciscano Agustín Gemelli. Los estudiantes ingresan con código institucional sin crear cuentas; los administradores usan Supabase Auth. Los resultados destinados a docentes son agregados y confidenciales.

## Tecnologías

Next.js 16 (App Router), React 19, TypeScript estricto, Tailwind CSS 4, Radix/ShadCN, Supabase PostgreSQL/Auth/RLS, Zod, Recharts, ExcelJS, Docx y Vercel.

## Instalación

```bash
npm install
copy .env.example .env.local
npm run dev
```

Complete `.env.local` con un proyecto Supabase. Nunca suba este archivo.

## Base de datos

Ejecute en orden los archivos de `supabase/migrations/` y finalmente `supabase/seed.sql`. Consulte [docs/DATABASE.md](docs/DATABASE.md).

## Primer SUPER_ADMIN

1. Cree el usuario desde Supabase Dashboard > Authentication > Users.
2. Copie su UUID.
3. Ejecute en SQL Editor, reemplazando los valores:

```sql
insert into public.profiles (id, full_name, role, active)
values ('UUID_DEL_USUARIO', 'Nombre autorizado', 'SUPER_ADMIN', true);
```

No existen credenciales predeterminadas ni contraseñas guardadas en el repositorio.

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Arquitectura y operación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Base de datos](docs/DATABASE.md)
- [Seguridad](docs/SECURITY.md)
- [Despliegue](docs/DEPLOYMENT.md)
- [Guía de estudiantes](docs/USER_GUIDE.md)
- [Guía administrativa](docs/ADMIN_GUIDE.md)
- [Backup y recuperación](docs/BACKUP.md)

## Variables

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STUDENT_SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, `MIN_RESPONSES_FOR_REPORT` y, opcionalmente, `GOOGLE_GENERATIVE_AI_API_KEY`.

## Mantenimiento

Conserve migraciones inmutables después de producción; agregue migraciones nuevas. Antes de cada periodo realice un backup, valide asignaciones, active solo un año académico, pruebe RLS y confirme el umbral de confidencialidad.
