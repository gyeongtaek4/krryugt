const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('dist/js/accidents.js', 'utf8');
assert.match(source, /id="accidentDeleteButton" type="button"/, '삭제 버튼은 명시적인 클릭 버튼이어야 합니다.');
assert.match(source, /class="handover-delete-warning" id="accidentDeleteCopy"/, '삭제 대상 안내를 강조 박스로 표시해야 합니다.');
assert.match(source, /accidentDeleteButton'\)\.addEventListener\('click',submitAccidentDelete\)/, '삭제 버튼 클릭이 삭제 처리에 연결되어야 합니다.');
assert.match(source, /value\.trim\(\)!=='삭제'/, '삭제 확인 입력을 계속 확인해야 합니다.');
assert.match(source, /from\('vehicle_accidents'\)\.delete\(\)/, '사고 이력 삭제 요청을 보내야 합니다.');
assert.match(source, /deleteButton\.disabled=true/, '중복 클릭을 막아야 합니다.');
assert.match(source, /로그인 세션이 만료되었습니다/, '로그아웃 뒤의 삭제 시도 원인을 안내해야 합니다.');
console.log('accident-delete: ok');
