const fs = require('fs');

const app = fs.readFileSync('dist/js/app.js', 'utf8');
const auth = fs.readFileSync('dist/js/supabase-auth.js', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(html.includes('id="serverStatus"'), '서버 조회 상태 안내 영역이 없습니다.');
expect(app.includes('function setServerStatus'), '서버 상태 안내 함수가 없습니다.');
expect(app.includes("return false;\n  }\n  const { data, error } = await window.fleetSupabaseClient.from('vehicles')"), '차량 조회 실패 반환 처리가 없습니다.');
expect(app.includes('서버에 저장하지 않고 화면에만 표시할 수는 없습니다.'), '비로그인 임시 저장 차단 안내가 없습니다.');
expect(!app.includes('else vehicleData = uploadedRows;'), '차량 Excel 업로드의 임시 화면 대체가 남아 있습니다.');
expect(auth.includes('await new Promise(resolve => setTimeout(resolve, 700));'), '로그인 직후 서버 조회 재시도가 없습니다.');
expect(auth.includes('if (control) control.hidden=readOnly;'), '없어진 권한 버튼 때문에 로그인 후 자료 조회가 중단되지 않도록 방어해야 합니다.');

console.log('supabase-load-status: passed');
