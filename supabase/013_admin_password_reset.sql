-- 관리자만 다른 회원의 비밀번호를 초기 비밀번호 1234로 변경할 수 있다.
-- service_role 키를 브라우저에 노출하지 않고, DB 함수에서 현재 로그인한 관리자 여부를 검증한다.
begin;

create or replace function public.admin_reset_member_password(p_user_id uuid)
returns void language plpgsql security definer set search_path=public, auth, extensions
as $$
begin
  if not public.is_active_user() or public.current_user_role()<>'admin' then
    raise exception '관리자만 비밀번호를 초기화할 수 있습니다.';
  end if;
  if p_user_id=auth.uid() then
    raise exception '현재 로그인한 관리자 계정은 이 화면에서 초기화할 수 없습니다.';
  end if;
  if not exists(select 1 from public.profiles where id=p_user_id) then
    raise exception '회원을 찾을 수 없습니다.';
  end if;

  update auth.users
  set encrypted_password=extensions.crypt('1234',extensions.gen_salt('bf')),
      updated_at=timezone('utc',now()),
      recovery_token='',
      reauthentication_token=''
  where id=p_user_id;
  if not found then
    raise exception '인증 계정을 찾을 수 없습니다.';
  end if;
end;
$$;

revoke all on function public.admin_reset_member_password(uuid) from public;
grant execute on function public.admin_reset_member_password(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
