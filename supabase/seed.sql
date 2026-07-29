insert into public.academic_years (name, active) values ('2026', true)
on conflict (name) do update set active=excluded.active;

insert into public.grades (name, order_number) values
('3°',3),('4°',4),('5°',5),('6°',6),('7°',7),('8°',8),('9°',9),('10°',10),('11°',11)
on conflict (name) do update set order_number=excluded.order_number;

insert into public.subjects (name) values
('Matemáticas'),('Español'),('Inglés'),('Tecnología'),('Religión'),('Ciencias Naturales')
on conflict (name) do nothing;

-- No había repositorio fuente ni banco de preguntas recuperable.
-- Estas preguntas institucionales iniciales pueden editarse y desactivarse desde administración.
insert into public.evaluation_questions (text, category, order_number) values
('Explica con claridad los temas y resuelve las dudas del grupo.', 'Metodología', 1),
('Utiliza estrategias y recursos que facilitan el aprendizaje.', 'Metodología', 2),
('Demuestra dominio y preparación de los contenidos de la asignatura.', 'Dominio de la asignatura', 3),
('Relaciona los contenidos con situaciones y ejemplos comprensibles.', 'Dominio de la asignatura', 4),
('Trata a los estudiantes con respeto y escucha sus inquietudes.', 'Relación pedagógica', 5),
('Promueve la participación y un ambiente seguro para aprender.', 'Relación pedagógica', 6),
('Comunica oportunamente los criterios y resultados de evaluación.', 'Evaluación', 7),
('Evalúa de manera coherente con los contenidos trabajados en clase.', 'Evaluación', 8),
('Da orientaciones útiles para mejorar el desempeño académico.', 'Comunicación', 9),
('Favorece el diálogo y la sana convivencia en el aula.', 'Convivencia', 10),
('Cumple los horarios y compromisos establecidos para la clase.', 'Responsabilidad', 11),
('Acompaña con interés el proceso de aprendizaje de los estudiantes.', 'Responsabilidad', 12);
