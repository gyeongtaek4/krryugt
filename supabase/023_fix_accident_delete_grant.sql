-- 사고 접수 수정·삭제 권한 복구
-- 017 SQL의 정책은 존재하지만 실제 프로젝트에서 테이블 권한이 누락된 경우에 실행합니다.
begin;

grant update, delete on public.vehicle_accidents to authenticated;

notify pgrst, 'reload schema';
commit;
