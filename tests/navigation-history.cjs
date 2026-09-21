const fs = require('node:fs');
const assert = require('node:assert/strict');

const app = fs.readFileSync('dist/js/app.js', 'utf8');

for (const token of [
  "'Q&A': 'qna'", "'운행가이드': 'guide'", 'function pageFromLocation()',
  'window.history.pushState', "window.addEventListener('popstate'", 'recordHistory: true'
]) assert(app.includes(token), `missing navigation history rule: ${token}`);

console.log('PASS: menu hash history and browser back/forward wiring (static).');
