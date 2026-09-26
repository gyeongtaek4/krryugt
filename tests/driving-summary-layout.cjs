const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('dist/index.html', 'utf8');
const js = fs.readFileSync('dist/js/app.js', 'utf8');
const drivingJs = fs.readFileSync('dist/js/driving-months.js', 'utf8');
const css = fs.readFileSync('dist/css/app.css', 'utf8');

assert(!html.includes('id="usageHeadquartersCount"'), 'driving headquarters card remains');
assert(!html.includes('id="usageDivisionCount"'), 'driving division card remains');
assert(!html.includes('id="usageTeamCount"'), 'driving team card remains');
assert(html.includes('id="vehicleHeadquartersCount"'), 'vehicle headquarters badge is missing');
assert(html.includes('id="vehicleDivisionCount"'), 'vehicle division badge is missing');
assert(html.includes('id="vehicleTeamCount"'), 'vehicle team badge is missing');
assert(js.includes("document.getElementById('vehicleHeadquartersCount').textContent"), 'vehicle organization count rendering is missing');
assert(!html.includes('<th>이용월도</th><th>본부</th><th>부</th><th>팀</th>'), 'driving table still includes organization columns');
assert(!drivingJs.includes('usage${key}Count'), 'driving renderer still writes removed organization cards');
assert(drivingJs.includes('colspan="6"'), 'driving empty row does not match compact table columns');
assert(html.includes('class="vehicle-toolbar driving-vehicle-toolbar"'), 'driving record toolbar layout class is missing');
assert(html.includes('class="driving-list-header"'), 'driving title and search wrapper is missing');
assert(html.indexOf('id="drivingSearch"') < html.indexOf('id="usageMonth"'), 'driving search must appear before the month control');
assert(css.includes('.driving-list-header'), 'driving title and search wrapper styling is missing');
assert(css.includes('.driving-vehicle-toolbar .month-control'), 'driving month control right alignment is missing');
console.log('PASS: driving summary is compact with title-search grouping and right-aligned month control (static).');
