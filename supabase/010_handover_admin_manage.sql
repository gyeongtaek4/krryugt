-- 관리자만 차량인수인계 업무 정보 수정·삭제 및 연결 외관자료 정리를 할 수 있게 한다.
begin;

drop policy if exists handovers_update_admin on public.vehicle_handovers;
drop policy if exists handovers_delete_admin on public.vehicle_handovers;
create policy handovers_update_admin on public.vehicle_handovers for update to authenticated
  using (public.is_active_user() and public.current_user_role()='admin')
  with check (public.is_active_user() and public.current_user_role()='admin');
create policy handovers_delete_admin on public.vehicle_handovers for delete to authenticated
  using (public.is_active_user() and public.current_user_role()='admin');

-- 관리자가 다른 사용자가 올린 외관자료도 기록 삭제 시 정리할 수 있게 한다.
drop policy if exists handover_photos_delete_owner on storage.objects;
create policy handover_photos_delete_owner on storage.objects for delete to authenticated
  using (
    bucket_id='handover-photos' and public.is_active_user()
    and (owner_id=auth.uid()::text or public.current_user_role()='admin')
  );

notify pgrst,'reload schema';
commit;
