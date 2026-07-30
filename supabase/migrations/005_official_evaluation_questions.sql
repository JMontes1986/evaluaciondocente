-- Conserva las preguntas históricas para no romper evaluaciones ya registradas.
update public.evaluation_questions set active = false where active;

insert into public.evaluation_questions (text, category, order_number, active) values
('Demuestra dominio en los temas explicados en clase', null, 1, true),
('Presenta los temas con claridad', null, 2, true),
('Comunica el propósito de cada clase.', null, 3, true),
('Responde las preguntas planteadas por los estudiantes.', null, 4, true),
('Es puntual para iniciar y finalizar las clases.', null, 5, true),
('Explica los criterios de evaluación de la materia.', null, 6, true),
('Representa figura de autoridad y controla la disciplina del grupo.', null, 7, true),
('Revisa con frecuencia módulos y cuadernos', null, 8, true),
('Da a conocer oportunamente los resultados de las evaluaciones.', null, 9, true),
('Indica normas de comportamiento en clase claras para todos', null, 10, true),
('El docente es respetado por los estudiantes del curso', null, 11, true),
('Realiza clases lúdicas y dinámicas', null, 12, true),
('Utiliza las herramientas tecnológicas del aula para dinamizar los procesos de enseñanza aprendizaje.', null, 13, true),
('Actualiza el sistema académico de manera periódica, ingresando notas, tareas y evaluaciones.', null, 14, true),
('Demuestra planeación y organización en el desarrollo del contenido de la asignatura', null, 15, true),
('Demuestra en su cotidianidad liderazgo positivo con estudiantes', null, 16, true),
('Escucha y atiende oportunamente las inquietudes e ideas de los estudiantes', null, 17, true),
('Refuerza las actitudes positivas de los estudiantes', null, 18, true),
('Establece y hace seguimiento a las estrategias que favorecen la sana convivencia escolar.', null, 19, true),
('Promueve en sus estudiantes valores y actitud franciscana y lo demuestra con su ejemplo.', null, 20, true),
('Relaciona los contenidos de su área con los contenidos de otras asignaturas', null, 21, true),
('El docente realiza la socialización y retroalimentación de las pruebas de seguimiento y/o simulacros.', null, 22, true),
('El docente realiza evaluaciones claras, que se relacionan directamente con los aprendizajes orientados durante las clases.', null, 23, true);
