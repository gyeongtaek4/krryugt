const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const app=fs.readFileSync('dist/js/app.js','utf8');
const auth=fs.readFileSync('dist/js/supabase-auth.js','utf8');
const capacity=fs.readFileSync('dist/js/capacity.js','utf8');
const sql=fs.readFileSync('supabase/019_admin_capacity_usage.sql','utf8');

for(const id of ['capacityNavItem','capacityView','refreshCapacity','storageCapacityUsed','storageCapacityRemaining','databaseCapacityUsed','databaseCapacityRemaining','capacityAlertMessage']) {
  assert(html.includes(`id="${id}"`),`missing capacity UI id: ${id}`);
}
assert(html.indexOf('./js/capacity.js')<html.indexOf('./js/supabase-auth.js'),'capacity script must load before session initialization');
assert(app.includes("'용량확인': 'capacity'"),'capacity route is missing');
assert(app.includes("page === '용량확인'"),'capacity view routing is missing');
assert(auth.includes("capacityNavItem.hidden=role!=='admin'"),'capacity menu must be admin only');
assert(auth.includes('refreshCapacityUsage({announce:true})'),'admin login capacity check is missing');
assert(capacity.includes("rpc('admin_get_capacity_usage')"),'capacity RPC is missing');
assert(capacity.includes('const threshold = 80'),'80% threshold is missing');
assert(capacity.includes('storageLimitBytes = 1024 ** 3'),'Storage free quota is missing');
assert(capacity.includes('databaseLimitBytes = 500 * 1024 ** 2'),'DB free quota is missing');
for(const text of ['create or replace function public.admin_get_capacity_usage()',"public.current_user_role() <> 'admin'",'from storage.objects as objects','pg_database_size(current_database())','grant execute on function public.admin_get_capacity_usage() to authenticated']) {
  assert(sql.includes(text),`missing capacity SQL rule: ${text}`);
}
console.log('PASS: admin capacity view, 80% warning, and protected usage RPC wiring (static).');
