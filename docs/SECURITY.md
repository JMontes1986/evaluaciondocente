# Seguridad

- RLS está habilitado en todas las tablas.
- No existen políticas `USING (true)` para información sensible.
- `SUPABASE_SERVICE_ROLE_KEY` se importa solo desde módulos `server-only`.
- El acceso administrativo valida sesión, perfil activo y rol en el servidor.
- Las sesiones estudiantiles duran dos horas, usan cookie HTTPOnly/SameSite=Lax y guardan token hasheado.
- La RPC valida estudiante, periodo, asignación, preguntas, rango y duplicados dentro de una transacción.
- Los errores públicos no revelan existencia de códigos ni detalles SQL.
- Los reportes docentes respetan `MIN_RESPONSES_FOR_REPORT`.
- Los headers reducen riesgos de framing, sniffing y permisos del navegador.

Para producción distribuida, conecte la interfaz `RateLimiter` a Upstash Redis. El adaptador local en memoria solo sirve como protección básica de una instancia.
