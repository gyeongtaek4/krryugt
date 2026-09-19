-- 입력자 역할 제거: 기존 입력자 계정은 일반회원으로 전환하고 관리자/일반회원만 남긴다.
-- SQL Editor에서 전체 실행. 업무 원본 데이터와 Auth 사용자는 삭제하지 않는다.
begin;

update public.profiles set role='viewer' where role='editor';
do $$ begin
  alter table public.profiles add constraint profiles_role_admin_viewer_check
    check (role in ('admin'::public.app_role,'viewer'::public.app_role));
exception when duplicate_object then null;
end $$;

create or replace function public.current_user_role()
returns public.app_role language sql stable security definer set search_path=public
as $$
  select case when exists(
    select 1 from public.profiles where id=auth.uid() and status='active' and role='admin'
  ) then 'admin'::public.app_role else 'viewer'::public.app_role end;
$$;

create or replace function public.admin_update_profile(p_user_id uuid,p_display_name text,p_role text,p_status text)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_active_user() or public.current_user_role()<>'admin' then raise exception '관리자만 회원정보를 변경할 수 있습니다.'; end if;
  if p_display_name is null or length(trim(p_display_name)) not between 1 and 50 then raise exception '이름을 확인하세요.'; end if;
  if p_role not in ('admin','viewer') or p_status not in ('pending','active','disabled') then raise exception '역할 또는 상태를 확인하세요.'; end if;
  if p_user_id=auth.uid() and (p_role<>'admin' or p_status<>'active') then raise exception '현재 관리자 계정의 역할이나 상태는 변경할 수 없습니다.'; end if;
  update public.profiles set display_name=trim(p_display_name),role=p_role::public.app_role,status=p_status where id=p_user_id;
  if not found then raise exception '회원을 찾을 수 없습니다.'; end if;
end;
$$;

drop policy if exists vehicles_insert_editor on public.vehicles;
drop policy if exists vehicles_update_editor on public.vehicles;
create policy vehicles_insert_editor on public.vehicles for insert to authenticated with check(public.is_active_user() and public.current_user_role()='admin');
create policy vehicles_update_editor on public.vehicles for update to authenticated using(public.is_active_user() and public.current_user_role()='admin') with check(public.is_active_user() and public.current_user_role()='admin');

drop policy if exists contracts_select_authenticated on public.contracts;
drop policy if exists contracts_insert_editor on public.contracts;
drop policy if exists contracts_update_editor on public.contracts;
create policy contracts_select_authenticated on public.contracts for select to authenticated using(public.is_active_user() and public.current_user_role()='admin');
create policy contracts_insert_editor on public.contracts for insert to authenticated with check(public.is_active_user() and public.current_user_role()='admin');
create policy contracts_update_editor on public.contracts for update to authenticated using(public.is_active_user() and public.current_user_role()='admin') with check(public.is_active_user() and public.current_user_role()='admin');

drop policy if exists driving_select_authenticated on public.driving_records;
drop policy if exists driving_insert_editor on public.driving_records;
drop policy if exists driving_update_editor on public.driving_records;
create policy driving_select_authenticated on public.driving_records for select to authenticated using(public.is_active_user() and public.current_user_role()='admin');
create policy driving_insert_editor on public.driving_records for insert to authenticated with check(public.is_active_user() and public.current_user_role()='admin');
create policy driving_update_editor on public.driving_records for update to authenticated using(public.is_active_user() and public.current_user_role()='admin') with check(public.is_active_user() and public.current_user_role()='admin');

drop policy if exists driving_months_read on public.driving_months;
create policy driving_months_read on public.driving_months for select to authenticated using(public.is_active_user() and public.current_user_role()='admin');

notify pgrst,'reload schema';
commit;
