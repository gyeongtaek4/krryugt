-- 법인차량 관리 1단계: 현재 차량·계약·월 이동거리·사용자 프로필
-- Supabase Dashboard > SQL Editor > New query에 전체를 붙여 넣고 Run 하세요.
-- 이 파일은 표만 만듭니다. 기존 데이터를 삭제하거나 변경하지 않습니다.

create extension if not exists pgcrypto;

-- 화면 권한의 기본값입니다. 실제 로그인 연결 전까지는 권한이 적용되지 않습니다.
do $$ begin
  create type public.app_role as enum ('admin', 'editor', 'viewer');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_number text not null,
  vehicle_number_normalized text generated always as (upper(regexp_replace(vehicle_number, '\s+', '', 'g'))) stored,
  vehicle_model text not null default '',
  region text not null default '',
  parking_lot text not null default '',
  headquarters text not null default '',
  division text not null default '',
  team text not null default '',
  primary_manager text not null default '',
  secondary_manager text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_vehicle_number_normalized_key unique (vehicle_number_normalized)
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  monthly_rental_fee numeric(14, 0) not null check (monthly_rental_fee >= 0),
  contract_start_month date not null,
  contract_end_month date not null,
  rental_company text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_month_first_day check (
    contract_start_month = date_trunc('month', contract_start_month)::date
    and contract_end_month = date_trunc('month', contract_end_month)::date
  ),
  constraint contracts_month_order check (contract_end_month >= contract_start_month)
);

create table if not exists public.driving_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  operating_month date not null,
  source_date date not null,
  monthly_distance_km numeric(12, 1) not null check (monthly_distance_km >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint driving_records_month_first_day check (
    operating_month = date_trunc('month', operating_month)::date
  ),
  constraint driving_records_vehicle_month_key unique (vehicle_id, operating_month)
);

create index if not exists contracts_vehicle_id_idx on public.contracts(vehicle_id);
create index if not exists driving_records_operating_month_idx on public.driving_records(operating_month);
create index if not exists driving_records_vehicle_id_idx on public.driving_records(vehicle_id);
create index if not exists vehicles_organization_idx on public.vehicles(headquarters, division, team);

-- updated_at을 자동 갱신합니다.
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at before update on public.vehicles
for each row execute function public.set_updated_at();
drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at before update on public.contracts
for each row execute function public.set_updated_at();
drop trigger if exists driving_records_set_updated_at on public.driving_records;
create trigger driving_records_set_updated_at before update on public.driving_records
for each row execute function public.set_updated_at();

-- 실제 홈페이지를 연결하기 전에 RLS 정책을 별도 단계에서 만든다.
-- 지금 RLS를 켜되 정책을 만들지 않아, 브라우저의 임의 접근을 막는다.
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.contracts enable row level security;
alter table public.driving_records enable row level security;

comment on table public.vehicles is '현재 차량·담당자·조직 정보. 확정 과거자료는 이후 마감 상세 표에 별도 저장한다.';
comment on table public.contracts is '차량 계약 이력. 금액은 부가세 포함 월 렌탈료(원)다.';
comment on table public.driving_records is '차량별 월 이동거리. 차량별·월별 한 행이며 누적 계기판 값이 아니다.';

-- 실행 확인용: 표 이름 4개가 나오면 성공입니다.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'vehicles', 'contracts', 'driving_records')
order by table_name;
