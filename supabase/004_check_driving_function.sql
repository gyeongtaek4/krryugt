-- 홈페이지와 같은 프로젝트(jmzjttyijccilqefgbzt)의 SQL Editor에서 전체 실행.
-- 업무자료를 수정하지 않고 함수 존재·인수·권한을 확인한다.
NOTIFY pgrst, 'reload schema';
select
  to_regclass('public.driving_months') is not null as table_exists,
  to_regprocedure('public.save_driving_month(text,jsonb,boolean)') is not null as function_exists;
select n.nspname as schema_name, p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='save_driving_month';
