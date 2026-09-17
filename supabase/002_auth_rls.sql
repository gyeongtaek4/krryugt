-- 법인차량 관리 2단계: 로그인 프로필과 RLS 권한
-- 001_initial_schema.sql을 먼저 실행한 뒤 실행하세요.
-- 이 파일에는 이메일·비밀번호를 넣지 않습니다.

-- 새 Auth 사용자가 생기면 public.profiles에 기본 viewer로 등록합니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 001 실행 전에 생성한 계정이 있다면 profiles에 보완 등록합니다.
insert into public.profiles (id, display_name, role)
select id, split_part(coalesce(email, ''), '@', 1), 'viewer'
from auth.users
on conflict (id) do nothing;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'viewer'::public.app_role
  );
$$;

-- 기존 정책이 있으면 다시 실행할 수 있도록 삭제합니다.
drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists vehicles_select_authenticated on public.vehicles;
drop policy if exists vehicles_insert_editor on public.vehicles;
drop policy if exists vehicles_update_editor on public.vehicles;
drop policy if exists vehicles_delete_admin on public.vehicles;
drop policy if exists contracts_select_authenticated on public.contracts;
drop policy if exists contracts_insert_editor on public.contracts;
drop policy if exists contracts_update_editor on public.contracts;
drop policy if exists contracts_delete_admin on public.contracts;
drop policy if exists driving_select_authenticated on public.driving_records;
drop policy if exists driving_insert_editor on public.driving_records;
drop policy if exists driving_update_editor on public.driving_records;
drop policy if exists driving_delete_admin on public.driving_records;

create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy vehicles_select_authenticated on public.vehicles
  for select to authenticated using (true);
create policy vehicles_insert_editor on public.vehicles
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'editor'));
create policy vehicles_update_editor on public.vehicles
  for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));
create policy vehicles_delete_admin on public.vehicles
  for delete to authenticated
  using (public.current_user_role() = 'admin');

create policy contracts_select_authenticated on public.contracts
  for select to authenticated using (true);
create policy contracts_insert_editor on public.contracts
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'editor'));
create policy contracts_update_editor on public.contracts
  for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));
create policy contracts_delete_admin on public.contracts
  for delete to authenticated
  using (public.current_user_role() = 'admin');

create policy driving_select_authenticated on public.driving_records
  for select to authenticated using (true);
create policy driving_insert_editor on public.driving_records
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'editor'));
create policy driving_update_editor on public.driving_records
  for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));
create policy driving_delete_admin on public.driving_records
  for delete to authenticated
  using (public.current_user_role() = 'admin');

-- 여기까지 실행한 다음, 아래 두 문장에서 YOUR_EMAIL을 관리자 이메일로 바꿔 실행하세요.
-- 비밀번호는 이 SQL 파일에 입력하지 않습니다.
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'YOUR_EMAIL');

select id, display_name, role from public.profiles order by created_at;
