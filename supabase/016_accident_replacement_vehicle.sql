-- 사고 접수에 대차 차량번호(선택)를 보관한다.
alter table public.vehicle_accidents
  add column if not exists replacement_vehicle_number text check (char_length(replacement_vehicle_number) <= 30);

-- 기존 사고 자료도 화면 한도와 같게 최대 3개의 첨부만 허용한다.
alter table public.vehicle_accidents
  drop constraint if exists vehicle_accidents_photo_paths_check;
alter table public.vehicle_accidents
  add constraint vehicle_accidents_photo_paths_check
  check (jsonb_typeof(photo_paths)='array' and jsonb_array_length(photo_paths)<=3) not valid;
