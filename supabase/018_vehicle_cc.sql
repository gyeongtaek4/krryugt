-- 차량현황의 CC 관리 항목
-- 기존 차량은 빈 문자열로 유지하며, 이후 차량 등록·수정·Excel 업로드에서 값을 저장한다.
alter table public.vehicles
  add column if not exists cc text not null default '';

comment on column public.vehicles.cc is '팀과 담당자(정) 사이에 관리하는 차량 CC 정보';

select pg_notify('pgrst', 'reload schema');

-- SQL Editor 실행 후 확인용
select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vehicles'
      and column_name = 'cc'
  ) as vehicle_cc_column_exists;
