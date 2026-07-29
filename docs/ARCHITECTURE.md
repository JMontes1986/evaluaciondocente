# Arquitectura

La aplicación usa Next.js con App Router. Las lecturas se realizan en Server Components mediante una capa de servicios; las mutaciones internas usan Server Actions y las descargas usan Route Handlers.

## Capas

- `src/app`: rutas, layouts y endpoints.
- `src/components`: interfaz compartida, evaluación y administración.
- `src/actions`: mutaciones validadas en el servidor.
- `src/lib/services`: consultas y reglas de negocio.
- `src/lib/supabase`: clientes browser, servidor y service role.
- `src/lib/auth` y `src/lib/security`: autorización, sesiones y controles.
- `supabase`: esquema reproducible, RLS, RPC, índices y seed.

Los estudiantes no usan Supabase Auth. Reciben una cookie HTTPOnly con un token aleatorio; la base guarda únicamente SHA-256 del token. Los administradores usan Supabase Auth y un perfil activo con rol permitido.
