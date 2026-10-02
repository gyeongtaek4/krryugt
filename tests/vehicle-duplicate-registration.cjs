const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const source = fs.readFileSync('dist/js/app.js', 'utf8');
const start = source.indexOf('function vehicleNumberKey');
const end = source.indexOf('function vehicleSupabasePayload');
assert(start >= 0 && end > start, 'vehicle duplicate validation functions are missing');

const context = {
  vehicleData: [
    { _supabaseId: 'one', '차량번호': '12가 3456' },
    { _supabaseId: 'two', '차량번호': '34나5678' }
  ],
  normalizePlate: value => String(value || '').replace(/\s/g, '').toUpperCase(),
  Error,
  Map
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);

assert.throws(() => context.assertNoDuplicateVehicleNumber('12가3456'), /이미 등록/);
assert.doesNotThrow(() => context.assertNoDuplicateVehicleNumber('12가3456', 0));
assert.throws(() => context.assertNoDuplicateVehicleNumbersInFile([
  { '차량번호': '88다 9999' }, { '차량번호': '88다9999' }
]), /2행과 중복/);
assert.doesNotThrow(() => context.assertNoDuplicateVehicleNumbersInFile([
  { '차량번호': '88다9999' }, { '차량번호': '77라8888' }
]));

console.log('PASS: direct vehicle save and uploaded file duplicates are blocked by normalized vehicle number (mock).');
