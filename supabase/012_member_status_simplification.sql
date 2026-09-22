-- 회원 상태를 활성/비활성으로 통일한다. 기존 승인대기 계정은 삭제하지 않고 비활성으로 보존한다.
begin;

update public.profiles set status='disabled' where status='pending';

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (status in ('active','disabled'));
alter table public.profiles alter column status set default 'disabled';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,email,display_name,role,status)
  values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'display_name',split_part(coalesce(new.email,''),'@',1)),'viewer','disabled')
  on conflict(id) do update set email=excluded.email;
  return new;
end;
$$;

create or replace function public.admin_update_profile(p_user_id uuid,p_display_name text,p_role text,p_status text)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_active_user() or public.current_user_role()<>'admin' then raise exception '관리자만 회원정보를 변경할 수 있습니다.'; end if;
  if p_display_name is null or length(trim(p_display_name)) not between 1 and 50 then raise exception '이름을 확인하세요.'; end if;
  if p_role not in ('admin','viewer') or p_status not in ('active','disabled') then raise exception '역할 또는 상태를 확인하세요.'; end if;
  if p_user_id=auth.uid() and (p_role<>'admin' or p_status<>'active') then raise exception '현재 관리자 계정의 역할이나 상태는 변경할 수 없습니다.'; end if;
  update public.profiles set display_name=trim(p_display_name),role=p_role::public.app_role,status=p_status where id=p_user_id;
  if not found then raise exception '회원을 찾을 수 없습니다.'; end if;
end;
$$;

notify pgrst,'reload schema';
commit;
