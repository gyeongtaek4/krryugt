-- 기존 인수인계 이력을 수신자 이름과 일치하는 활성 회원 계정에 연결하고,
-- 인수 동의 시 당시 동의자 이름을 ID·시각과 함께 보관한다.
begin;

alter table public.vehicle_handovers
  add column if not exists recipient_confirmed_name text;

-- 이름이 정확히 한 명의 활성 회원과 일치하는 기존 이력만 자동 연결한다.
-- 같은 이름의 회원이 둘 이상이거나 일치하는 계정이 없으면 미지정 상태로 보존한다.
with unique_active_members as (
  select lower(trim(display_name)) as normalized_name,min(id) as id
  from public.profiles
  where status='active' and length(trim(display_name)) > 0
  group by lower(trim(display_name))
  having count(*)=1
)
update public.vehicle_handovers h
set received_by_user_id=m.id,consent_status='pending'
from unique_active_members m
where h.consent_status='legacy'
  and lower(trim(h.received_by))=m.normalized_name;

create or replace function public.confirm_vehicle_handover(p_handover_id uuid)
returns public.vehicle_handovers
language plpgsql security definer set search_path=public
as $$
declare saved public.vehicle_handovers;
begin
  if not public.is_active_user() then
    raise exception '활성 회원만 인수 동의를 할 수 있습니다.';
  end if;

  update public.vehicle_handovers
  set consent_status='completed',
      recipient_confirmed_at=now(),
      recipient_confirmed_by=auth.uid(),
      recipient_confirmed_name=(select display_name from public.profiles where id=auth.uid())
  where id=p_handover_id and consent_status='pending' and received_by_user_id=auth.uid()
  returning * into saved;

  if saved.id is null then
    raise exception '이 인수인계에 동의할 권한이 없거나 이미 처리되었습니다.';
  end if;
  return saved;
end;
$$;

notify pgrst,'reload schema';
commit;
