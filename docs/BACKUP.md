# Backup y recuperación

Antes de abrir un nuevo periodo:

1. Exporte resultados consolidados desde Informes.
2. Genere un respaldo lógico con Supabase CLI o `pg_dump` usando una conexión segura.
3. Compruebe que el archivo tenga tamaño razonable y guárdelo cifrado en dos ubicaciones.
4. Documente fecha, proyecto, migración aplicada y responsable.

Para restaurar, cree un proyecto aislado, aplique primero el esquema compatible, restaure el dump y valide conteos, restricciones, RLS y RPC antes de cambiar tráfico. Nunca pruebe una restauración directamente sobre producción.
