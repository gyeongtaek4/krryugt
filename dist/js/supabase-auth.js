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
      const [{ data: profile, error: profileError }, { data: roleValue, error: roleError }] = await Promise.all([
        window.fleetSupabaseClient.from('profiles').select('display_name, role').eq('id', session.user.id).maybeSingle(),
        window.fleetSupabaseClient.rpc('current_user_role')
      ]);
      if (profileError) console.warn('프로필 조회 오류', profileError);
      if (roleError) console.warn('역할 조회 오류', roleError);
      // 프로필 표의 실제 역할을 우선 사용하고, 프로필 조회가 제한될 때만 RPC 결과를 사용합니다.
      const role = profile?.role || roleValue;
      window.fleetCurrentRole = role || 'viewer';
      userName.textContent = profile?.display_name || session.user.email || '로그인 사용자';
      userRole.textContent = role === 'admin' ? '관리자' : role === 'editor' ? '입력자' : '조회자';
      if (window.refreshVehiclesFromSupabase) await window.refreshVehiclesFromSupabase();
      if (window.refreshDrivingFromSupabase) {
        try { await window.refreshDrivingFromSupabase(); }
        catch (loadError) { showToast(loadError.message); }
      }
      if (window.refreshHandoverFromSupabase) {
        try { await window.refreshHandoverFromSupabase(); }
        catch (loadError) { showToast(loadError.message); }
      }
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
