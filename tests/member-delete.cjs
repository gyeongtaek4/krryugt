const fs = require('fs');
const assert = require('assert');

const members = fs.readFileSync('dist/js/members.js', 'utf8');
const sql = fs.readFileSync('supabase/022_admin_member_delete.sql', 'utf8');

assert.match(members, /member-delete/, '회원관리 화면에 계정 삭제 버튼이 필요합니다.');
assert.match(members, /admin_delete_member/, '삭제는 서버 관리자 RPC를 호출해야 합니다.');
assert.match(members, /영구 삭제할까요/, '삭제 전 확인 문구가 필요합니다.');
assert.match(sql, /p_user_id = auth\.uid\(\)/, '현재 관리자 본인 삭제를 서버에서 막아야 합니다.');
assert.match(sql, /delete from auth\.users/, '프로필만이 아니라 인증 계정을 삭제해야 합니다.');
assert.match(sql, /vehicle_accidents[\s\S]*vehicle_handovers[\s\S]*fleet_questions[\s\S]*fleet_guides/, '업무 이력 보존 차단을 서버에서 확인해야 합니다.');
console.log('member-delete: ok');
