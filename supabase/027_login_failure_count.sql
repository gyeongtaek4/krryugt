-- 로그인 화면에서 본인에게 실패 횟수를 안내하기 위한 실패 기록 RPC.
-- 존재하지 않는 이메일은 0을 반환하며, 비밀번호와 같은 인증정보는 반환하지 않는다.
begin;

create or replace function public.record_login_failure_with_count(p_email text)
returns integer language plpgsql security definer set search_path=public
as $$
declare attempts integer := 0;
begin
  update public.profiles
  set failed_login_attempts=failed_login_attempts+1,
      login_locked_at=case when failed_login_attempts+1>=5 then coalesce(login_locked_at,timezone('utc',now())) else login_locked_at end
  where lower(trim(email))=lower(trim(coalesce(p_email,'')))
    and login_locked_at is null
  returning least(failed_login_attempts,5) into attempts;
  return coalesce(attempts,0);
end;
$$;

revoke all on function public.record_login_failure_with_count(text) from public;
grant execute on function public.record_login_failure_with_count(text) to anon, authenticated;
notify pgrst,'reload schema';
commit;
