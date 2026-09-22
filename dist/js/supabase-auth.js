(() => {
  const gate = document.getElementById('authGate');
  const form = document.getElementById('authForm');
  const email = document.getElementById('authEmail');
  const password = document.getElementById('authPassword');
  const passwordConfirm = document.getElementById('authPasswordConfirm');
  const displayName = document.getElementById('authDisplayName');
  const error = document.getElementById('authError');
  const title = document.getElementById('authTitle');
  const copy = document.getElementById('authCopy');
  const submit = document.getElementById('authSubmit');
  const loginModeButton = document.getElementById('authModeLogin');
  const signupModeButton = document.getElementById('authModeSignup');
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const logout = document.getElementById('logoutButton');
  const memberNavItem = document.getElementById('memberNavItem');
  let mode = 'login';
  if (!gate || !form) return;

  function setMode(nextMode) {
    mode=nextMode;error.textContent='';error.classList.remove('success');
    const signup=mode==='signup';
    document.querySelectorAll('.auth-signup-field').forEach(item=>item.hidden=!signup);
    displayName.required=signup;passwordConfirm.required=signup;
    password.autocomplete=signup?'new-password':'current-password';
    title.textContent=signup?'직원 회원가입':'법인차량 관리';
    copy.textContent=signup?'가입 후 관리자가 계정을 활성화하면 사용할 수 있습니다.':'회사 계정으로 로그인해 주세요.';
    submit.textContent=signup?'가입 신청':'로그인';
    loginModeButton.classList.toggle('active',!signup);signupModeButton.classList.toggle('active',signup);
  }
  loginModeButton.addEventListener('click',()=>setMode('login'));
  signupModeButton.addEventListener('click',()=>setMode('signup'));

  function applyRoleNavigation(role){
    const allowed=role==='viewer'?new Set(['차량 현황','차량인수인계','Q&A','운행가이드']):null;
    document.querySelectorAll('.nav-button').forEach(button=>{
      const visible=!allowed||allowed.has(button.dataset.page);
      button.closest('li').hidden=!visible;
    });
    document.querySelectorAll('.nav-group').forEach(group=>{
      group.hidden=!Array.from(group.querySelectorAll('li')).some(item=>!item.hidden);
    });
    memberNavItem.hidden=role!=='admin';
    const readOnly=role==='viewer';
    ['addVehicleButton','vehicleUploadButton','guideUploadButton','deleteAllVehicles'].forEach(id=>{
      const control = document.getElementById(id);
      if (control) control.hidden=readOnly;
    });
    document.getElementById('vehicleUploadGuide').hidden=readOnly;
    const activePage=document.querySelector('.nav-button.active')?.dataset.page || '대시보드';
    if(readOnly&&!allowed.has(activePage))showView('차량 현황');
  }

  async function applySession(session) {
    window.fleetCurrentUser = session?.user || null;
    window.fleetCurrentRole = 'viewer';
    memberNavItem.hidden=true;
    gate.classList.toggle('hidden', Boolean(session));
    if (session) {
      userName.textContent = session.user.email || '로그인 사용자';
      userRole.textContent = '인증 확인 중';
      const [{ data: profile, error: profileError }, { data: roleValue, error: roleError }] = await Promise.all([
        window.fleetSupabaseClient.from('profiles').select('display_name, role, status').eq('id', session.user.id).maybeSingle(),
        window.fleetSupabaseClient.rpc('current_user_role')
      ]);
      if (profileError) console.warn('프로필 조회 오류', profileError);
      if (roleError) console.warn('역할 조회 오류', roleError);
      if(!profile || profile.status!=='active'){
        const message='비활성화된 계정입니다. 관리자에게 문의하세요.';
        await window.fleetSupabaseClient.auth.signOut();gate.classList.remove('hidden');error.textContent=message;return;
      }
      // 프로필 표의 실제 역할을 우선 사용하고, 프로필 조회가 제한될 때만 RPC 결과를 사용합니다.
      const role = profile?.role || roleValue;
      window.fleetCurrentRole = role || 'viewer';
      userName.textContent = profile?.display_name || session.user.email || '로그인 사용자';
      userRole.textContent = role === 'admin' ? '관리자' : '일반회원';
      applyRoleNavigation(role);
      if (window.refreshVehiclesFromSupabase) {
        let vehiclesLoaded = await window.refreshVehiclesFromSupabase();
        if (!vehiclesLoaded) {
          window.setServerStatus?.('서버 연결을 다시 확인하고 있습니다…', 'warning');
          await new Promise(resolve => setTimeout(resolve, 700));
          vehiclesLoaded = await window.refreshVehiclesFromSupabase();
        }
      }
      if (role!=='viewer'&&window.refreshDrivingFromSupabase) {
        try { await window.refreshDrivingFromSupabase(); }
        catch (loadError) { showToast(loadError.message); }
      }
      if (window.refreshHandoverFromSupabase) {
        try { await window.refreshHandoverFromSupabase(); }
        catch (loadError) { showToast(loadError.message); }
      }
      if (window.refreshKnowledgeFromSupabase) {
        try { await window.refreshKnowledgeFromSupabase(); }
        catch (loadError) { showToast(loadError.message); }
      }
      if(role==='admin'&&window.refreshMembersFromSupabase){
        try{await window.refreshMembersFromSupabase();}catch(loadError){showToast(loadError.message);}
      }
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';error.classList.remove('success');
    if(mode==='signup'){
      const name=displayName.value.trim(),mail=email.value.trim();
      if(!name){error.textContent='이름을 입력해 주세요.';return;}
      if(password.value.length<8){error.textContent='비밀번호는 8자 이상으로 입력해 주세요.';return;}
      if(password.value!==passwordConfirm.value){error.textContent='비밀번호 확인이 일치하지 않습니다.';return;}
      submit.disabled=true;
      const {data,error:signUpError}=await window.fleetSupabaseClient.auth.signUp({email:mail,password:password.value,options:{data:{display_name:name}}});
      submit.disabled=false;
      if(signUpError){error.textContent=signUpError.message.includes('already')?'이미 가입된 이메일입니다.':'회원가입을 완료하지 못했습니다.';return;}
      if(data.session)await window.fleetSupabaseClient.auth.signOut();
      form.reset();setMode('login');error.classList.add('success');
      error.textContent=data.user?.identities?.length===0?'이미 가입된 이메일입니다.':'회원가입이 완료되었습니다. 이메일 확인 후 관리자가 계정을 활성화하면 로그인할 수 있습니다.';
      return;
    }
    const { data, error: signInError } = await window.fleetSupabaseClient.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
    if (signInError) { error.textContent = '이메일 또는 비밀번호를 확인해 주세요.'; return; }
    await applySession(data.session);
  });
  logout.addEventListener('click', () => window.fleetSupabaseClient.auth.signOut());
  window.fleetSupabaseClient.auth.onAuthStateChange((_event, session) => { applySession(session); });
  window.fleetSupabaseClient.auth.getSession().then(({ data }) => applySession(data.session));
})();
