# Base de datos

Las migraciones deben ejecutarse en orden:

1. `001_initial_schema.sql`: tipos, tablas, restricciones y triggers.
2. `002_rls_policies.sql`: RLS, helpers y políticas.
3. `003_functions.sql`: envío transaccional y analítica agregada.
4. `004_indexes.sql`: índices operativos.
5. `seed.sql`: año, grados, asignaturas y banco inicial de preguntas.

La restricción `unique (student_id, teacher_id, evaluation_period_id)` impide duplicados incluso ante concurrencia. Las respuestas están normalizadas y el rango 1–4 se valida en PostgreSQL.

Tablas: `academic_years`, `grades`, `subjects`, `teachers`, `students`, `teacher_assignments`, `evaluation_periods`, `evaluation_questions`, `evaluations`, `evaluation_answers`, `profiles`, `student_sessions`, `report_links` y `audit_logs`.
