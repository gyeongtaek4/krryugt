const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('dist/js/app.js', 'utf8');
const css = fs.readFileSync('dist/css/app.css', 'utf8');

assert(js.includes('data-vehicle-summary-filter'), 'vehicle summary items are not interactive filters');
assert(js.includes("function applyVehicleSummaryFilter(key, value)"), 'summary filter application is missing');
assert(js.includes("document.getElementById('teamFilter').value = value"), 'team summary is not connected to the organization filter');
assert(js.includes("fieldSelect.value = value"), 'model or region summary is not connected to a field filter');
assert(js.includes("title.textContent = value ? `${label}: ${value}` : `${label} ▾`;"), 'selected filter value is not visible in table headers');
assert(css.includes('.fleet-summary-pill:hover { transform: scale(1.045);'), 'summary hover animation is missing');
assert(css.includes('.fleet-summary-pill.is-active'), 'active summary style is missing');
console.log('PASS: vehicle summary hover and click-to-filter wiring is present (static).');
