-- Q&A 답변 등록일 보관 및 표시
begin;

alter table public.fleet_questions add column if not exists answered_at timestamptz;
update public.fleet_questions set answered_at = created_at where answered_at is null;
alter table public.fleet_questions alter column answered_at set default now();
alter table public.fleet_questions alter column answered_at set not null;

create or replace function public.set_knowledge_updated_at()
returns trigger language plpgsql set search_path=public
as $$
begin
  new.updated_at=now();
  if new.answer_body is distinct from old.answer_body then new.answered_at=now(); end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
commit;
