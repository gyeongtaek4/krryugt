const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('dist/js/app.js', 'utf8');
const fn = source.slice(source.indexOf('function vehicleDeleteErrorMessage'), source.indexOf('function parseYearMonth'));
async function check(role, answer, error = null) {
  let deletes = 0, vehicleRefreshes = 0, contractRefreshes = 0;
  const button = { disabled: false };
  const context = {
    document: { getElementById: () => button }, console: { error() {} }, showToast() {},
    refreshVehiclesFromSupabase: async () => vehicleRefreshes++,
    refreshContractsFromSupabase: async () => contractRefreshes++,
    window: { fleetCurrentUser: {}, prompt: () => answer, fleetSupabaseClient: {
      rpc: async (name) => {
        if (name === 'current_user_role') return { data: role };
        deletes++;
        return { data: [{ deleted_vehicle_count: 1500, deleted_contract_count: 12, deleted_driving_record_count: 30 }], error };
      },
      from: () => ({ select: async () => ({ count: 1500 }) })
    } }
  };
  vm.createContext(context);
  vm.runInContext(fn, context);
  await context.deleteAllVehicles();
  assert.equal(button.disabled, false);
  return { deletes, vehicleRefreshes, contractRefreshes };
}
(async () => {
  assert.deepEqual(await check('viewer', '전체삭제'), { deletes: 0, vehicleRefreshes: 0, contractRefreshes: 0 });
  assert.deepEqual(await check('admin', null), { deletes: 0, vehicleRefreshes: 0, contractRefreshes: 0 });
  assert.deepEqual(await check('admin', 'wrong'), { deletes: 0, vehicleRefreshes: 0, contractRefreshes: 0 });
  assert.deepEqual(await check('admin', '전체삭제'), { deletes: 1, vehicleRefreshes: 1, contractRefreshes: 1 });
  assert.deepEqual(await check('admin', '전체삭제', { code: 'P0001', message: '인수인계 이력이 연결된 차량은 삭제할 수 없습니다.' }), { deletes: 1, vehicleRefreshes: 0, contractRefreshes: 0 });
  console.log('PASS: permission, cancellation, administrator RPC deletion and preserved-history failure flows (mock only).');
})().catch(error => { console.error(error); process.exitCode = 1; });
