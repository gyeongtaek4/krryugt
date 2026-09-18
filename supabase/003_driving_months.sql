-- SQL Editor에서 전체 실행. 기존 driving_records나 업무자료는 삭제하지 않는다.
begin;
create table if not exists public.driving_months (
  month text primary key check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  rows jsonb not null check (jsonb_typeof(rows) = 'array'),
  confirmed_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.driving_months enable row level security;
drop policy if exists driving_months_read on public.driving_months;
create policy driving_months_read on public.driving_months for select to authenticated
  using (public.current_user_role() in ('admin','editor','viewer','executive'));
grant select on public.driving_months to authenticated;
revoke insert,update,delete on public.driving_months from anon,authenticated;
create or replace function public.save_driving_month(p_month text,p_rows jsonb,p_confirm boolean default false)
returns public.driving_months
language plpgsql security definer set search_path = public
as $$
declare
  item jsonb; v public.vehicles; clean jsonb := '[]'::jsonb;
  saved public.driving_months; day date; km numeric;
begin
  if auth.uid() is null or coalesce(public.current_user_role(),'') not in ('admin','editor') then
    raise exception '운행자료 저장 권한이 없습니다.';
  end if;
  if p_month is null or p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' or p_rows is null
    or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows)=0 then
    raise exception '월도와 운행자료를 확인하세요.';
  end if;
  perform pg_advisory_xact_lock(hashtext('fleet-driving-'||p_month));
  select * into saved from public.driving_months where month=p_month for update;
  if saved.confirmed_at is not null then raise exception '이미 확정된 월입니다.'; end if;
  -- 확정은 서버에 검토 저장된 행만 사용한다.
  if p_confirm then
    if saved.month is null then raise exception '자료를 먼저 업로드 저장하세요.'; end if;
    if p_rows <> saved.rows then raise exception '다른 사용자가 자료를 변경했습니다. 새로고침 후 확인하세요.'; end if;
    p_rows := saved.rows;
  end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    if item->>'운행년월일' is null or item->>'운행년월일' !~ '^\d{4}-\d{2}-\d{2}$' then raise exception '운행일을 확인하세요.'; end if;
    day := (item->>'운행년월일')::date;
    if to_char(day,'YYYY-MM') <> p_month then raise exception '다른 월 기록이 포함되어 있습니다.'; end if;
    if item->>'키로수' is null or item->>'키로수' !~ '^\d+(\.\d+)?$' then raise exception '이동거리를 확인하세요.'; end if;
    km := (item->>'키로수')::numeric;
    if km > 10000000 then raise exception '이동거리 값이 너무 큽니다.'; end if;
    select * into v from public.vehicles
      where vehicle_number_normalized=upper(regexp_replace(item->>'차량번호','\s+','','g'));
    if p_confirm and (v.id is null or v.headquarters='' or v.division='' or v.team='') then
      raise exception '미매칭 차량 또는 누락된 조직정보를 차량현황에서 확인하세요.';
    end if;
    clean := clean || jsonb_build_array(jsonb_build_object(
      '차량번호',coalesce(v.vehicle_number,item->>'차량번호'),
      '키로수',km::text,'운행년월일',day::text) ||
      case when p_confirm then jsonb_build_object('_organization',jsonb_build_object(
        '본부',v.headquarters,'부',v.division,'팀',v.team,'차종',v.vehicle_model)) else '{}'::jsonb end);
    if coalesce(item->>'차량번호','')='' then raise exception '차량번호가 비어 있습니다.'; end if;
  end loop;
  insert into public.driving_months(month,rows,confirmed_at,updated_at,updated_by)
    values(p_month,clean,case when p_confirm then now() else null end,now(),auth.uid())
    on conflict(month) do update set rows=excluded.rows,confirmed_at=excluded.confirmed_at,
      updated_at=excluded.updated_at,updated_by=excluded.updated_by
    returning * into saved;
  return saved;
end;
$$;
revoke all on function public.save_driving_month(text,jsonb,boolean) from public;
grant execute on function public.save_driving_month(text,jsonb,boolean) to authenticated;
commit;
