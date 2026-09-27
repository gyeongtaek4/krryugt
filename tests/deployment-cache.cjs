const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('dist/js/app.js','utf8');
const handover=fs.readFileSync('dist/js/handover.js','utf8');
const knowledge=fs.readFileSync('dist/js/knowledge.js','utf8');
const capacity=fs.readFileSync('dist/js/capacity.js','utf8');
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));

assert.equal(vercel.headers?.[0]?.source,'/(.*)','all deployment files must use the same cache rule');
assert.equal(vercel.headers?.[0]?.headers?.[0]?.key,'Cache-Control');
assert.match(vercel.headers?.[0]?.headers?.[0]?.value || '',/no-store/,'deployment files must not mix stale HTML and JavaScript');
assert(app.includes("document.getElementById('expandDashboardDepartments')?.addEventListener"));
assert(app.includes("document.getElementById('collapseDashboardDepartments')?.addEventListener"));
assert(handover.includes("handoverEl('handoverPagination')?.addEventListener"));
assert(knowledge.includes("el(id)?.addEventListener"));
assert(capacity.includes("document.getElementById('refreshCapacity')?.addEventListener"));
console.log('PASS: deployment cache policy and mixed-version event guards are wired (static).');
