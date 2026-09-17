const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('dist/js/app.js', 'utf8');
const writes = [];
const context = {
  vehicleForPlate: plate => plate.replace(/\s/g, '') === '12가3456' ? { _supabaseId: 'vehicle-1' } : null,
  normalizeYearMonth: value => value,
  contractData: [{ _supabaseId: 'contract-1', _vehicleId: 'vehicle-1', '계약시작': '2026-01', '계약종료': '2026-12', _rentalCompany: 'TEST', _isActive: false }],
  refreshContractsFromSupabase: async () => {},
  window: { fleetCurrentUser: {}, fleetSupabaseClient: { from: () => ({ upsert: async rows => { writes.push(rows); return {}; } }) } }
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function contractSupabasePayload'), source.indexOf('function showToast')), context);
const row = { '차량번호': '12가 3456', '렌탈료': '1,000,000원', '계약시작': '2026-01', '계약종료': '2026-12' };
assert.equal(context.contractSupabasePayload(row).monthly_rental_fee, 1000000);
assert.throws(() => context.contractSupabasePayload({ ...row, '차량번호': 'unknown' }));
assert.throws(() => context.contractSupabasePayload({ ...row, '렌탈료': '-1' }));
assert.throws(() => context.contractSupabasePayload({ ...row, '계약종료': '2025-01' }));
(async () => {
  await assert.rejects(context.saveContractRows([row, row]));
  assert.equal(writes.length, 0);
  await context.saveContractRows([row]);
  assert.equal(writes[0][0].id, 'contract-1');
  assert.equal(writes[0][0].rental_company, 'TEST');
  assert.equal(writes[0][0].is_active, false);
  await context.saveContractRows([{ ...row, '계약시작': '2027-01', '계약종료': '2027-12' }]);
  assert.equal(writes[1][0].id, undefined);
  console.log('PASS: registered vehicle matching, amount/period validation, duplicate blocking and contract history storage (mock).');
})().catch(error => { console.error(error); process.exitCode = 1; });
