-- Q&A와 운행가이드 PDF: 활성 회원 열람, 관리자 작성·수정·삭제.
begin;

create table if not exists public.fleet_questions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  question_body text not null check (char_length(trim(question_body)) between 1 and 4000),
  answer_body text not null check (char_length(trim(answer_body)) between 1 and 8000),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fleet_guides (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  file_path text not null unique,
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  file_size bigint not null check (file_size between 1 and 20971520),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create or replace function public.set_knowledge_updated_at()
returns trigger language plpgsql set search_path=public
as $$ begin new.updated_at=now(); return new; end; $$;

drop trigger if exists fleet_questions_updated_at on public.fleet_questions;
create trigger fleet_questions_updated_at before update on public.fleet_questions
for each row execute function public.set_knowledge_updated_at();

alter table public.fleet_questions enable row level security;
alter table public.fleet_guides enable row level security;
revoke all on public.fleet_questions, public.fleet_guides from anon;
revoke all on public.fleet_questions, public.fleet_guides from authenticated;
grant select, insert, update, delete on public.fleet_questions, public.fleet_guides to authenticated;

drop policy if exists fleet_questions_read_active on public.fleet_questions;
drop policy if exists fleet_questions_manage_admin on public.fleet_questions;
create policy fleet_questions_read_active on public.fleet_questions for select to authenticated
  using (public.is_active_user());
create policy fleet_questions_manage_admin on public.fleet_questions for all to authenticated
  using (public.is_active_user() and public.current_user_role()='admin')
  with check (public.is_active_user() and public.current_user_role()='admin');

drop policy if exists fleet_guides_read_active on public.fleet_guides;
drop policy if exists fleet_guides_manage_admin on public.fleet_guides;
create policy fleet_guides_read_active on public.fleet_guides for select to authenticated
  using (public.is_active_user());
create policy fleet_guides_manage_admin on public.fleet_guides for all to authenticated
  using (public.is_active_user() and public.current_user_role()='admin')
  with check (public.is_active_user() and public.current_user_role()='admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fleet-guides', 'fleet-guides', false, 20971520, array['application/pdf'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists fleet_guides_storage_read_active on storage.objects;
drop policy if exists fleet_guides_storage_insert_admin on storage.objects;
drop policy if exists fleet_guides_storage_delete_admin on storage.objects;
create policy fleet_guides_storage_read_active on storage.objects for select to authenticated
  using (bucket_id='fleet-guides' and public.is_active_user());
create policy fleet_guides_storage_insert_admin on storage.objects for insert to authenticated
  with check (bucket_id='fleet-guides' and public.is_active_user() and public.current_user_role()='admin'
    and (storage.foldername(name))[1]=auth.uid()::text);
create policy fleet_guides_storage_delete_admin on storage.objects for delete to authenticated
  using (bucket_id='fleet-guides' and public.is_active_user() and public.current_user_role()='admin');

notify pgrst, 'reload schema';
commit;
