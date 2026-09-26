const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('dist/index.html', 'utf8');
const js = fs.readFileSync('dist/js/app.js', 'utf8');

assert(!html.includes('id="usageHeadquartersCount"'), 'driving headquarters card remains');
assert(!html.includes('id="usageDivisionCount"'), 'driving division card remains');
assert(!html.includes('id="usageTeamCount"'), 'driving team card remains');
assert(html.includes('id="vehicleHeadquartersCount"'), 'vehicle headquarters badge is missing');
assert(html.includes('id="vehicleDivisionCount"'), 'vehicle division badge is missing');
assert(html.includes('id="vehicleTeamCount"'), 'vehicle team badge is missing');
assert(js.includes("document.getElementById('vehicleHeadquartersCount').textContent"), 'vehicle organization count rendering is missing');
console.log('PASS: driving summary is compact and vehicle organization badges are present (static).');
