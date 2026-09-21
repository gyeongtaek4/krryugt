const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const js=fs.readFileSync('dist/js/handover.js','utf8');
const app=fs.readFileSync('dist/js/app.js','utf8');
const sql=fs.readFileSync('supabase/008_handover_recipient_consent.sql','utf8');

for(const id of ['handoverToUser','handoverHistorySearch']) assert(html.includes(`id="${id}"`),`missing ${id}`);
assert(html.includes('인수 동의'));
assert(js.includes("rpc('active_handover_recipients')"));
assert(js.includes("rpc('confirm_vehicle_handover'"));
assert(js.includes('received_by_user_id:record.recipientUserId'));
assert(js.includes('recipient_confirmed_by'));
assert(js.includes('canConfirmHandover'));
assert(app.includes('window.refreshHandoverRecipients'));
for(const text of [
  'received_by_user_id uuid',
  'consent_status text',
  'recipient_confirmed_at timestamptz',
  'recipient_confirmed_by uuid',
  'create or replace function public.active_handover_recipients()',
  'create or replace function public.confirm_vehicle_handover(p_handover_id uuid)',
  'received_by_user_id=auth.uid()',
  "consent_status='pending'"
]) assert(sql.includes(text),`missing SQL consent rule: ${text}`);
console.log('PASS: designated recipient consent UI and SQL access rules (static).');
