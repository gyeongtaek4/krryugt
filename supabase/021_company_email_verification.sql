-- 회사 이메일 가입 정책: 신규 활성 계정은 @fujifilm.com 이메일만 허용한다.
-- 기존에 활성화된 관리자 계정은 별도 예외 테이블에 사용자 ID로만 등록해 유지한다.
-- 이 파일에는 개인 이메일이나 비밀키를 기록하지 않는다.

begin;

create table if not exists public.profile_email_exceptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profile_email_exceptions enable row level security;
revoke all on public.profile_email_exceptions from anon, authenticated;

create or replace function public.is_company_email_or_exception(p_user_id uuid, p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(trim(coalesce(p_email, ''))) like '%@fujifilm.com'
    or exists(select 1 from public.profile_email_exceptions where user_id = p_user_id);
$$;

create or replace function public.admin_update_profile(p_user_id uuid,p_display_name text,p_role text,p_status text)
returns void language plpgsql security definer set search_path=public
as $$
declare
  target_email text;
begin
  if not public.is_active_user() or public.current_user_role()<>'admin' then raise exception '관리자만 회원정보를 변경할 수 있습니다.'; end if;
  if p_display_name is null or length(trim(p_display_name)) not between 1 and 50 then raise exception '이름을 확인하세요.'; end if;
  if p_role not in ('admin','viewer') or p_status not in ('active','disabled') then raise exception '역할 또는 상태를 확인하세요.'; end if;
  if p_user_id=auth.uid() and (p_role<>'admin' or p_status<>'active') then raise exception '현재 관리자 계정의 역할이나 상태는 변경할 수 없습니다.'; end if;

  select email into target_email from public.profiles where id=p_user_id;
  if not found then raise exception '회원을 찾을 수 없습니다.'; end if;
  if p_status='active' and not public.is_company_email_or_exception(p_user_id, target_email) then
    raise exception '@fujifilm.com 회사 이메일 인증 계정만 활성화할 수 있습니다.';
  end if;

  update public.profiles set display_name=trim(p_display_name),role=p_role::public.app_role,status=p_status where id=p_user_id;
end;
$$;

revoke all on function public.is_company_email_or_exception(uuid,text) from public;
revoke all on function public.admin_update_profile(uuid,text,text,text) from public;
grant execute on function public.admin_update_profile(uuid,text,text,text) to authenticated;

notify pgrst,'reload schema';
commit;

-- 적용 직후 SQL Editor에서 기존 관리자 예외를 1회 등록한다.
-- 개인 이메일을 이 저장소에 남기지 말고, 해당 관리자의 profiles ID만 profile_email_exceptions에 넣는다.
