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
  const resendConfirmation = document.getElementById('authResendConfirmation');
  const loginModeButton = document.getElementById('authModeLogin');
  const signupModeButton = document.getElementById('authModeSignup');
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const logout = document.getElementById('logoutButton');
  const memberNavItem = document.getElementById('memberNavItem');
  const capacityNavItem = document.getElementById('capacityNavItem');
  const idleLogoutMs = 10 * 60 * 1000;
  let idleLogoutTimer = null;
  let idleLogoutInProgress = false;
  let mode = 'login';
  if (!gate || !form) return;

  function isCompanyEmail(value) {
    return /^[^\s@]+@fujifilm\.com$/i.test(String(value || '').trim());
  }
  function emailRedirectUrl() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function stopIdleLogoutTimer() {
    if (idleLogoutTimer) window.clearTimeout(idleLogoutTimer);
    idleLogoutTimer = null;
  }
  function resetIdleLogoutTimer() {
    if (!window.fleetCurrentUser || idleLogoutInProgress) return;
    stopIdleLogoutTimer();
    idleLogoutTimer = window.setTimeout(async () => {
      if (!window.fleetCurrentUser || idleLogoutInProgress) return;
      idleLogoutInProgress = true;
      stopIdleLogoutTimer();
      await window.fleetSupabaseClient.auth.signOut({ scope: 'local' });
      error.textContent = '10분 동안 사용하지 않아 자동 로그아웃되었습니다.';
      idleLogoutInProgress = false;
    }, idleLogoutMs);
  }

  function setMode(nextMode) {
    mode=nextMode;error.textContent='';error.classList.remove('success');
    const signup=mode==='signup';
    if (resendConfirmation) {
      resendConfirmation.hidden = signup;
      resendConfirmation.textContent = '인증 메일 다시 보내기';
    }
    document.querySelectorAll('.auth-signup-field').forEach(item=>item.hidden=!signup);
    displayName.required=signup;passwordConfirm.required=signup;
    password.autocomplete=signup?'new-password':'current-password';
    title.textContent=signup?'직원 회원가입':'법인차량 관리';
    copy.textContent=signup?'후지필름 이메일 인증과 관리자 활성화 후 사용할 수 있습니다.':'회사 계정으로 로그인해 주세요.';
    submit.textContent=signup?'가입 신청':'로그인';
    loginModeButton.classList.toggle('active',!signup);signupModeButton.classList.toggle('active',signup);
  }
  loginModeButton.addEventListener('click',()=>setMode('login'));
  signupModeButton.addEventListener('click',()=>setMode('signup'));

  function applyRoleNavigation(role){
    const allowed=role==='viewer'?new Set(['차량 현황','사고접수 및 이력','차량인수인계','Q&A','운행가이드']):null;
    document.querySelectorAll('.nav-button').forEach(button=>{
      const visible=!allowed||allowed.has(button.dataset.page);
      button.closest('li').hidden=!visible;
    });
    document.querySelectorAll('.nav-group').forEach(group=>{
      group.hidden=!Array.from(group.querySelectorAll('li')).some(item=>!item.hidden);
    });
    memberNavItem.hidden=role!=='admin';
    capacityNavItem.hidden=role!=='admin';
    const readOnly=role==='viewer';
    document.body.classList.toggle('viewer-role',readOnly);
    ['addVehicleButton','vehicleUploadButton','guideUploadButton','deleteAllVehicles'].forEach(id=>{
      const control = document.getElementById(id);
      if (control) control.hidden=readOnly;
    });
    const activePage=document.querySelector('.nav-button.active')?.dataset.page || '대시보드';
    if(readOnly&&!allowed.has(activePage))showView('차량 현황');
  }

  async function applySession(session) {
    window.fleetCurrentUser = session?.user || null;
    window.fleetCurrentRole = 'viewer';
    memberNavItem.hidden=true;
    gate.classList.toggle('hidden', Boolean(session));
    if (!session) { window.fleetCurrentDisplayName=''; stopIdleLogoutTimer(); return; }
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
      window.fleetCurrentDisplayName = profile?.display_name || session.user.user_metadata?.display_name || session.user.email || '로그인 사용자';
      userName.textContent = window.fleetCurrentDisplayName;
      userRole.textContent = role === 'admin' ? '관리자' : '일반회원';
      applyRoleNavigation(role);
      window.syncHandoverFrom?.();
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
      if (window.refreshAccidentsFromSupabase) {
        try { await window.refreshAccidentsFromSupabase(); }
        catch (loadError) { showToast(loadError.message); }
      }
      if (window.refreshKnowledgeFromSupabase) {
        try { await window.refreshKnowledgeFromSupabase(); }
        catch (loadError) { showToast(loadError.message); }
      }
      if(role==='admin'&&window.refreshMembersFromSupabase){
        try{await window.refreshMembersFromSupabase();}catch(loadError){showToast(loadError.message);}
      }
      if(role==='admin'&&window.refreshCapacityUsage){
        try{await window.refreshCapacityUsage({announce:true});}catch(loadError){console.warn('용량 사용량 조회 오류',loadError);}
      }
      resetIdleLogoutTimer();
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';error.classList.remove('success');
    if(mode==='signup'){
      const name=displayName.value.trim(),mail=email.value.trim();
      if(!name){error.textContent='이름을 입력해 주세요.';return;}
      if(!isCompanyEmail(mail)){error.textContent='@fujifilm.com 회사 이메일로만 가입할 수 있습니다.';return;}
      if(password.value.length<8){error.textContent='비밀번호는 8자 이상으로 입력해 주세요.';return;}
      if(password.value!==passwordConfirm.value){error.textContent='비밀번호 확인이 일치하지 않습니다.';return;}
      submit.disabled=true;
      const {data,error:signUpError}=await window.fleetSupabaseClient.auth.signUp({email:mail,password:password.value,options:{data:{display_name:name,emailRedirectTo:emailRedirectUrl()}}});
      submit.disabled=false;
      if(signUpError){error.textContent=signUpError.message.includes('already')?'이미 가입된 이메일입니다.':'회원가입을 완료하지 못했습니다.';return;}
      if(data.session)await window.fleetSupabaseClient.auth.signOut();
      form.reset();setMode('login');email.value=mail;error.classList.add('success');
      const existingUser=data.user?.identities?.length===0;
      error.textContent=existingUser?'이미 가입된 이메일입니다. 인증 메일이 필요하면 아래 버튼을 눌러 주세요.':'인증 메일을 보냈습니다. 메일의 링크를 열어 인증한 뒤 관리자가 계정을 활성화하면 로그인할 수 있습니다.';
      if(resendConfirmation) resendConfirmation.hidden=!isCompanyEmail(mail);
      return;
    }
    const { data, error: signInError } = await window.fleetSupabaseClient.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
    if (signInError) {
      const requiresEmailConfirmation = /email not confirmed/i.test(signInError.message || '');
      error.textContent = requiresEmailConfirmation ? '이메일 인증이 필요합니다. 아래 버튼으로 인증 메일을 다시 보내 주세요.' : '이메일 또는 비밀번호를 확인해 주세요.';
      if (requiresEmailConfirmation && resendConfirmation) resendConfirmation.hidden = false;
      return;
    }
    await applySession(data.session);
  });
  resendConfirmation?.addEventListener('click', async () => {
    const mail=email.value.trim();
    error.textContent='';error.classList.remove('success');
    if(!isCompanyEmail(mail)){error.textContent='@fujifilm.com 회사 이메일을 입력해 주세요.';return;}
    resendConfirmation.disabled=true;
    const {error: resendError}=await window.fleetSupabaseClient.auth.resend({type:'signup',email:mail,options:{emailRedirectTo:emailRedirectUrl()}});
    resendConfirmation.disabled=false;
    error.classList.add('success');
    error.textContent=resendError?'인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.':'인증 메일을 다시 보냈습니다. 받은편지함과 스팸함에서 링크를 열어 주세요.';
  });
  logout.addEventListener('click', () => window.fleetSupabaseClient.auth.signOut());
  ['mousemove', 'keydown', 'pointerdown', 'touchstart', 'scroll'].forEach(eventName => {
    window.addEventListener(eventName, resetIdleLogoutTimer, { passive: eventName !== 'keydown' });
  });
  window.fleetSupabaseClient.auth.onAuthStateChange((_event, session) => { applySession(session); });
  window.fleetSupabaseClient.auth.getSession().then(({ data }) => applySession(data.session));
})();
