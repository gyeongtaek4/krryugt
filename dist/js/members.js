(() => {
  const rows=document.getElementById('memberRows'),summary=document.getElementById('memberSummary'),search=document.getElementById('memberSearch');
  if(!rows||!summary||!search)return;
  const roleLabel={admin:'관리자',viewer:'일반회원'};
  const statusLabel={pending:'승인대기',active:'활성',disabled:'비활성'};
  let members=[];

  function statusOrder(status){return ({pending:0,disabled:1,active:2})[status]??3;}
  function visibleMembers(){
    const keyword=search.value.trim().toLocaleLowerCase('ko-KR');
    return members.filter(item=>!keyword||[item.display_name,item.email,roleLabel[item.role],statusLabel[item.status]].some(value=>String(value||'').toLocaleLowerCase('ko-KR').includes(keyword)))
      .sort((a,b)=>statusOrder(a.status)-statusOrder(b.status)||String(b.created_at||'').localeCompare(String(a.created_at||'')));
  }

  function renderMembers(){
    const pending=members.filter(item=>item.status==='pending').length;
    const disabledCount=members.filter(item=>item.status==='disabled').length;
    const filtered=visibleMembers();
    summary.textContent=`전체 ${members.length}명 · 승인대기 ${pending}명 · 비활성 ${disabledCount}명`;
    rows.innerHTML=filtered.map(item=>{
      const self=item.id===window.fleetCurrentUser?.id,disabled=self?' disabled':'';
      return `<tr class="member-status-${escapeHtml(item.status||'')}" data-member-id="${escapeHtml(item.id)}"><td><input class="member-name" maxlength="50" value="${escapeHtml(item.display_name||'')}"></td><td>${escapeHtml(item.email||'')}</td><td>${escapeHtml(String(item.created_at||'').slice(0,10))}</td><td><select class="member-role"${disabled}>${Object.entries(roleLabel).map(([value,label])=>`<option value="${value}"${item.role===value?' selected':''}>${label}</option>`).join('')}</select></td><td><select class="member-status"${disabled}>${Object.entries(statusLabel).map(([value,label])=>`<option value="${value}"${item.status===value?' selected':''}>${label}</option>`).join('')}</select></td><td><button class="row-edit member-save">저장</button>${self?'<small class="member-self">내 계정</small>':''}</td></tr>`;
    }).join('')||`<tr><td colspan="6" class="empty-table">${members.length?'조회 조건에 맞는 회원이 없습니다.':'가입한 회원이 없습니다.'}</td></tr>`;
  }

  async function refreshMembersFromSupabase(){
    if(window.fleetCurrentRole!=='admin')throw Error('관리자만 회원관리를 사용할 수 있습니다.');
    const {data,error}=await window.fleetSupabaseClient.from('profiles').select('id,email,display_name,role,status,created_at').order('created_at',{ascending:false});
    if(error)throw Error('회원목록을 불러오지 못했습니다. 006_members.sql 실행이 필요할 수 있습니다.');
    members=data||[];renderMembers();
  }
  window.refreshMembersFromSupabase=refreshMembersFromSupabase;
  search.addEventListener('input',renderMembers);

  rows.addEventListener('click',async event=>{
    const button=event.target.closest('.member-save');if(!button)return;
    const row=button.closest('[data-member-id]'),id=row.dataset.memberId,name=row.querySelector('.member-name').value.trim();
    const role=row.querySelector('.member-role').value,status=row.querySelector('.member-status').value;
    if(!name){showToast('회원 이름을 입력하세요.');return;}
    button.disabled=true;
    const {error}=await window.fleetSupabaseClient.rpc('admin_update_profile',{p_user_id:id,p_display_name:name,p_role:role,p_status:status});
    button.disabled=false;
    if(error){showToast(error.message||'회원정보를 저장하지 못했습니다.');return;}
    await refreshMembersFromSupabase();showToast('회원정보를 저장했습니다.');
  });
})();
