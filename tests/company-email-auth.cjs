const fs = require('fs');
const assert = require('assert');

const auth = fs.readFileSync('dist/js/supabase-auth.js', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');
const sql = fs.readFileSync('supabase/021_company_email_verification.sql', 'utf8');

assert.match(auth, /@fujifilm\\\.com/i, '회원가입 화면에서 회사 이메일 형식을 확인해야 합니다.');
assert.match(auth, /auth\.signUp[\s\S]*emailRedirectTo/, '인증 후 홈페이지로 돌아올 주소를 가입 요청에 넣어야 합니다.');
assert.match(auth, /auth\.resend/, '인증 메일 재발송을 제공해야 합니다.');
assert.match(html, /authResendConfirmation/, '인증 메일 재발송 버튼이 필요합니다.');
assert.match(sql, /profile_email_exceptions/, '기존 관리자 예외를 사용자 ID로 보관해야 합니다.');
assert.match(sql, /@fujifilm\.com/, '관리자 활성화 시 회사 이메일을 서버에서 확인해야 합니다.');
assert.doesNotMatch(sql, /gyeongtaek4@gmail\.com/i, '개인 이메일을 저장소 SQL에 기록하면 안 됩니다.');
console.log('company-email-auth: ok');
