-- Reforzamiento de la RPC de envío: todos los elementos deben pertenecer
-- al mismo año académico y los comentarios respetan allow_feedback.
create or replace function public.submit_teacher_evaluation(
  p_student_id uuid,
  p_teacher_id uuid,
  p_assignment_id uuid,
  p_period_id uuid,
  p_answers jsonb,
  p_feedback text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evaluation_id uuid;
  v_grade_id uuid;
  v_student_academic_year_id uuid;
  v_period_academic_year_id uuid;
  v_allow_feedback boolean;
  v_expected integer;
  v_received integer;
begin
  select s.grade_id, s.academic_year_id
    into v_grade_id, v_student_academic_year_id
  from public.students s
  where s.id = p_student_id and s.active
  for update;
  if v_grade_id is null or v_student_academic_year_id is null then
    raise exception 'STUDENT_NOT_ELIGIBLE';
  end if;

  select ep.academic_year_id, ep.allow_feedback
    into v_period_academic_year_id, v_allow_feedback
  from public.evaluation_periods ep
  where ep.id = p_period_id
    and ep.active
    and current_timestamp between ep.start_date and ep.end_date;
  if v_period_academic_year_id is null then
    raise exception 'PERIOD_NOT_ACTIVE';
  end if;
  if v_period_academic_year_id <> v_student_academic_year_id then
    raise exception 'ACADEMIC_YEAR_MISMATCH';
  end if;

  if not exists (
    select 1
    from public.teacher_assignments ta
    join public.teachers t on t.id = ta.teacher_id and t.active
    where ta.id = p_assignment_id
      and ta.teacher_id = p_teacher_id
      and ta.grade_id = v_grade_id
      and ta.academic_year_id = v_student_academic_year_id
      and ta.active
  ) then
    raise exception 'TEACHER_NOT_ASSIGNED';
  end if;

  select count(*) into v_expected
  from public.evaluation_questions
  where active;
  select count(*) into v_received
  from jsonb_to_recordset(p_answers) as answer(question_id uuid, score smallint)
  join public.evaluation_questions q
    on q.id = answer.question_id and q.active
  where answer.score between 1 and 4;
  if v_received <> v_expected or jsonb_array_length(p_answers) <> v_expected then
    raise exception 'INVALID_ANSWERS';
  end if;

  insert into public.evaluations (
    teacher_id, student_id, grade_id, evaluation_period_id, assignment_id, feedback
  ) values (
    p_teacher_id,
    p_student_id,
    v_grade_id,
    p_period_id,
    p_assignment_id,
    case when v_allow_feedback then nullif(left(trim(coalesce(p_feedback, '')), 2000), '') else null end
  ) returning id into v_evaluation_id;

  insert into public.evaluation_answers (evaluation_id, question_id, score)
  select v_evaluation_id, answer.question_id, answer.score
  from jsonb_to_recordset(p_answers) as answer(question_id uuid, score smallint);

  return v_evaluation_id;
exception
  when unique_violation then raise exception 'ALREADY_SUBMITTED';
end;
$$;

revoke all on function public.submit_teacher_evaluation(uuid,uuid,uuid,uuid,jsonb,text) from public;
revoke all on function public.submit_teacher_evaluation(uuid,uuid,uuid,uuid,jsonb,text) from anon;
revoke all on function public.submit_teacher_evaluation(uuid,uuid,uuid,uuid,jsonb,text) from authenticated;
grant execute on function public.submit_teacher_evaluation(uuid,uuid,uuid,uuid,jsonb,text) to service_role;
