const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('dist/index.html', 'utf8');
const js = fs.readFileSync('dist/js/app.js', 'utf8');
const drivingJs = fs.readFileSync('dist/js/driving-months.js', 'utf8');

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
console.log('PASS: driving summary is compact and vehicle organization badges are present (static).');
