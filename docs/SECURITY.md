# Seguridad

- RLS está habilitado en todas las tablas.
- No existen políticas `USING (true)` para información sensible.
- `SUPABASE_SERVICE_ROLE_KEY` se importa solo desde módulos `server-only`.
- El acceso administrativo valida sesión, perfil activo, rol y módulo en el servidor.
- Las sesiones estudiantiles usan cookies HTTPOnly/SameSite y guardan únicamente el token hasheado.
- La RPC de evaluación valida estudiante, periodo, asignación, preguntas, rango y duplicados dentro de una transacción.
- Los errores públicos no revelan la existencia de códigos ni detalles SQL.
- Los reportes docentes respetan el umbral institucional de privacidad.
- La CSP de producción bloquea `eval`, objetos embebidos, framing y formularios hacia otros orígenes.
- Las páginas administrativas, sesiones estudiantiles, exportaciones y reportes por token usan `no-store`.
- Las sesiones estudiantiles usan el prefijo de cookie `__Host-` en producción.
- Los filtros PostgREST construidos con `.or()` pasan por una lista permitida antes de entrar en su gramática.
- Las funciones `SECURITY DEFINER` de informes solo pueden ejecutarse con `service_role` desde el servidor.
- El acceso administrativo y la recuperación de contraseña tienen límites de intentos por red y cuenta.
- Las exportaciones neutralizan valores que podrían interpretarse como fórmulas de hoja de cálculo.
- Los enlaces públicos de informes validan formato y longitud del token, no se indexan y no se almacenan en caché.
- Next.js, React y React DOM deben mantenerse como mínimo en las versiones seguras declaradas en `package.json`.

## Pendientes operativos

- Aplicar todas las migraciones, incluida `009_security_hardening.sql`, antes de considerar efectivo el cierre de las RPC.
- Conectar `RateLimiter` a almacenamiento distribuido o al firewall de Vercel. El adaptador local en memoria solo protege una instancia.
- Regenerar y verificar `package-lock.json` en un entorno con acceso TLS confiable a npm; el entorno local actual no permite completar `npm audit` ni una instalación limpia.
- Configurar MFA en Supabase Auth para cuentas administrativas, especialmente `SUPER_ADMIN`.
- Rotar inmediatamente `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY` y secretos de sesión si se sospecha exposición.
