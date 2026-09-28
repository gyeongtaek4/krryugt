-- 로그인 실패 5회 잠금과 관리자 잠금 해제.
-- 비밀번호는 이 SQL에 저장하지 않으며, 실패 횟수와 잠금 상태만 profiles에 보관한다.
begin;

alter table public.profiles add column if not exists failed_login_attempts integer not null default 0;
alter table public.profiles add column if not exists login_locked_at timestamptz;
do $$ begin
  alter table public.profiles add constraint profiles_failed_login_attempts_check check (failed_login_attempts >= 0);
exception when duplicate_object then null;
end $$;

create or replace function public.login_is_locked(p_email text)
returns boolean language sql stable security definer set search_path=public
as $$
  select coalesce((select login_locked_at is not null
    from public.profiles
    where lower(trim(email))=lower(trim(coalesce(p_email,'')))
    limit 1),false);
$$;

create or replace function public.record_login_failure(p_email text)
returns boolean language plpgsql security definer set search_path=public
as $$
declare locked boolean := false;
begin
  update public.profiles
  set failed_login_attempts=failed_login_attempts+1,
      login_locked_at=case when failed_login_attempts+1>=5 then coalesce(login_locked_at,timezone('utc',now())) else login_locked_at end
  where lower(trim(email))=lower(trim(coalesce(p_email,'')))
    and login_locked_at is null
  returning login_locked_at is not null into locked;
  return coalesce(locked,false);
end;
$$;

create or replace function public.clear_login_failures()
returns void language plpgsql security definer set search_path=public
as $$
begin
  update public.profiles set failed_login_attempts=0,login_locked_at=null where id=auth.uid();
end;
$$;

create or replace function public.admin_unlock_member(p_user_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_active_user() or public.current_user_role()<>'admin' then
    raise exception '관리자만 로그인 잠금을 해제할 수 있습니다.';
  end if;
  update public.profiles set failed_login_attempts=0,login_locked_at=null where id=p_user_id;
  if not found then raise exception '회원을 찾을 수 없습니다.'; end if;
end;
$$;

revoke all on function public.login_is_locked(text) from public;
revoke all on function public.record_login_failure(text) from public;
revoke all on function public.clear_login_failures() from public;
revoke all on function public.admin_unlock_member(uuid) from public;
grant execute on function public.login_is_locked(text) to anon, authenticated;
grant execute on function public.record_login_failure(text) to anon, authenticated;
grant execute on function public.clear_login_failures() to authenticated;
grant execute on function public.admin_unlock_member(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
