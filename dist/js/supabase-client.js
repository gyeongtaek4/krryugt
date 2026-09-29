// app.js보다 먼저 로드되어야 합니다.
if (!window.supabase || !window.FLEET_SUPABASE_CONFIG) {
  throw new Error('Supabase 연결 라이브러리 또는 설정을 찾을 수 없습니다.');
}

// 새 탭마다 다른 인증 저장소 이름을 만든다. sessionStorage라서 새로고침은 유지되고,
// 다른 탭의 로그인·로그아웃은 현재 탭 세션에 영향을 주지 않는다.
const tabAuthIdKey = 'fleet-auth-tab-id-v2';
let tabAuthId = window.sessionStorage.getItem(tabAuthIdKey);
if (!tabAuthId) {
  tabAuthId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(tabAuthIdKey, tabAuthId);
}
const tabAuthStorageKey = `fleet-auth-${tabAuthId}`;

const supabaseClient = window.fleetSupabaseClient = window.supabase.createClient(
  window.FLEET_SUPABASE_CONFIG.url,
  window.FLEET_SUPABASE_CONFIG.publishableKey,
  // 로그인 정보는 탭 세션 저장소에만 보관하고, 다른 탭으로 로그인·로그아웃 신호를 전파하지 않는다.
  { auth: { persistSession: true, autoRefreshToken: true, storage: window.sessionStorage, storageKey: tabAuthStorageKey, multiTab: false } }
);
