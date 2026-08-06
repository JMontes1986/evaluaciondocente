# Guía administrativa

El panel permite consultar indicadores y administrar docentes, estudiantes, grados, asignaturas, asignaciones, preguntas, periodos, evaluaciones, informes e importaciones.

Los registros históricos deben desactivarse en lugar de eliminarse. Solo SUPER_ADMIN puede ingresar a Usuarios. Las importaciones de estudiantes usan `.xlsx` con las columnas `codigo`, `nombre` y `grado`.

El módulo **Seguridad**, disponible únicamente para `SUPER_ADMIN`, reúne el estado de los controles aplicados, parciales, pendientes y sujetos a verificación externa. Debe revisarse después de cambios de infraestructura, autenticación, dependencias o políticas de tratamiento de datos.

Los informes docentes nunca deben incluir nombres, códigos ni IDs estudiantiles. Verifique siempre el umbral de confidencialidad antes de compartir resultados segmentados.
