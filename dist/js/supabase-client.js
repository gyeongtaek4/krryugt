// app.js보다 먼저 로드되어야 합니다.
if (!window.supabase || !window.FLEET_SUPABASE_CONFIG) {
  throw new Error('Supabase 연결 라이브러리 또는 설정을 찾을 수 없습니다.');
}

const supabaseClient = window.fleetSupabaseClient = window.supabase.createClient(
  window.FLEET_SUPABASE_CONFIG.url,
  window.FLEET_SUPABASE_CONFIG.publishableKey,
  // 로그인 정보는 탭 세션 저장소에만 보관하고, 다른 탭으로 로그인·로그아웃 신호를 전파하지 않는다.
  { auth: { persistSession: true, autoRefreshToken: true, storage: window.sessionStorage, multiTab: false } }
);
