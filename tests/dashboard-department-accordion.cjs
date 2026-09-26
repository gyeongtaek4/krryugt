const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('dist/js/app.js', 'utf8');
const css = fs.readFileSync('dist/css/app.css', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');

assert(js.includes('function dashboardDepartmentTree()'), 'department hierarchy builder is missing');
assert(js.includes('function dashboardDepartmentAccordionMarkup()'), 'department accordion renderer is missing');
assert(js.includes('department-headquarters'), 'headquarters accordion markup is missing');
assert(js.includes('department-headquarters-card'), 'headquarters card markup is missing');
assert(js.includes('department-division'), 'division accordion markup is missing');
assert(js.includes('department-team'), 'team accordion markup is missing');
assert(!js.includes('class="bar-track"'), 'dashboard department bars are still rendered');
assert(css.includes('.department-node summary'), 'accordion summary styling is missing');
assert(css.includes('.department-team-list'), 'nested team list styling is missing');
assert(css.includes('repeat(auto-fit, minmax(300px, 1fr))'), 'responsive headquarters card grid is missing');
assert(html.includes('id="expandDashboardDepartments"'), 'expand all control is missing');
assert(html.includes('id="collapseDashboardDepartments"'), 'collapse all control is missing');
assert(js.includes('function setDepartmentAccordionState(open)'), 'department accordion state helper is missing');
assert(js.includes("querySelectorAll('#dashboardDepartments details.department-node')"), 'accordion state helper does not target all department nodes');
assert(css.includes('.department-overview-actions'), 'department accordion controls are not styled');
assert(!html.includes('현재 차량현황 기준'), 'obsolete current fleet note is still rendered');
console.log('PASS: dashboard department cards use responsive accordion hierarchy with all-open/all-close controls (static).');
