const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const js=fs.readFileSync('dist/js/handover.js','utf8');
const sql=fs.readFileSync('supabase/017_author_manage_accidents_handovers.sql','utf8');

assert(html.includes('<th>관리</th>'));
for(const text of [
  'data-handover-edit',
  'data-handover-delete',
  'canManageHandover',
  "from('vehicle_handovers').update(values)",
  "from('vehicle_handovers').delete()",
  "storage.from('handover-photos').remove(paths)",
  "handoverDeleteConfirm').value.trim()!=='삭제'"
]) assert(js.includes(text),`missing author/admin management UI rule: ${text}`);
for(const text of [
  'handovers_update_author_or_admin',
  'handovers_delete_author_or_admin',
  'vehicle_accidents_update_author_or_admin',
  'vehicle_accidents_delete_author_or_admin',
  'created_by=auth.uid()',
  "public.current_user_role()='admin'",
]) assert(sql.includes(text),`missing author/admin RLS rule: ${text}`);
console.log('PASS: author/admin handover edit/delete UI and RLS policy wiring (static).');
