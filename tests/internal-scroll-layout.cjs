const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('dist/css/app.css', 'utf8');

assert(css.includes('@media (min-width: 901px)'), 'desktop internal-scroll breakpoint is missing');
assert(css.includes('html, body { height: 100%; overflow: hidden; }'), 'browser-level desktop scroll is not contained');
assert(css.includes('.main { height: 100dvh; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }'), 'main workspace does not reserve a fixed viewport');
assert(css.includes('.content { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }'), 'each category content area is not independently scrollable');
assert(css.includes('.content .table-wrap { max-height: min(50vh, 520px); overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }'), 'long data tables do not have their own scroll area');
assert(css.includes('.content .vehicle-table thead th { position: sticky; top: 0; z-index: 2; background: var(--white); }'), 'table headings are not kept visible during inner scrolling');
assert(css.includes('.knowledge-list-panel .knowledge-list { max-height: min(50vh, 520px); overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }'), 'knowledge lists do not have an independent scroll area');

console.log('PASS: desktop category content and long lists use independent scroll areas (static).');
