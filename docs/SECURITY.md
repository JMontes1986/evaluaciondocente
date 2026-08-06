# Seguridad

- RLS está habilitado en todas las tablas.
- No existen políticas `USING (true)` para información sensible.
- `SUPABASE_SERVICE_ROLE_KEY` se importa solo desde módulos `server-only`.
- El acceso administrativo valida sesión, perfil activo, rol y módulo en el servidor.
- Las sesiones estudiantiles usan cookies HTTPOnly/SameSite y guardan únicamente el token hasheado.
- La RPC de evaluación valida estudiante, periodo, asignación, preguntas, rango y duplicados dentro de una transacción.
- Los errores públicos no revelan la existencia de códigos ni detalles SQL.
- Los reportes docentes respetan el umbral institucional de privacidad.
- El análisis asistido se restringe en el servidor a `SUPER_ADMIN`, `ADMIN`, `RECTOR`, `DIRECTIVO` y `COORDINADOR`; las cuentas `DOCENTE` no pueden invocarlo aunque tengan acceso al dashboard.
- Antes de llamar a Groq, los nombres de docentes se reemplazan por alias efímeros (`Docente 01`, `Docente 02`, etc.); no se envían nombres, UUID de docentes, correos, comentarios abiertos ni identidades de estudiantes.
- La CSP de producción bloquea `eval`, objetos embebidos, framing y formularios hacia otros orígenes.
- Las páginas administrativas, sesiones estudiantiles, exportaciones y reportes por token usan `no-store`.
- Las sesiones estudiantiles usan el prefijo de cookie `__Host-` en producción.
- Los filtros PostgREST construidos con `.or()` pasan por una lista permitida antes de entrar en su gramática.
- Las funciones `SECURITY DEFINER` de informes solo pueden ejecutarse con `service_role` desde el servidor.
- El acceso administrativo y la recuperación de contraseña tienen límites de intentos por red y cuenta.
- La recuperación exige un callback PKCE reciente y un marcador HttpOnly firmado, ligado al usuario, de diez minutos y consumo único.
- Las exportaciones neutralizan valores que podrían interpretarse como fórmulas de hoja de cálculo.
- Las importaciones XLSX inspeccionan y descomprimen de forma acotada cada entrada antes de usar ExcelJS: máximo 8 MB comprimidos, 64 MB descomprimidos, 32 MB por entrada, 2.048 entradas y relación máxima 200:1. También rechazan ZIP64, cifrado, estructuras inconsistentes y tamaños declarados falsos.
- Los enlaces públicos de informes validan formato y longitud del token, no se indexan y no se almacenan en caché.
- Next.js, React y React DOM deben mantenerse como mínimo en las versiones seguras declaradas en `package.json`.

## Tratamiento externo mediante Groq

Al solicitar voluntariamente un análisis asistido, la aplicación transmite a la API externa de Groq el periodo, el umbral de privacidad y métricas agregadas: cantidades de evaluaciones, estudiantes y docentes; porcentajes por alias de docente y grado; resultados por pregunta; distribuciones de respuesta; y un subconjunto limitado de intersecciones docente–grado. La finalidad exclusiva es generar el informe ejecutivo mostrado al usuario directivo.

Los alias solo existen durante la construcción de cada solicitud y no se guarda una tabla de correspondencia. La respuesta y los metadatos técnicos mínimos quedan sujetos a los controles y condiciones contractuales aplicables al proveedor externo. Antes de habilitar `GROQ_API_KEY` en producción, la institución debe validar sus condiciones de tratamiento, ubicación, conservación y eliminación de datos, y mantener actualizado el aviso de privacidad correspondiente.

## Pendientes operativos

- Aplicar todas las migraciones, incluida `009_security_hardening.sql`, antes de considerar efectivo el cierre de las RPC.
- Conectar `RateLimiter` a almacenamiento distribuido o al firewall de Vercel. El adaptador local en memoria solo protege una instancia.
- Regenerar y verificar `package-lock.json` en un entorno con acceso TLS confiable a npm; el entorno local actual no permite completar `npm audit` ni una instalación limpia.
- Configurar MFA en Supabase Auth para cuentas administrativas, especialmente `SUPER_ADMIN`.
- Activar **Secure password change** en Supabase Dashboard > Authentication > Providers > Email.
- Rotar inmediatamente `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY` y secretos de sesión si se sospecha exposición.
