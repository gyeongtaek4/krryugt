const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const js=fs.readFileSync('dist/js/handover.js','utf8');
const sql=fs.readFileSync('supabase/010_handover_admin_manage.sql','utf8');

assert(html.includes('<th>관리</th>'));
for(const text of [
  'data-handover-edit',
  'data-handover-delete',
  "window.fleetCurrentRole === 'admin'",
  "from('vehicle_handovers').update(values)",
  "from('vehicle_handovers').delete()",
  "storage.from('handover-photos').remove(paths)",
  "handoverDeleteConfirm').value.trim()!=='삭제'"
]) assert(js.includes(text),`missing admin management UI rule: ${text}`);
for(const text of [
  'handovers_update_admin',
  'handovers_delete_admin',
  "public.current_user_role()='admin'",
  'handover_photos_delete_owner',
  "owner_id=auth.uid()::text or public.current_user_role()='admin'"
]) assert(sql.includes(text),`missing admin RLS rule: ${text}`);
console.log('PASS: admin-only handover edit/delete UI and RLS policy wiring (static).');
