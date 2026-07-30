insert into public.academic_years (name, active) values ('2026', true)
on conflict (name) do update set active=excluded.active;

insert into public.grades (name, order_number) values
('3°',3),('4°',4),('5°',5),('6°',6),('7°',7),('8°',8),('9°',9),('10°',10),('11°',11)
on conflict (name) do update set order_number=excluded.order_number;

insert into public.subjects (name) values
('Matemáticas'),('Español'),('Inglés'),('Tecnología'),('Religión'),('Ciencias Naturales')
on conflict (name) do nothing;

-- Cuestionario oficial de Evaluación Docente del Colegio Gemelli.
insert into public.evaluation_questions (text, category, order_number) values
('Demuestra dominio en los temas explicados en clase', null, 1),
('Presenta los temas con claridad', null, 2),
('Comunica el propósito de cada clase.', null, 3),
('Responde las preguntas planteadas por los estudiantes.', null, 4),
('Es puntual para iniciar y finalizar las clases.', null, 5),
('Explica los criterios de evaluación de la materia.', null, 6),
('Representa figura de autoridad y controla la disciplina del grupo.', null, 7),
('Revisa con frecuencia módulos y cuadernos', null, 8),
('Da a conocer oportunamente los resultados de las evaluaciones.', null, 9),
('Indica normas de comportamiento en clase claras para todos', null, 10),
('El docente es respetado por los estudiantes del curso', null, 11),
('Realiza clases lúdicas y dinámicas', null, 12),
('Utiliza las herramientas tecnológicas del aula para dinamizar los procesos de enseñanza aprendizaje.', null, 13),
('Actualiza el sistema académico de manera periódica, ingresando notas, tareas y evaluaciones.', null, 14),
('Demuestra planeación y organización en el desarrollo del contenido de la asignatura', null, 15),
('Demuestra en su cotidianidad liderazgo positivo con estudiantes', null, 16),
('Escucha y atiende oportunamente las inquietudes e ideas de los estudiantes', null, 17),
('Refuerza las actitudes positivas de los estudiantes', null, 18),
('Establece y hace seguimiento a las estrategias que favorecen la sana convivencia escolar.', null, 19),
('Promueve en sus estudiantes valores y actitud franciscana y lo demuestra con su ejemplo.', null, 20),
('Relaciona los contenidos de su área con los contenidos de otras asignaturas', null, 21),
('El docente realiza la socialización y retroalimentación de las pruebas de seguimiento y/o simulacros.', null, 22),
('El docente realiza evaluaciones claras, que se relacionan directamente con los aprendizajes orientados durante las clases.', null, 23);
