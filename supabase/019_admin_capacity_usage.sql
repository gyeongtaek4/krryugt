-- 관리자 전용: Supabase Storage 파일 합계와 현재 Postgres DB 사용량을 조회한다.
-- 무료 플랜 표시 기준은 Storage 1GB, DB 500MB이며 화면에서 각각 80% 경고를 계산한다.
-- 이 함수는 관리자 여부를 서버에서 검사하므로 브라우저 코드에 관리용 키를 넣지 않는다.

create or replace function public.admin_get_capacity_usage()
returns table(storage_bytes bigint, database_bytes bigint, checked_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not public.is_active_user() or public.current_user_role() <> 'admin' then
    raise exception '관리자만 용량 정보를 확인할 수 있습니다.';
  end if;

  return query
  select
    coalesce(sum((objects.metadata ->> 'size')::bigint), 0)::bigint as storage_bytes,
    (select pg_database_size(current_database())::bigint) as database_bytes,
    now() as checked_at
  from storage.objects as objects;
end;
$$;

revoke all on function public.admin_get_capacity_usage() from public;
grant execute on function public.admin_get_capacity_usage() to authenticated;

select pg_notify('pgrst', 'reload schema');

-- SQL Editor 실행 후 관리자 로그인 상태에서 다음으로 결과를 확인한다.
-- select * from public.admin_get_capacity_usage();
