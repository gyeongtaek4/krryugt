const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const auth=fs.readFileSync('dist/js/supabase-auth.js','utf8');
const members=fs.readFileSync('dist/js/members.js','utf8');
const app=fs.readFileSync('dist/js/app.js','utf8');
const sql=fs.readFileSync('supabase/006_members.sql','utf8');
const statusMigration=fs.readFileSync('supabase/012_member_status_simplification.sql','utf8');
const passwordResetMigration=fs.readFileSync('supabase/013_admin_password_reset.sql','utf8');

for(const id of ['authModeLogin','authModeSignup','authDisplayName','authPasswordConfirm','memberNavItem','membersView','memberRows','memberSearch'])
  assert(html.includes(`id="${id}"`),`missing HTML id: ${id}`);
assert(!html.includes('data-page="환경 설정"'));
assert(html.indexOf('./js/members.js')<html.indexOf('./js/supabase-auth.js'));
assert(auth.includes('.auth.signUp('));
assert(auth.includes("profile.status!=='active'"));
assert(auth.includes("memberNavItem.hidden=role!=='admin'"));
assert(auth.includes("new Set(['차량 현황','차량인수인계','Q&A','운행가이드'])"));
assert(auth.includes("document.getElementById('vehicleUploadGuide').hidden=readOnly"));
assert(app.includes("page === '회원관리'"));
assert(app.includes("const canEdit=window.fleetCurrentRole==='admin'"));
assert(members.includes("rpc('admin_update_profile'"));
assert(members.includes("rpc('admin_reset_member_password'"));
assert(members.includes('비밀번호 초기화'));
assert(members.includes("disabled:0,active:1"));
assert(!members.includes('승인대기'));
assert(members.includes('활성 ${activeCount}명 · 비활성 ${disabledCount}명'));
assert(members.includes("search.addEventListener('input',renderMembers)"));
for(const text of [
  "status text not null default 'disabled'",
  "status='active'",
  'create or replace function public.is_active_user()',
  'create or replace function public.admin_update_profile',
  "p_role not in ('admin','viewer')",
  "p_status not in ('active','disabled')",
  'public.is_active_user()'
]) assert(sql.includes(text),`missing SQL rule: ${text}`);
assert(sql.includes("contracts_select_authenticated on public.contracts for select to authenticated using(public.is_active_user() and public.current_user_role()='admin')"));
assert(sql.includes('handovers_insert_editor on public.vehicle_handovers for insert to authenticated with check(created_by=auth.uid() and public.is_active_user())'));
for(const text of [
  "update public.profiles set status='disabled' where status='pending'",
  "check (status in ('active','disabled'))",
  "alter column status set default 'disabled'",
  "p_status not in ('active','disabled')"
]) assert(statusMigration.includes(text),`missing status migration rule: ${text}`);
for(const text of [
  'create or replace function public.admin_reset_member_password',
  "extensions.crypt('1234'",
  "p_user_id=auth.uid()",
  "public.current_user_role()<>'admin'",
  'grant execute on function public.admin_reset_member_password(uuid) to authenticated'
]) assert(passwordResetMigration.includes(text),`missing password reset rule: ${text}`);
assert(html.includes('비밀번호 분실 시, 법인차량 관리자에게 문의 주세요.'));
const removeEditor=fs.readFileSync('supabase/007_remove_editor_role.sql','utf8');
assert(removeEditor.includes("update public.profiles set role='viewer' where role='editor'"));
assert(removeEditor.includes("p_role not in ('admin','viewer')"));
console.log('PASS: signup, admin member view, active/disabled states and active-user RLS wiring (static).');
