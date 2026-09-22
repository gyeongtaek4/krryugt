const fs = require('node:fs');
const assert = require('node:assert/strict');

const css = fs.readFileSync('dist/css/app.css', 'utf8');

assert(css.includes('.vehicle-table .column-filter-control { padding-left: 0; }'), 'header filter wrapper alignment rule is missing');
assert(css.includes('.vehicle-table .column-filter { padding-left: 0; }'), 'header filter alignment rule is missing');
console.log('PASS: vehicle and contract table header/data alignment rules (static).');
