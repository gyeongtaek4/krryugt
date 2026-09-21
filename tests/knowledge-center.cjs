const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const js=fs.readFileSync('dist/js/knowledge.js','utf8');
const auth=fs.readFileSync('dist/js/supabase-auth.js','utf8');
const sql=fs.readFileSync('supabase/011_knowledge_center.sql','utf8');

for(const id of ['qnaView','guideView','qnaForm','qnaRows','guideForm','guideRows']) assert(html.includes(`id="${id}"`),`missing ${id}`);
assert(html.includes('data-page="Q&A"'));
assert(html.includes('data-page="운행가이드"'));
for(const text of ['fleet_questions','fleet_guides','fleet-guides','createSignedUrl','storage.from(\'fleet-guides\').download','20 * 1024 * 1024']) assert(js.includes(text),`missing knowledge code: ${text}`);
assert(auth.includes("'Q&A','운행가이드'"));
for(const text of ['create table if not exists public.fleet_questions','create table if not exists public.fleet_guides',"'fleet-guides'","array['application/pdf']",'fleet_questions_manage_admin','fleet_guides_manage_admin','fleet_guides_storage_read_active','fleet_guides_storage_insert_admin','fleet_guides_storage_delete_admin']) assert(sql.includes(text),`missing knowledge SQL: ${text}`);
console.log('PASS: Q&A and PDF guide UI, admin restrictions and SQL policy wiring (static).');
