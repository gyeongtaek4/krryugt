const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('dist/js/app.js', 'utf8');
const fn = source.slice(source.indexOf('async function deleteAllVehicles()'), source.indexOf('function parseYearMonth(value)'));
async function check(role, answer, error = null) {
  let deletes = 0, refreshes = 0;
  const button = { disabled: false };
  const context = {
    document: { getElementById: () => button }, console: { error() {} }, showToast() {},
    refreshVehiclesFromSupabase: async () => refreshes++,
    window: { fleetCurrentUser: {}, prompt: () => answer, fleetSupabaseClient: {
      rpc: async () => ({ data: role }),
      from: () => ({ select: async () => ({ count: 1500 }), delete: () => {
        deletes++;
        return { not: async () => ({ count: 1500, error }) };
      } })
    } }
  };
  vm.createContext(context);
  vm.runInContext(fn, context);
  await context.deleteAllVehicles();
  assert.equal(button.disabled, false);
  return { deletes, refreshes };
}
(async () => {
  assert.deepEqual(await check('viewer', '전체삭제'), { deletes: 0, refreshes: 0 });
  assert.deepEqual(await check('admin', null), { deletes: 0, refreshes: 0 });
  assert.deepEqual(await check('admin', 'wrong'), { deletes: 0, refreshes: 0 });
  assert.deepEqual(await check('admin', '전체삭제'), { deletes: 1, refreshes: 1 });
  assert.deepEqual(await check('admin', '전체삭제', { code: '23503' }), { deletes: 1, refreshes: 0 });
  console.log('PASS: permission, cancellation, full deletion and foreign-key failure flows (mock only).');
})().catch(error => { console.error(error); process.exitCode = 1; });
