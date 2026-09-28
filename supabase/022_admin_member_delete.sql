-- 관리자 회원 삭제: 현재 로그인한 관리자는 자신을 삭제할 수 없다.
-- 사고·인수인계·Q&A·가이드 작성 이력은 업무 증빙이므로, 이력이 있는 계정은 비활성화로 보존한다.

begin;

create or replace function public.admin_delete_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_active_user() or public.current_user_role() <> 'admin' then
    raise exception '관리자만 회원 계정을 삭제할 수 있습니다.';
  end if;
  if p_user_id = auth.uid() then
    raise exception '현재 로그인한 관리자 계정은 삭제할 수 없습니다.';
  end if;
  if not exists(select 1 from public.profiles where id = p_user_id) then
    raise exception '회원을 찾을 수 없습니다.';
  end if;

  if exists(select 1 from public.vehicle_accidents where created_by = p_user_id)
     or exists(select 1 from public.vehicle_handovers where created_by = p_user_id)
     or exists(select 1 from public.fleet_questions where created_by = p_user_id)
     or exists(select 1 from public.fleet_guides where created_by = p_user_id) then
    raise exception '업무 이력이 있는 회원은 삭제할 수 없습니다. 회원 상태를 비활성으로 변경해 기록을 보존해 주세요.';
  end if;

  delete from auth.users where id = p_user_id;
  if not found then
    raise exception '인증 계정을 찾을 수 없습니다.';
  end if;
end;
$$;

revoke all on function public.admin_delete_member(uuid) from public;
grant execute on function public.admin_delete_member(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
