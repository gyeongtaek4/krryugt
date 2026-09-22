const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('dist/index.html', 'utf8');
const js = fs.readFileSync('dist/js/app.js', 'utf8');
const css = fs.readFileSync('dist/css/app.css', 'utf8');

assert(!html.includes('id="contractGuideUploadButton"'), 'duplicate contract upload button remains');
assert(js.includes("document.getElementById('contractUploadButton').addEventListener"), 'contract upload trigger is missing');
assert(css.includes('.drop-zone { width: 100%;'), 'full-width drop zone rule is missing');
assert(css.includes('#fileInput, #contractFileInput, #drivingFileInput'), 'hidden upload input rule is missing');
console.log('PASS: contract upload trigger and modal file picker UI (static).');
