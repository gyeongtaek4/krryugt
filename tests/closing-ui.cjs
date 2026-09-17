const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync('dist/js/app.js', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');
const elements = {};
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
vm.runInContext(fn('closingTotals') + '\n' + fn('renderClosing'), context);
vm.runInContext('renderClosing()', context);
assert.equal(elements.closingTotal.textContent, '—');
assert.equal(elements.closingConfirm.disabled, true);
context.closingDraft = {month: '2026-09', rows: [{'렌탈료': 1000, '주유비': 200, '통행료': 30, '주차비': 40}]};
vm.runInContext('renderClosing()', context);
assert.equal(elements.closingVehicleCount.textContent, '1대');
assert.equal(elements.closingRentAmount.textContent, '1,000원');
assert.equal(elements.closingOtherAmount.textContent, '270원');
assert.equal(elements.closingTotal.textContent, '1,270원');
context.closingArchive['2026-09'] = {rows: context.closingDraft.rows, confirmedAt: '2026-09-17'};
vm.runInContext('renderClosing()', context);
assert.equal(elements.closingUpload.disabled, true);
assert.equal(elements.closingConfirm.disabled, true);
context.closingEditMonth = '2026-09';
vm.runInContext('renderClosing()', context);
assert.equal(elements.closingUpload.disabled, false);
assert.equal(elements.closingConfirm.disabled, false);
console.log('PASS: closing UI IDs, empty/draft summaries, confirmed lock and correction (mock DOM).');
