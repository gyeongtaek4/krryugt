const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('dist/index.html', 'utf8');
const js = fs.readFileSync('dist/js/app.js', 'utf8');
const dialogs = fs.readFileSync('dist/js/dialogs.js', 'utf8');
const css = fs.readFileSync('dist/css/app.css', 'utf8');

assert(!html.includes('id="contractGuideUploadButton"'), 'duplicate contract upload button remains');
assert(!html.includes('id="guideUploadButton"'), 'duplicate vehicle upload button remains');
assert(js.includes("document.getElementById('contractUploadButton').addEventListener"), 'contract upload trigger is missing');
assert(js.includes("document.getElementById('vehicleUploadButton').addEventListener"), 'vehicle upload trigger is missing');
assert(js.includes("const contractUploadColumns = ['차량번호', '렌탈료', '계약시작', '계약종료'];"), 'contract upload columns are not reduced to four fields');
assert(!dialogs.includes('aria-label="계약정보 필수 열"><li>본부</li>'), 'legacy contract organization fields remain in the upload guide');
assert(dialogs.includes('aria-label="계약정보 필수 열"><li>차량번호</li><li>렌탈료</li><li>계약시작</li><li>계약종료</li>'), 'four contract upload fields are not shown in the dialog');
assert(css.includes('.drop-zone { width: 100%;'), 'full-width drop zone rule is missing');
assert(css.includes('#fileInput, #contractFileInput, #drivingFileInput'), 'hidden upload input rule is missing');
console.log('PASS: contract upload trigger and modal file picker UI (static).');
