-- 직원 회원가입 승인·역할·활성상태 관리. 기존 업무자료는 변경하지 않는다.
begin;

alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists status text not null default 'pending';
do $$ begin
  alter table public.profiles add constraint profiles_status_check check (status in ('pending','active','disabled'));
exception when duplicate_object then null;
end $$;

-- 이 SQL 실행 전에 사용 중이던 계정은 잠기지 않도록 활성 상태로 전환한다.
update public.profiles p set email=coalesce(u.email,''),status='active'
from auth.users u where u.id=p.id;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,email,display_name,role,status)
  values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'display_name',split_part(coalesce(new.email,''),'@',1)),'viewer','pending')
  on conflict(id) do update set email=excluded.email;
  return new;
end;
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and status='active'); $$;

create or replace function public.current_user_role()
returns public.app_role language sql stable security definer set search_path=public
as $$
  select case when status='active' then role else 'viewer'::public.app_role end
  from public.profiles where id=auth.uid();
$$;

create or replace function public.admin_update_profile(p_user_id uuid,p_display_name text,p_role text,p_status text)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_active_user() or public.current_user_role()<>'admin' then raise exception '관리자만 회원정보를 변경할 수 있습니다.'; end if;
  if p_display_name is null or length(trim(p_display_name)) not between 1 and 50 then raise exception '이름을 확인하세요.'; end if;
  if p_role not in ('admin','editor','viewer') or p_status not in ('pending','active','disabled') then raise exception '역할 또는 상태를 확인하세요.'; end if;
  if p_user_id=auth.uid() and (p_role<>'admin' or p_status<>'active') then raise exception '현재 관리자 계정의 역할이나 상태는 변경할 수 없습니다.'; end if;
  update public.profiles set display_name=trim(p_display_name),role=p_role::public.app_role,status=p_status where id=p_user_id;
  if not found then raise exception '회원을 찾을 수 없습니다.'; end if;
end;
$$;

drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles for select to authenticated
  using(id=auth.uid() or (public.is_active_user() and public.current_user_role()='admin'));
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
revoke all on function public.admin_update_profile(uuid,text,text,text) from public;
grant execute on function public.admin_update_profile(uuid,text,text,text) to authenticated;

drop policy if exists vehicles_select_authenticated on public.vehicles;
drop policy if exists vehicles_insert_editor on public.vehicles;
drop policy if exists vehicles_update_editor on public.vehicles;
drop policy if exists vehicles_delete_admin on public.vehicles;
create policy vehicles_select_authenticated on public.vehicles for select to authenticated using(public.is_active_user());
create policy vehicles_insert_editor on public.vehicles for insert to authenticated with check(public.is_active_user() and public.current_user_role() in ('admin','editor'));
create policy vehicles_update_editor on public.vehicles for update to authenticated using(public.is_active_user() and public.current_user_role() in ('admin','editor')) with check(public.is_active_user() and public.current_user_role() in ('admin','editor'));
create policy vehicles_delete_admin on public.vehicles for delete to authenticated using(public.is_active_user() and public.current_user_role()='admin');

drop policy if exists contracts_select_authenticated on public.contracts;
drop policy if exists contracts_insert_editor on public.contracts;
drop policy if exists contracts_update_editor on public.contracts;
drop policy if exists contracts_delete_admin on public.contracts;
create policy contracts_select_authenticated on public.contracts for select to authenticated using(public.is_active_user() and public.current_user_role() in ('admin','editor'));
create policy contracts_insert_editor on public.contracts for insert to authenticated with check(public.is_active_user() and public.current_user_role() in ('admin','editor'));
create policy contracts_update_editor on public.contracts for update to authenticated using(public.is_active_user() and public.current_user_role() in ('admin','editor')) with check(public.is_active_user() and public.current_user_role() in ('admin','editor'));
create policy contracts_delete_admin on public.contracts for delete to authenticated using(public.is_active_user() and public.current_user_role()='admin');

drop policy if exists driving_select_authenticated on public.driving_records;
drop policy if exists driving_insert_editor on public.driving_records;
drop policy if exists driving_update_editor on public.driving_records;
drop policy if exists driving_delete_admin on public.driving_records;
create policy driving_select_authenticated on public.driving_records for select to authenticated using(public.is_active_user() and public.current_user_role() in ('admin','editor'));
create policy driving_insert_editor on public.driving_records for insert to authenticated with check(public.is_active_user() and public.current_user_role() in ('admin','editor'));
create policy driving_update_editor on public.driving_records for update to authenticated using(public.is_active_user() and public.current_user_role() in ('admin','editor')) with check(public.is_active_user() and public.current_user_role() in ('admin','editor'));
create policy driving_delete_admin on public.driving_records for delete to authenticated using(public.is_active_user() and public.current_user_role()='admin');

drop policy if exists driving_months_read on public.driving_months;
create policy driving_months_read on public.driving_months for select to authenticated using(public.is_active_user() and public.current_user_role() in ('admin','editor'));

drop policy if exists handovers_select_authenticated on public.vehicle_handovers;
drop policy if exists handovers_insert_editor on public.vehicle_handovers;
create policy handovers_select_authenticated on public.vehicle_handovers for select to authenticated using(public.is_active_user());
create policy handovers_insert_editor on public.vehicle_handovers for insert to authenticated with check(created_by=auth.uid() and public.is_active_user());

drop policy if exists handover_photos_select_authenticated on storage.objects;
drop policy if exists handover_photos_insert_editor on storage.objects;
drop policy if exists handover_photos_delete_owner on storage.objects;
create policy handover_photos_select_authenticated on storage.objects for select to authenticated using(bucket_id='handover-photos' and public.is_active_user());
create policy handover_photos_insert_editor on storage.objects for insert to authenticated with check(bucket_id='handover-photos' and (storage.foldername(name))[1]=auth.uid()::text and public.is_active_user());
create policy handover_photos_delete_owner on storage.objects for delete to authenticated using(bucket_id='handover-photos' and owner_id=auth.uid()::text and public.is_active_user());

notify pgrst,'reload schema';
commit;
