const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('dist/js/app.js', 'utf8');
const dialogs = fs.readFileSync('dist/js/dialogs.js', 'utf8');
function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  assert(start >= 0, `${name} is missing`);
  return source.slice(start, end < 0 ? source.length : end);
}

const sheets = [];
const context = vm.createContext({
  window: { XLSX: true },
  XLSX: {
    utils: {
      book_new: () => ({}),
      aoa_to_sheet: columns => ({ A1: { v: columns[0][0] } }),
      encode_cell: ({ c, r }) => `${c}:${r}`,
      encode_range: ({ s, e }) => `${s.c}:${s.r}-${e.c}:${e.r}`,
      book_append_sheet: (_book, sheet, name) => sheets.push({ sheet, name })
    },
    writeFile: () => {}
  },
  showToast: () => {},
  contractUploadColumns: ['차량번호', '렌탈료', '계약시작', '계약종료'],
  drivingColumns: ['차량번호', '키로수', '운행년월일']
});

vm.runInContext(`${functionSource('downloadTemplate')}\n${functionSource('downloadContractTemplate')}\n${functionSource('downloadDrivingTemplate')}\ndownloadContractTemplate();\ndownloadDrivingTemplate();`, context);

assert.equal(sheets.length, 2, 'contract and driving templates were not created');
assert.equal(sheets[0].sheet['2:1'].z, '@', 'contract start month is not formatted as text');
assert.equal(sheets[0].sheet['3:1'].z, '@', 'contract end month is not formatted as text');
assert.equal(sheets[1].sheet['2:1'].z, '@', 'driving date is not formatted as text');
assert.equal(sheets[0].sheet['2:1000'].z, '@', 'contract text formatting does not cover input rows');
assert.equal(sheets[1].sheet['2:1000'].z, '@', 'driving text formatting does not cover input rows');
assert(dialogs.includes('2026-1</strong>, <strong>2026-10'), 'contract month input guidance is missing');
assert(dialogs.includes('2026-1-1</strong>처럼 입력해도 Excel이 다른 표기로 바꾸지 않으며'), 'driving date input guidance is missing');

console.log('PASS: downloaded contract and driving date input cells use Excel text formatting (static).');
