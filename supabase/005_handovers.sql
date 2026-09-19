-- 차량인수인계 기록과 비공개 외관 사진 저장. 기존 자료는 삭제하지 않는다.
begin;

create table if not exists public.vehicle_handovers (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  handover_date date not null,
  handed_over_by text not null check (length(trim(handed_over_by)) between 1 and 80),
  received_by text not null check (length(trim(received_by)) between 1 and 80),
  condition text not null check (condition in ('확인 필요','이상 없음','이상 있음')),
  notes text not null default '' check (length(notes) <= 2000),
  vehicle_snapshot jsonb not null check (jsonb_typeof(vehicle_snapshot) = 'object'),
  photo_paths jsonb not null check (jsonb_typeof(photo_paths) = 'array' and jsonb_array_length(photo_paths) between 1 and 6),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint handover_people_different check (trim(handed_over_by) <> trim(received_by)),
  constraint handover_damage_notes check (condition <> '이상 있음' or length(trim(notes)) > 0)
);

create index if not exists vehicle_handovers_date_idx on public.vehicle_handovers(handover_date desc, created_at desc);
alter table public.vehicle_handovers enable row level security;
drop policy if exists handovers_select_authenticated on public.vehicle_handovers;
drop policy if exists handovers_insert_editor on public.vehicle_handovers;
create policy handovers_select_authenticated on public.vehicle_handovers for select to authenticated using (true);
create policy handovers_insert_editor on public.vehicle_handovers for insert to authenticated
  with check (created_by = auth.uid() and public.current_user_role() in ('admin','editor'));
revoke all on public.vehicle_handovers from anon;
revoke update, delete on public.vehicle_handovers from authenticated;
grant select, insert on public.vehicle_handovers to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('handover-photos','handover-photos',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists handover_photos_select_authenticated on storage.objects;
drop policy if exists handover_photos_insert_editor on storage.objects;
drop policy if exists handover_photos_delete_owner on storage.objects;
create policy handover_photos_select_authenticated on storage.objects for select to authenticated
  using (bucket_id='handover-photos');
create policy handover_photos_insert_editor on storage.objects for insert to authenticated
  with check (bucket_id='handover-photos' and (storage.foldername(name))[1]=auth.uid()::text
    and public.current_user_role() in ('admin','editor'));
create policy handover_photos_delete_owner on storage.objects for delete to authenticated
  using (bucket_id='handover-photos' and owner_id=auth.uid()::text
    and public.current_user_role() in ('admin','editor'));

commit;
