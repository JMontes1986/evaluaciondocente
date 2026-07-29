create extension if not exists pgcrypto;
create type public.app_role as enum ('SUPER_ADMIN', 'ADMIN', 'RECTOR', 'DIRECTIVO', 'COORDINADOR', 'DOCENTE');

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name varchar(20) not null unique,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_active_academic_year on public.academic_years ((active)) where active;

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  name varchar(30) not null unique,
  order_number integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  document_number varchar(40),
  full_name varchar(180) not null,
  email varchar(254),
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  code varchar(40) not null unique,
  full_name varchar(180) not null,
  grade_id uuid not null references public.grades(id),
  academic_year_id uuid not null references public.academic_years(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id),
  grade_id uuid not null references public.grades(id),
  subject_id uuid not null references public.subjects(id),
  academic_year_id uuid not null references public.academic_years(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (teacher_id, grade_id, subject_id, academic_year_id)
);

create table public.evaluation_periods (
  id uuid primary key default gen_random_uuid(),
  name varchar(160) not null,
  academic_year_id uuid not null references public.academic_years(id),
  start_date timestamptz not null,
  end_date timestamptz not null,
  active boolean not null default false,
  allow_feedback boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_period_range check (end_date > start_date)
);

create table public.evaluation_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category varchar(120),
  order_number integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id),
  student_id uuid not null references public.students(id),
  grade_id uuid not null references public.grades(id),
  evaluation_period_id uuid not null references public.evaluation_periods(id),
  assignment_id uuid references public.teacher_assignments(id),
  feedback text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, teacher_id, evaluation_period_id)
);

create table public.evaluation_answers (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  question_id uuid not null references public.evaluation_questions(id),
  score smallint not null check (score between 1 and 4),
  created_at timestamptz not null default now(),
  unique (evaluation_id, question_id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(180) not null,
  role public.app_role not null default 'ADMIN',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.report_links (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  evaluation_period_id uuid not null references public.evaluation_periods(id),
  token_hash text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action varchar(120) not null,
  entity varchar(120) not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger academic_years_updated before update on public.academic_years for each row execute function public.set_updated_at();
create trigger grades_updated before update on public.grades for each row execute function public.set_updated_at();
create trigger subjects_updated before update on public.subjects for each row execute function public.set_updated_at();
create trigger teachers_updated before update on public.teachers for each row execute function public.set_updated_at();
create trigger students_updated before update on public.students for each row execute function public.set_updated_at();
create trigger evaluation_periods_updated before update on public.evaluation_periods for each row execute function public.set_updated_at();
create trigger evaluation_questions_updated before update on public.evaluation_questions for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
