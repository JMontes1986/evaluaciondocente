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
  v_expected integer;
  v_received integer;
begin
  select s.grade_id into v_grade_id
  from public.students s
  where s.id = p_student_id and s.active
  for update;
  if v_grade_id is null then raise exception 'STUDENT_NOT_ELIGIBLE'; end if;

  if not exists (
    select 1 from public.evaluation_periods ep
    where ep.id = p_period_id and ep.active
      and current_timestamp between ep.start_date and ep.end_date
  ) then raise exception 'PERIOD_NOT_ACTIVE'; end if;

  if not exists (
    select 1 from public.teacher_assignments ta
    join public.teachers t on t.id = ta.teacher_id and t.active
    where ta.id = p_assignment_id and ta.teacher_id = p_teacher_id
      and ta.grade_id = v_grade_id and ta.active
  ) then raise exception 'TEACHER_NOT_ASSIGNED'; end if;

  select count(*) into v_expected from public.evaluation_questions where active;
  select count(*) into v_received
  from jsonb_to_recordset(p_answers) as answer(question_id uuid, score smallint)
  join public.evaluation_questions q on q.id = answer.question_id and q.active
  where answer.score between 1 and 4;
  if v_received <> v_expected or jsonb_array_length(p_answers) <> v_expected then
    raise exception 'INVALID_ANSWERS';
  end if;

  insert into public.evaluations (
    teacher_id, student_id, grade_id, evaluation_period_id, assignment_id, feedback
  ) values (
    p_teacher_id, p_student_id, v_grade_id, p_period_id, p_assignment_id,
    nullif(left(trim(coalesce(p_feedback, '')), 2000), '')
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
grant execute on function public.submit_teacher_evaluation(uuid,uuid,uuid,uuid,jsonb,text) to service_role;

create or replace function public.get_dashboard_statistics(p_period_id uuid default null)
returns jsonb language sql stable security definer set search_path = '' as $$
with selected_period as (
  select id from public.evaluation_periods
  where (p_period_id is not null and id = p_period_id)
     or (p_period_id is null and active and now() between start_date and end_date)
  order by active desc limit 1
), expected as (
  select count(distinct (s.id, ta.teacher_id))::numeric total
  from public.students s
  join public.teacher_assignments ta on ta.grade_id=s.grade_id and ta.academic_year_id=s.academic_year_id and ta.active
  where s.active
), stats as (
  select
    (select count(*) from public.students where active) students,
    count(distinct e.id) evaluations,
    count(distinct e.teacher_id) teachers,
    count(distinct e.student_id) participating_students,
    round(avg(a.score)::numeric, 2) average_score
  from selected_period p
  left join public.evaluations e on e.evaluation_period_id=p.id
  left join public.evaluation_answers a on a.evaluation_id=e.id
)
select jsonb_build_object(
  'students', students,
  'evaluations', evaluations,
  'teachers', teachers,
  'participation_percent', case when students=0 then 0 else round(participating_students::numeric/students*100,1) end,
  'completion_percent', case when expected.total=0 then 0 else round(evaluations::numeric/expected.total*100,1) end,
  'average_score', coalesce(average_score,0)
) from stats cross join expected;
$$;
revoke all on function public.get_dashboard_statistics(uuid) from public;
grant execute on function public.get_dashboard_statistics(uuid) to authenticated;

create or replace function public.get_teacher_report(p_teacher_id uuid, p_period_id uuid, p_min_responses integer default 5)
returns jsonb language sql stable security definer set search_path = '' as $$
with base as (
  select e.id, e.feedback from public.evaluations e
  where e.teacher_id=p_teacher_id and e.evaluation_period_id=p_period_id
), totals as (
  select count(*) count from base
), details as (
  select q.id question_id, q.text, q.category, q.order_number,
         round(avg(a.score)::numeric,2) average,
         jsonb_build_object(
           'always', count(*) filter(where a.score=4),
           'almost_always', count(*) filter(where a.score=3),
           'sometimes', count(*) filter(where a.score=2),
           'never', count(*) filter(where a.score=1)
         ) distribution
  from base b join public.evaluation_answers a on a.evaluation_id=b.id
  join public.evaluation_questions q on q.id=a.question_id
  group by q.id
)
select case when totals.count < p_min_responses then
  jsonb_build_object('available',false,'response_count',totals.count)
else jsonb_build_object(
  'available',true,
  'response_count',totals.count,
  'average', (select round(avg(average)::numeric,2) from details),
  'questions', (select coalesce(jsonb_agg(to_jsonb(details) order by order_number),'[]'::jsonb) from details),
  'comments', (select coalesce(jsonb_agg(feedback),'[]'::jsonb) from base where feedback is not null)
) end from totals;
$$;
revoke all on function public.get_teacher_report(uuid,uuid,integer) from public;
grant execute on function public.get_teacher_report(uuid,uuid,integer) to authenticated, service_role;
