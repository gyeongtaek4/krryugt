(() => {
  const gate = document.getElementById('authGate');
  const form = document.getElementById('authForm');
  const email = document.getElementById('authEmail');
  const password = document.getElementById('authPassword');
  const error = document.getElementById('authError');
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const logout = document.getElementById('logoutButton');
  if (!gate || !form) return;

  async function applySession(session) {
    window.fleetCurrentUser = session?.user || null;
    gate.classList.toggle('hidden', Boolean(session));
    if (session) {
      userName.textContent = session.user.email || '로그인 사용자';
      userRole.textContent = '인증 확인 중';
      const { data: profile } = await window.fleetSupabaseClient.from('profiles').select('display_name, role').eq('id', session.user.id).maybeSingle();
      userName.textContent = profile?.display_name || session.user.email || '로그인 사용자';
      userRole.textContent = profile?.role === 'admin' ? '관리자' : profile?.role === 'editor' ? '입력자' : '조회자';
      if (window.refreshVehiclesFromSupabase) await window.refreshVehiclesFromSupabase();
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    const { data, error: signInError } = await window.fleetSupabaseClient.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
    if (signInError) { error.textContent = '이메일 또는 비밀번호를 확인해 주세요.'; return; }
    await applySession(data.session);
  });
  logout.addEventListener('click', () => window.fleetSupabaseClient.auth.signOut());
  window.fleetSupabaseClient.auth.onAuthStateChange((_event, session) => { applySession(session); });
  window.fleetSupabaseClient.auth.getSession().then(({ data }) => applySession(data.session));
})();
