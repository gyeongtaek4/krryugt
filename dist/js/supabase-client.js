// app.js보다 먼저 로드되어야 합니다.
if (!window.supabase || !window.FLEET_SUPABASE_CONFIG) {
  throw new Error('Supabase 연결 라이브러리 또는 설정을 찾을 수 없습니다.');
}

const supabaseClient = window.fleetSupabaseClient = window.supabase.createClient(
  window.FLEET_SUPABASE_CONFIG.url,
  window.FLEET_SUPABASE_CONFIG.publishableKey,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
