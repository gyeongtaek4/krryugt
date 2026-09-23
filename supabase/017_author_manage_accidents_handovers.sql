-- 작성자는 본인이 등록한 사고·인수인계 기록만, 관리자는 모든 기록을 수정·삭제할 수 있게 한다.
begin;

grant update, delete on public.vehicle_accidents to authenticated;
grant update, delete on public.vehicle_handovers to authenticated;

drop policy if exists vehicle_accidents_update_author_or_admin on public.vehicle_accidents;
drop policy if exists vehicle_accidents_delete_author_or_admin on public.vehicle_accidents;
create policy vehicle_accidents_update_author_or_admin on public.vehicle_accidents for update to authenticated
  using (public.is_active_user() and (created_by=auth.uid() or public.current_user_role()='admin'))
  with check (public.is_active_user() and (created_by=auth.uid() or public.current_user_role()='admin'));
create policy vehicle_accidents_delete_author_or_admin on public.vehicle_accidents for delete to authenticated
  using (public.is_active_user() and (created_by=auth.uid() or public.current_user_role()='admin'));

drop policy if exists handovers_update_admin on public.vehicle_handovers;
drop policy if exists handovers_delete_admin on public.vehicle_handovers;
drop policy if exists handovers_update_author_or_admin on public.vehicle_handovers;
drop policy if exists handovers_delete_author_or_admin on public.vehicle_handovers;
create policy handovers_update_author_or_admin on public.vehicle_handovers for update to authenticated
  using (public.is_active_user() and (created_by=auth.uid() or public.current_user_role()='admin'))
  with check (public.is_active_user() and (created_by=auth.uid() or public.current_user_role()='admin'));
create policy handovers_delete_author_or_admin on public.vehicle_handovers for delete to authenticated
  using (public.is_active_user() and (created_by=auth.uid() or public.current_user_role()='admin'));

notify pgrst,'reload schema';
commit;
