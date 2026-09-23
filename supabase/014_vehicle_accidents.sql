-- 사고접수 및 이력: 활성 회원 접수·열람, 관리자 처리 코멘트, 비공개 현장 사진.
begin;

create table if not exists public.vehicle_accidents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  incident_date date not null,
  passengers text not null check (char_length(trim(passengers)) between 1 and 300),
  incident_location text not null check (char_length(trim(incident_location)) between 1 and 300),
  description text not null check (char_length(trim(description)) between 1 and 4000),
  vehicle_snapshot jsonb not null check (jsonb_typeof(vehicle_snapshot)='object'),
  photo_paths jsonb not null default '[]'::jsonb check (jsonb_typeof(photo_paths)='array' and jsonb_array_length(photo_paths)<=6),
  admin_comment text not null default '' check (char_length(admin_comment)<=2000),
  commented_by uuid references auth.users(id) on delete set null,
  commented_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists vehicle_accidents_date_idx on public.vehicle_accidents(incident_date desc,created_at desc);

alter table public.vehicle_accidents enable row level security;
revoke all on public.vehicle_accidents from anon;
revoke all on public.vehicle_accidents from authenticated;
grant select,insert on public.vehicle_accidents to authenticated;
drop policy if exists vehicle_accidents_read_active on public.vehicle_accidents;
drop policy if exists vehicle_accidents_insert_active on public.vehicle_accidents;
create policy vehicle_accidents_read_active on public.vehicle_accidents for select to authenticated using (public.is_active_user());
create policy vehicle_accidents_insert_active on public.vehicle_accidents for insert to authenticated with check (public.is_active_user() and created_by=auth.uid());

create or replace function public.comment_vehicle_accident(p_accident_id uuid,p_comment text)
returns public.vehicle_accidents language plpgsql security definer set search_path=public as $$
declare saved public.vehicle_accidents;
begin
  if not public.is_active_user() or public.current_user_role()<>'admin' then raise exception '관리자만 사고 처리 코멘트를 저장할 수 있습니다.'; end if;
  if char_length(trim(coalesce(p_comment,''))) not between 1 and 2000 then raise exception '처리 코멘트는 1~2000자로 입력하세요.'; end if;
  update public.vehicle_accidents set admin_comment=trim(p_comment),commented_by=auth.uid(),commented_at=now() where id=p_accident_id returning * into saved;
  if saved.id is null then raise exception '사고 접수 이력을 찾을 수 없습니다.'; end if;
  return saved;
end;
$$;
revoke all on function public.comment_vehicle_accident(uuid,text) from public;
grant execute on function public.comment_vehicle_accident(uuid,text) to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('accident-photos','accident-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists accident_photos_read_active on storage.objects;
drop policy if exists accident_photos_insert_active on storage.objects;
drop policy if exists accident_photos_delete_owner on storage.objects;
drop policy if exists accident_photos_delete_admin on storage.objects;
create policy accident_photos_read_active on storage.objects for select to authenticated using (bucket_id='accident-photos' and public.is_active_user());
create policy accident_photos_insert_active on storage.objects for insert to authenticated with check (bucket_id='accident-photos' and public.is_active_user() and (storage.foldername(name))[1]=auth.uid()::text);
create policy accident_photos_delete_owner on storage.objects for delete to authenticated using (bucket_id='accident-photos' and owner_id=auth.uid()::text and public.is_active_user());
create policy accident_photos_delete_admin on storage.objects for delete to authenticated using (bucket_id='accident-photos' and public.is_active_user() and public.current_user_role()='admin');

notify pgrst,'reload schema';
commit;
