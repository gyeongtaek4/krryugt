const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('dist/js/app.js', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');
const dialogs = fs.readFileSync('dist/js/dialogs.js', 'utf8');
const sql = fs.readFileSync('supabase/018_vehicle_cc.sql', 'utf8');

assert(js.includes("const requiredColumns = ['본부', '부', '팀', 'CC', '담당자(정)'"), 'vehicle CC column is missing from upload/template columns');
assert(js.includes("const contractColumns = ['본부', '부', '팀', 'CC', '담당자(정)'"), 'contract CC column is missing');
assert(js.includes("'CC': row.cc || ''"), 'Supabase vehicle CC read mapping is missing');
assert(js.includes("cc: row['CC']"), 'Supabase vehicle CC write mapping is missing');
assert(js.includes("cfCc: 'CC'"), 'contract vehicle CC auto-fill is missing');
assert(html.includes('<th>팀</th><th>CC</th><th>담당자(정)</th>'), 'vehicle/contract table CC placement is missing');
assert(dialogs.includes('for="vfCc">CC *</label><input id="vfCc" required'), 'vehicle CC direct input is missing');
assert(dialogs.includes('for="cfCc">CC *</label><input id="cfCc" required'), 'contract CC display field is missing');
assert(sql.includes("add column if not exists cc text not null default ''"), 'vehicle cc migration is missing');

console.log('PASS: vehicle CC column, upload/template, contract vehicle mapping and Supabase migration (static).');
