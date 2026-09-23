const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync('dist/js/app.js', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');
const elements = {};
let templateHeaders;
const templateContext = vm.createContext({downloadTemplate: headers => {templateHeaders = Array.from(headers);}});
vm.runInContext(fn('downloadClosingTemplate') + '\ndownloadClosingTemplate();', templateContext);
assert.deepEqual(templateHeaders, ['차량번호','렌탈료','주유비','통행료','주차비']);
assert(source.includes("if(!vehicle)throw Error(`${index+2}행: 차량현황에 등록되지 않은 차량번호입니다: ${plate}`)"));
assert(source.includes("result[key]=String(vehicle[key]||'')"));
for (const match of html.matchAll(/id="([^"]+)"/g)) {
  assert(!elements[match[1]], 'duplicate ID: ' + match[1]);
  elements[match[1]] = {value: '2026-09', style: {}};
}
const context = vm.createContext({
  closingArchive: {}, closingDraft: null, closingEditMonth: null,
  costKeys: ['렌탈료', '주유비', '통행료', '주차비'],
  closingMonthValue: () => '2026-09',
  won: value => value.toLocaleString('ko-KR') + '원',
  escapeHtml: value => value,
  document: {getElementById: id => { assert(elements[id], 'missing ID: ' + id); return elements[id]; }}
});
function fn(name) {
  const start = source.indexOf('function ' + name + '(');
  return source.slice(start, source.indexOf('\nfunction ', start + 1));
}
vm.runInContext(fn('closingTotals') + '\n' + fn('renderClosing') + '\n' + fn('closingExportRows'), context);
vm.runInContext('renderClosing()', context);
assert.equal(elements.closingTotal.textContent, '—');
assert.equal(elements.closingConfirm.disabled, true);
context.closingDraft = {month: '2026-09', rows: [{'렌탈료': 1000, '주유비': 200, '통행료': 30, '주차비': 40}]};
vm.runInContext('renderClosing()', context);
assert.equal(elements.closingVehicleCount.textContent, '1대');
assert.equal(elements.closingRentAmount.textContent, '1,000원');
assert.equal(elements.closingOtherAmount.textContent, '270원');
assert.equal(elements.closingTotal.textContent, '1,270원');
assert(elements.closingRows.innerHTML.includes('전체 합계'));
assert(elements.closingRows.innerHTML.includes('closing-row-total">1,270원'));
context.closingArchive['2026-09'] = {rows: context.closingDraft.rows, confirmedAt: '2026-09-17'};
vm.runInContext('renderClosing()', context);
assert.equal(elements.closingUpload.disabled, true);
assert.equal(elements.closingConfirm.disabled, true);
context.closingEditMonth = '2026-09';
vm.runInContext('renderClosing()', context);
assert.equal(elements.closingUpload.disabled, false);
assert.equal(elements.closingConfirm.disabled, false);
context.closingArchive['2026-08'] = {rows: [{'본부':'이전 본부', '부':'이전 부', '팀':'이전 팀', '차량번호':'테스트차량', '렌탈료':900, '주유비':0, '통행료':0, '주차비':0}], confirmedAt:'2026-09-01'};
const backup = JSON.stringify(context.closingArchive);
context.closingArchive = JSON.parse(backup);
const exported = vm.runInContext("closingExportRows('2026-08')", context);
assert.equal(exported[0]['본부'], '이전 본부');
assert.equal(exported[0]['총금액'], 900);
assert.equal(exported[1]['본부'], '전체 합계');
assert.equal(exported[1]['총금액'], 900);
assert.equal(vm.runInContext("closingExportRows('2026-09')[0]['총금액']", context), 1270);
assert.equal(vm.runInContext("closingExportRows('2026-07').length", context), 0);
assert.equal(JSON.stringify(context.closingArchive), backup);
console.log('PASS: closing UI IDs, summaries, locks, row/grand totals and two-month snapshot export after JSON roundtrip (mock DOM, no browser download).');
