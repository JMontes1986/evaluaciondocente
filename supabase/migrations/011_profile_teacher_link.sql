alter table public.profiles
  add column if not exists teacher_id uuid references public.teachers(id) on delete set null;

create unique index if not exists profiles_teacher_id_unique
  on public.profiles (teacher_id)
  where teacher_id is not null;
