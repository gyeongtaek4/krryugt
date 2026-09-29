const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('dist/index.html', 'utf8');
const config = fs.readFileSync('dist/js/supabase-config.js', 'utf8');
const client = fs.readFileSync('dist/js/supabase-client.js', 'utf8');
const build = fs.readFileSync('scripts/build.cjs', 'utf8');
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

assert(html.includes('@supabase/supabase-js@2'));
assert(html.indexOf('./js/supabase-config.js') < html.indexOf('./js/supabase-client.js'));
assert(html.indexOf('./js/supabase-client.js') < html.indexOf('./js/app.js'));
assert(config.includes('FLEET_SUPABASE_CONFIG'));
assert(!config.includes('supabase.co'), 'Supabase URL must not be hardcoded in the repository config.');
assert(!config.includes('sb_publishable_'), 'Supabase publishable key must not be hardcoded in the repository config.');
assert(client.includes('window.fleetSupabaseClient'));
assert(build.includes('FLEET_SUPABASE_URL'));
assert(build.includes('FLEET_SUPABASE_PUBLISHABLE_KEY'));
assert.equal(vercel.buildCommand, 'node scripts/build.cjs');
console.log('PASS: Supabase library, config, client and app loading order are configured.');
