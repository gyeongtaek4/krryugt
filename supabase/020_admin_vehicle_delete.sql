-- 관리자 차량 삭제: 연결된 계약·운행기록은 함께 삭제하고, 감사 성격의 사고·인수인계 이력은 보존한다.
-- 이 함수는 브라우저의 버튼 표시가 아닌 서버의 활성 관리자 권한을 다시 검사한다.

create or replace function public.admin_delete_vehicles(p_vehicle_ids uuid[] default null)
returns table(
  deleted_vehicle_count integer,
  deleted_contract_count integer,
  deleted_driving_record_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_ids uuid[];
  vehicle_count integer := 0;
  contract_count integer := 0;
  driving_count integer := 0;
begin
  if not public.is_active_user() or public.current_user_role() <> 'admin' then
    raise exception '관리자만 차량을 삭제할 수 있습니다.';
  end if;

  select array_agg(id) into target_ids
  from public.vehicles
  where p_vehicle_ids is null or id = any(p_vehicle_ids);

  if coalesce(cardinality(target_ids), 0) = 0 then
    return query select 0, 0, 0;
    return;
  end if;

  -- 사고·인수인계 이력과 첨부파일은 업무 증빙이므로 차량 삭제로 지우지 않는다.
  if exists (select 1 from public.vehicle_handovers where vehicle_id = any(target_ids)) then
    raise exception '인수인계 이력이 연결된 차량은 삭제할 수 없습니다. 이력 화면에서 먼저 해당 기록을 정리해 주세요.';
  end if;
  if exists (select 1 from public.vehicle_accidents where vehicle_id = any(target_ids)) then
    raise exception '사고 이력이 연결된 차량은 삭제할 수 없습니다. 사고 이력은 보관을 위해 먼저 별도로 정리해 주세요.';
  end if;

  delete from public.contracts where vehicle_id = any(target_ids);
  get diagnostics contract_count = row_count;

  delete from public.driving_records where vehicle_id = any(target_ids);
  get diagnostics driving_count = row_count;

  delete from public.vehicles where id = any(target_ids);
  get diagnostics vehicle_count = row_count;

  return query select vehicle_count, contract_count, driving_count;
end;
$$;

revoke all on function public.admin_delete_vehicles(uuid[]) from public;
grant execute on function public.admin_delete_vehicles(uuid[]) to authenticated;

select pg_notify('pgrst', 'reload schema');

-- 실행 후, 관리자 로그인 상태에서 다음으로 빈 대상 호출만 확인할 수 있다.
-- select * from public.admin_delete_vehicles(array[]::uuid[]);
