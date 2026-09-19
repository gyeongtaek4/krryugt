const fs=require('node:fs'),assert=require('node:assert/strict');
const sql=fs.readFileSync('supabase/005_handovers.sql','utf8');
const js=fs.readFileSync('dist/js/handover.js','utf8');

for(const text of [
  'create table if not exists public.vehicle_handovers',
  "values ('handover-photos','handover-photos',false",
  "'application/pdf'",
  'jsonb_array_length(photo_paths) between 1 and 6',
  "public.current_user_role() in ('admin','editor')",
  'revoke all on public.vehicle_handovers from anon'
]) assert(sql.includes(text),`SQL missing: ${text}`);

for(const text of [
  "from('vehicle_handovers').select('*')",
  "from('vehicle_handovers').insert",
  "storage.from('handover-photos').upload",
  'createSignedUrls',
  'window.refreshHandoverFromSupabase=refreshHandoverFromSupabase'
]) assert(js.includes(text),`client missing: ${text}`);

console.log('PASS: handover table, private photo bucket, RLS and client persistence wiring (static).');
