const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('dist/js/app.js', 'utf8');
const css = fs.readFileSync('dist/css/app.css', 'utf8');

assert(js.includes('function dashboardDepartmentTree()'), 'department hierarchy builder is missing');
assert(js.includes('function dashboardDepartmentAccordionMarkup()'), 'department accordion renderer is missing');
assert(js.includes('department-headquarters'), 'headquarters accordion markup is missing');
assert(js.includes('department-division'), 'division accordion markup is missing');
assert(js.includes('department-team'), 'team accordion markup is missing');
assert(!js.includes('class="bar-track"'), 'dashboard department bars are still rendered');
assert(css.includes('.department-node summary'), 'accordion summary styling is missing');
assert(css.includes('.department-team-list'), 'nested team list styling is missing');
console.log('PASS: dashboard department accordion hierarchy replaces bar rendering (static).');
