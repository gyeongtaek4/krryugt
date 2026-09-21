-- 차량인수인계의 지정 인수자 동의와 동의 로그를 추가한다.
-- 005_handovers.sql, 006_members.sql, 007_remove_editor_role.sql 실행 후 한 번 실행한다.
begin;

alter table public.vehicle_handovers
  add column if not exists received_by_user_id uuid references auth.users(id) on delete restrict,
  add column if not exists consent_status text not null default 'pending',
  add column if not exists recipient_confirmed_at timestamptz,
  add column if not exists recipient_confirmed_by uuid references auth.users(id) on delete restrict;

-- 계정 지정 이전의 이력은 그대로 보관하며, 동의 대상이 없는 기존 이력으로 구분한다.
update public.vehicle_handovers
set consent_status='legacy'
where received_by_user_id is null and consent_status='pending';

do $$ begin
  alter table public.vehicle_handovers add constraint vehicle_handovers_consent_status_check
    check (consent_status in ('pending','completed','legacy'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.vehicle_handovers add constraint vehicle_handovers_consent_recipient_check check (
    (consent_status='legacy' and received_by_user_id is null and recipient_confirmed_at is null and recipient_confirmed_by is null)
    or (consent_status='pending' and received_by_user_id is not null and recipient_confirmed_at is null and recipient_confirmed_by is null)
    or (consent_status='completed' and received_by_user_id is not null and recipient_confirmed_at is not null and recipient_confirmed_by=received_by_user_id)
  );
exception when duplicate_object then null;
end $$;

create index if not exists vehicle_handovers_recipient_pending_idx
  on public.vehicle_handovers(received_by_user_id,consent_status,created_at desc);

-- 활성 회원만 인수자로 선택한다. 계정 ID는 화면에서 선택값으로만 사용한다.
create or replace function public.active_handover_recipients()
returns table(id uuid,display_name text,email text)
language sql stable security definer set search_path=public
as $$
  select p.id,p.display_name,p.email
  from public.profiles p
  where public.is_active_user() and p.status='active'
  order by p.display_name,p.email;
$$;

-- 지정된 인수자 본인이 로그인한 경우에만 동의를 완료하고, ID와 동의 시각을 남긴다.
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
  set consent_status='completed',recipient_confirmed_at=now(),recipient_confirmed_by=auth.uid()
  where id=p_handover_id and consent_status='pending' and received_by_user_id=auth.uid()
  returning * into saved;

  if saved.id is null then
    raise exception '이 인수인계에 동의할 권한이 없거나 이미 처리되었습니다.';
  end if;
  return saved;
end;
$$;

-- 새 기록은 반드시 지정 인수자의 미동의 상태로만 저장할 수 있다.
drop policy if exists handovers_insert_editor on public.vehicle_handovers;
create policy handovers_insert_editor on public.vehicle_handovers for insert to authenticated
  with check (
    created_by=auth.uid() and public.is_active_user()
    and received_by_user_id is not null and consent_status='pending'
    and recipient_confirmed_at is null and recipient_confirmed_by is null
  );

revoke all on function public.active_handover_recipients() from public;
grant execute on function public.active_handover_recipients() to authenticated;
revoke all on function public.confirm_vehicle_handover(uuid) from public;
grant execute on function public.confirm_vehicle_handover(uuid) to authenticated;

notify pgrst,'reload schema';
commit;
