const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('dist/js/app.js', 'utf8');
async function check(role, all, answer) {
  const button = { disabled: false };
  let calls = 0, refreshed = 0, target;
  const query = { not: async () => { target = 'all'; return { count: 2 }; }, eq: async (_, id) => { target = id; return { count: 1 }; } };
  const context = { document: { getElementById: () => button }, showToast() {}, console,
    contractData: [{ _supabaseId: 'contract-1' }], refreshContractsFromSupabase: async () => refreshed++,
    window: { fleetCurrentUser: {}, prompt: () => answer, confirm: () => answer,
      fleetSupabaseClient: { rpc: async () => ({ data: role }), from: () => ({ select: async () => ({ count: 2 }), delete: () => { calls++; return query; } }) } }
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('async function deleteContracts('), source.indexOf('function parseYearMonth')), context);
  await context.deleteContracts(all, 0);
  assert.equal(button.disabled, false);
  return { calls, refreshed, target };
}
(async () => {
  assert.equal((await check('viewer', true, '전체삭제')).calls, 0);
  assert.equal((await check('admin', true, null)).calls, 0);
  assert.equal((await check('admin', false, false)).calls, 0);
  assert.equal((await check('admin', false, true)).target, 'contract-1');
  assert.equal((await check('admin', true, '전체삭제')).target, 'all');
  const selects = [{ value: '가', dataset: { fieldFilter: '담당자(정)' } }, { value: '서울', dataset: { fieldFilter: '지역' } }];
  const context = { document: { querySelectorAll: () => selects } };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function fieldFilterValue'), source.indexOf('function setSelectOptions')), context);
  assert.equal(context.matchesFieldFilters('vehiclesView', { '담당자(정)': '가', '지역': '서울' }), true);
  assert.equal(context.matchesFieldFilters('vehiclesView', { '담당자(정)': '가', '지역': '부산' }), false);
  context.resetFieldFilters('vehiclesView');
  assert.ok(selects.every(select => !select.value));
  console.log('PASS: combined filters, reset, contract deletion permission/cancel/scope (mock only).');
})().catch(error => { console.error(error); process.exitCode = 1; });
