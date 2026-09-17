const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('dist/index.html', 'utf8');
const config = fs.readFileSync('dist/js/supabase-config.js', 'utf8');
const client = fs.readFileSync('dist/js/supabase-client.js', 'utf8');

assert(html.includes('@supabase/supabase-js@2'));
assert(html.indexOf('./js/supabase-config.js') < html.indexOf('./js/supabase-client.js'));
assert(html.indexOf('./js/supabase-client.js') < html.indexOf('./js/app.js'));
assert(config.includes('FLEET_SUPABASE_CONFIG'));
assert(client.includes('window.fleetSupabaseClient'));
console.log('PASS: Supabase library, config, client and app loading order are configured.');
