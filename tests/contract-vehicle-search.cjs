const fs = require('node:fs');
const assert = require('node:assert/strict');

const dialogs = fs.readFileSync('dist/js/dialogs.js', 'utf8');
const app = fs.readFileSync('dist/js/app.js', 'utf8');
const css = fs.readFileSync('dist/css/app.css', 'utf8');

assert(dialogs.includes('id="cfPlate" type="search"'), 'contract plate must be a direct-entry search input');
assert(dialogs.includes('id="contractVehicleSuggestions"'), 'contract vehicle suggestion area is missing');
assert(app.includes('function matchingContractVehicles(query)'), 'contract vehicle matching function is missing');
assert(app.includes("vehicle['차량번호'], vehicle['차종'], vehicle['본부']"), 'vehicle number and related-word search fields are missing');
assert(app.includes('function selectContractVehicle(plate)'), 'contract vehicle selection handler is missing');
assert(app.includes("addEventListener('input', () => { fillContractVehicleFields(); renderContractVehicleSuggestions(); })"), 'contract input search handler is missing');
assert(css.includes('.contract-vehicle-suggestions'), 'contract suggestion styling is missing');

console.log('PASS: direct contract vehicle input and related vehicle suggestions are wired (static).');
