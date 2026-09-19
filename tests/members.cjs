const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const auth=fs.readFileSync('dist/js/supabase-auth.js','utf8');
const members=fs.readFileSync('dist/js/members.js','utf8');
const app=fs.readFileSync('dist/js/app.js','utf8');
const sql=fs.readFileSync('supabase/006_members.sql','utf8');

for(const id of ['authModeLogin','authModeSignup','authDisplayName','authPasswordConfirm','memberNavItem','membersView','memberRows'])
  assert(html.includes(`id="${id}"`),`missing HTML id: ${id}`);
assert(!html.includes('data-page="환경 설정"'));
assert(html.indexOf('./js/members.js')<html.indexOf('./js/supabase-auth.js'));
assert(auth.includes('.auth.signUp('));
assert(auth.includes("profile.status!=='active'"));
assert(auth.includes("memberNavItem.hidden=role!=='admin'"));
assert(auth.includes("new Set(['차량 현황','차량인수인계'])"));
assert(auth.includes("document.getElementById('vehicleUploadGuide').hidden=readOnly"));
assert(app.includes("page === '회원관리'"));
assert(app.includes("const canEdit=['admin','editor'].includes(window.fleetCurrentRole)"));
assert(members.includes("rpc('admin_update_profile'"));
for(const text of [
  "status text not null default 'pending'",
  "status='active'",
  'create or replace function public.is_active_user()',
  'create or replace function public.admin_update_profile',
  "p_role not in ('admin','editor','viewer')",
  "p_status not in ('pending','active','disabled')",
  'public.is_active_user()'
]) assert(sql.includes(text),`missing SQL rule: ${text}`);
assert(sql.includes("contracts_select_authenticated on public.contracts for select to authenticated using(public.is_active_user() and public.current_user_role() in ('admin','editor'))"));
assert(sql.includes('handovers_insert_editor on public.vehicle_handovers for insert to authenticated with check(created_by=auth.uid() and public.is_active_user())'));
console.log('PASS: signup, admin member view, approval states and active-user RLS wiring (static).');
