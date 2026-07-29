# Despliegue

## Supabase

1. Cree un proyecto y conserve su contraseña de base en un gestor seguro.
2. Ejecute las cuatro migraciones SQL en orden y luego `supabase/seed.sql`.
3. Configure en Auth la URL del sitio y `/actualizar-contrasena` como redirect permitido.
4. Cree el primer usuario en Auth y asigne su perfil SUPER_ADMIN según el README.

## GitHub y Vercel

1. Cree un repositorio privado, agregue los archivos y haga push.
2. Importe el repositorio desde Vercel.
3. Configure todas las variables de `.env.example` para Production, Preview y Development según corresponda.
4. Despliegue y pruebe login, evaluación, informes y descarga.
5. Configure el dominio, actualice `NEXT_PUBLIC_APP_URL` y las URLs permitidas en Supabase Auth.

Antes de cada despliegue ejecute `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
