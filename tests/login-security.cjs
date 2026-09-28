const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const auth=fs.readFileSync('dist/js/supabase-auth.js','utf8');
const members=fs.readFileSync('dist/js/members.js','utf8');
const sql=fs.readFileSync('supabase/026_login_security.sql','utf8');

for(const id of ['changePasswordButton','passwordChangeModal','passwordChangeForm','currentPassword','newPassword','newPasswordConfirm']) assert(html.includes(`id="${id}"`),`missing ${id}`);
assert(auth.includes("rpc('login_is_locked'"));
assert(auth.includes("rpc('record_login_failure_with_count'"));
assert(auth.includes('(${failedAttempts}/5회 오류)'));
assert(auth.includes("rpc('clear_login_failures'"));
assert(auth.includes("auth.updateUser({password:newPassword.value})"));
assert(auth.includes('비밀번호를 5회 틀려 계정이 잠겼습니다.'));
assert(members.includes("rpc('admin_unlock_member'"));
assert(members.includes('잠금 해제'));
for(const text of ['failed_login_attempts integer not null default 0','login_locked_at timestamptz','create or replace function public.login_is_locked','create or replace function public.record_login_failure','failed_login_attempts+1>=5','create or replace function public.clear_login_failures','create or replace function public.admin_unlock_member','grant execute on function public.record_login_failure(text) to anon, authenticated']) assert(sql.includes(text),`missing SQL rule: ${text}`);
console.log('login-security: ok');
