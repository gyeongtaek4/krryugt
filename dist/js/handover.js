/* 인수인계 기록은 Supabase 표, 사진은 비공개 Storage에 저장한다. */
const handoverRecords = [];
let handoverPhotoDraft = [], handoverPhotoLoading = false;
let handoverRecipients = [];
const handoverEl = id => document.getElementById(id);
function refreshHandoverVehicles() {
  const select = handoverEl('handoverVehicle'), selected = select.value;
  select.innerHTML = '<option value="">차량 선택</option>' + vehicleData.map(row =>
    `<option value="${escapeHtml(row['차량번호'])}">${escapeHtml(row['차량번호'])} · ${escapeHtml(row['차종'] || '')}</option>`).join('');
  select.value = selected;
}
function handoverRecipientName(member) {
  return String(member?.display_name || member?.email || '');
}
async function refreshHandoverRecipients() {
  if (!window.fleetCurrentUser || !window.fleetSupabaseClient) return;
  const select = handoverEl('handoverToUser');
  const selected = select.value;
  const { data, error } = await window.fleetSupabaseClient.rpc('active_handover_recipients');
  if (error) throw Error('인수자 목록을 불러오지 못했습니다. 008_handover_recipient_consent.sql 실행이 필요할 수 있습니다.');
  handoverRecipients = data || [];
  select.innerHTML = '<option value="">인수자 계정 선택</option>' + handoverRecipients.map(member =>
    `<option value="${escapeHtml(member.id)}">${escapeHtml(handoverRecipientName(member))} · ${escapeHtml(member.email || '')}</option>`
  ).join('');
  if (handoverRecipients.some(member => member.id === selected)) select.value = selected;
}
window.refreshHandoverRecipients = refreshHandoverRecipients;
function validateHandoverPhotos(photos) {
  if (!Array.isArray(photos) || !photos.length || photos.length > 6) throw Error('외관 사진 또는 PDF를 1~6개 첨부하세요.');
  let bytes = 0;
  for (const photo of photos) {
    if (!photo || typeof photo.name !== 'string' || photo.name.length > 255 ||
      !Number.isSafeInteger(photo.size) || photo.size < 1 || photo.size > 5*1024*1024 ||
      typeof photo.data !== 'string' || !/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data) ||
      photo.data.length > 7*1024*1024) throw Error('첨부파일 형식 또는 크기가 올바르지 않습니다.');
    bytes += Math.max(photo.size, Math.floor(photo.data.split(',')[1].length*3/4));
  }
  if (bytes > 20*1024*1024) throw Error('첨부파일은 총 20MB 이하로 선택하세요.');
}
function mergeHandoverPhotos(current, incoming) {
  const merged=[...current],keys=new Set(current.map(photo=>`${photo.name}\u0000${photo.size}\u0000${photo.lastModified||0}`));
  for(const photo of incoming){
    const key=`${photo.name}\u0000${photo.size}\u0000${photo.lastModified||0}`;
    if(!keys.has(key)){keys.add(key);merged.push(photo);}
  }
  validateHandoverPhotos(merged);
  return merged;
}
function handoverGallery(photos) {
  return photos.map(photo => {
    const url=escapeHtml(photo.data),name=escapeHtml(photo.name),isPdf=photo.type==='application/pdf'||photo.data.startsWith('data:application/pdf')||/\.pdf$/i.test(photo.name);
    return `<figure><a href="${url}" download="${name}">${isPdf?'<span class="handover-pdf">PDF<small>파일 열기</small></span>':`<img src="${url}" alt="${name}">`}</a><figcaption>${name}</figcaption></figure>`;
  }).join('');
}
async function signedHandoverPhotos(paths) {
  if (!paths.length) return [];
  const {data,error}=await window.fleetSupabaseClient.storage.from('handover-photos').createSignedUrls(paths.map(item=>item.path),3600);
  if(error)throw Error('인수인계 사진을 불러오지 못했습니다.');
  return paths.map((item,index)=>({name:item.name,size:item.size,type:item.type||'',data:data[index]?.signedUrl || ''}));
}
async function refreshHandoverFromSupabase() {
  if(!window.fleetCurrentUser || !window.fleetSupabaseClient)return;
  const {data,error}=await window.fleetSupabaseClient.from('vehicle_handovers').select('*').order('created_at',{ascending:false});
  if(error)throw Error('인수인계 자료를 불러오지 못했습니다. 005_handovers.sql 실행이 필요할 수 있습니다.');
  const records=await Promise.all((data||[]).map(async row=>({id:row.id,date:row.handover_date,from:row.handed_over_by,to:row.received_by,
    recipientUserId:row.received_by_user_id,consentStatus:row.consent_status || (row.received_by_user_id ? 'pending' : 'legacy'),
    consentedBy:row.recipient_confirmed_by,consentedName:row.recipient_confirmed_name,consentedAt:row.recipient_confirmed_at,
    condition:row.condition,notes:row.notes,vehicle:row.vehicle_snapshot,photos:await signedHandoverPhotos(row.photo_paths),photoPaths:row.photo_paths,createdAt:row.created_at})));
  handoverRecords.splice(0,handoverRecords.length,...records);renderHandovers();
}
window.refreshHandoverFromSupabase=refreshHandoverFromSupabase;
function handoverFileExtension(data) { return data.startsWith('data:application/pdf')?'pdf':data.startsWith('data:image/png')?'png':data.startsWith('data:image/webp')?'webp':'jpg'; }
async function storeHandover(record,photos) {
  if(!window.fleetCurrentUser || !window.fleetSupabaseClient)throw Error('로그인 후 저장하세요.');
  const uploaded=[];
  try {
    for(let index=0;index<photos.length;index++){
      const photo=photos[index],path=`${window.fleetCurrentUser.id}/${record.id}/${index+1}.${handoverFileExtension(photo.data)}`;
      const blob=await (await fetch(photo.data)).blob();
      const {error}=await window.fleetSupabaseClient.storage.from('handover-photos').upload(path,blob,{contentType:blob.type,upsert:false});
      if(error){
        const reason=error.message||'알 수 없는 Storage 오류';
        if(/mime|content.?type/i.test(reason))throw Error('Supabase 저장소가 이 파일 형식을 허용하지 않습니다. PDF 허용 설정을 확인하세요.');
        throw Error(`외관 자료 저장에 실패했습니다: ${reason}`);
      }
      uploaded.push({path,name:photo.name,size:photo.size,type:photo.type||blob.type});
    }
    const {error}=await window.fleetSupabaseClient.from('vehicle_handovers').insert({id:record.id,vehicle_id:record.vehicleId,
      handover_date:record.date,handed_over_by:record.from,received_by:record.to,condition:record.condition,notes:record.notes,
      vehicle_snapshot:record.vehicle,photo_paths:uploaded,received_by_user_id:record.recipientUserId,
      consent_status:'pending',created_by:window.fleetCurrentUser.id});
    if(error)throw Error(error.message || '인수인계 기록 저장에 실패했습니다.');
  } catch(error) {
    if(uploaded.length)await window.fleetSupabaseClient.storage.from('handover-photos').remove(uploaded.map(item=>item.path));
    throw error;
  }
}
function handoverConsentMarkup(item) {
  const status = item.consentStatus || 'legacy';
  if (status === 'completed') return `<span class="handover-consent complete">${escapeHtml(item.consentedName || '인수자')} 동의 완료</span>`;
  if (status === 'pending') return '<span class="handover-consent pending">인수 동의 대기</span>';
  return '<span class="handover-consent legacy">인수자 계정 미지정</span>';
}
function canConfirmHandover(item) {
  return item.consentStatus === 'pending' && item.recipientUserId === window.fleetCurrentUser?.id;
}
function isHandoverAdmin() {
  return window.fleetCurrentRole === 'admin';
}
function matchingHandovers() {
  const keyword = String(handoverEl('handoverHistorySearch')?.value || '').replace(/\s+/g, '').toUpperCase();
  if (!keyword) return handoverRecords;
  return handoverRecords.filter(item => String(item.vehicle?.['차량번호'] || '').replace(/\s+/g, '').toUpperCase().includes(keyword));
}
function renderHandovers() {
  const records = matchingHandovers();
  handoverEl('handoverRows').innerHTML = records.map(item => {
    const index = handoverRecords.indexOf(item);
    const adminActions = isHandoverAdmin() ? `<button class="row-edit" data-handover-edit="${index}">수정</button><button class="row-delete" data-handover-delete="${index}">삭제</button>` : '';
    return `<tr><td>${escapeHtml(item.date)}</td><td class="plate">${escapeHtml(item.vehicle['차량번호'])}<br>${escapeHtml(item.vehicle['차종'] || '')}</td><td>${escapeHtml(['본부','부','팀'].map(key=>item.vehicle[key] || '').join(' / '))}</td><td>${escapeHtml(item.from)} → ${escapeHtml(item.to)}</td><td>${escapeHtml(item.condition)}</td><td>${handoverConsentMarkup(item)}${canConfirmHandover(item) ? `<button class="row-edit handover-consent-action" data-handover-consent="${index}">인수 동의</button>` : ''}</td><td>${item.photos.length}장</td><td class="handover-management"><button class="row-edit" data-handover-detail="${index}">상세</button>${adminActions}</td></tr>`;
  }).join('') || `<tr><td colspan="8" class="empty-table">${handoverRecords.length ? '조회한 차량번호의 인수인계 이력이 없습니다.' : '등록된 인수인계 기록이 없습니다.'}</td></tr>`;
}
function downloadHandoverArchive() {
  if (!handoverRecords.length) { showToast('저장된 기록이 없습니다.'); return; }
  const records=handoverRecords.map(({photos,photoPaths,...item})=>({...item,photoFiles:(photoPaths||[]).map(({name,size})=>({name,size}))}));
  const url = URL.createObjectURL(new Blob([JSON.stringify({format:'fleet-handover-server-v2',records})],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download='차량인수인계_이력자료.json'; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const handoverNav = document.createElement('li');
handoverNav.innerHTML = '<button class="nav-button" data-page="차량인수인계"><svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16m0 0-4-4m4 4-4 4M20 17H4m0 0 4-4m-4 4 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>차량인수인계</button>';
document.querySelector('.nav-list').appendChild(handoverNav);
handoverNav.querySelector('button').addEventListener('click',()=>{showView('차량인수인계');toggleSidebar(false);});
document.body.insertAdjacentHTML('beforeend', `
  <div class="modal-backdrop" id="handoverManageModal" role="dialog" aria-modal="true" aria-labelledby="handoverManageTitle">
    <div class="modal">
      <div class="modal-header"><div><h2 id="handoverManageTitle">인수인계 수정</h2><p id="handoverManageCopy"></p></div><button class="close-button" id="closeHandoverManage" aria-label="닫기">✕</button></div>
      <form id="handoverManageForm">
        <div class="form-grid">
          <label class="form-field"><span>인계일</span><input id="handoverManageDate" type="date" required></label>
          <label class="form-field"><span>인계자</span><input id="handoverManageFrom" maxlength="80" required></label>
          <label class="form-field"><span>차량 상태</span><select id="handoverManageCondition"><option>확인 필요</option><option>이상 없음</option><option>이상 있음</option></select></label>
          <label class="form-field"><span>특이사항 · 손상 위치</span><textarea id="handoverManageNotes" maxlength="2000"></textarea></label>
        </div>
        <p class="form-hint">차량번호·인수자·외관자료·인수 동의 기록은 수정하지 않습니다.</p>
        <div class="upload-error" id="handoverManageError"></div>
        <div class="modal-actions"><button class="button" type="button" id="cancelHandoverManage">취소</button><button class="button primary" type="submit">수정 저장</button></div>
      </form>
      <form id="handoverDeleteForm" hidden>
        <p class="handover-delete-warning" id="handoverDeleteCopy"></p>
        <label class="form-field"><span>삭제 확인</span><input id="handoverDeleteConfirm" autocomplete="off" placeholder="삭제 입력" required></label>
        <p class="form-hint">기록과 연결된 외관 사진·PDF도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
        <div class="upload-error" id="handoverDeleteError"></div>
        <div class="modal-actions"><button class="button" type="button" id="cancelHandoverDelete">취소</button><button class="button danger" type="submit">삭제하기</button></div>
      </form>
    </div>
  </div>`);
const handoverManageModal=handoverEl('handoverManageModal');
let managedHandoverId='';
function closeHandoverManage() {
  handoverManageModal.classList.remove('open');
  managedHandoverId='';
  handoverEl('handoverManageError').textContent='';
  handoverEl('handoverDeleteError').textContent='';
}
function managedHandover() {
  return handoverRecords.find(item=>item.id===managedHandoverId);
}
function openHandoverEdit(item) {
  if (!isHandoverAdmin()) return;
  managedHandoverId=item.id;
  handoverEl('handoverManageTitle').textContent='인수인계 수정';
  handoverEl('handoverManageCopy').textContent=`${item.vehicle['차량번호']} · ${item.to} 인수 기록의 업무 내용을 수정합니다.`;
  handoverEl('handoverManageDate').value=item.date;
  handoverEl('handoverManageFrom').value=item.from;
  handoverEl('handoverManageCondition').value=item.condition;
  handoverEl('handoverManageNotes').value=item.notes || '';
  handoverEl('handoverManageForm').hidden=false;
  handoverEl('handoverDeleteForm').hidden=true;
  handoverManageModal.classList.add('open');
  handoverEl('handoverManageDate').focus();
}
function openHandoverDelete(item) {
  if (!isHandoverAdmin()) return;
  managedHandoverId=item.id;
  handoverEl('handoverManageTitle').textContent='인수인계 삭제';
  handoverEl('handoverManageCopy').textContent='';
  handoverEl('handoverDeleteCopy').textContent=`${item.vehicle['차량번호']} · ${item.date} 인수인계 기록을 삭제합니다.`;
  handoverEl('handoverDeleteConfirm').value='';
  handoverEl('handoverManageForm').hidden=true;
  handoverEl('handoverDeleteForm').hidden=false;
  handoverManageModal.classList.add('open');
  handoverEl('handoverDeleteConfirm').focus();
}
async function updateHandoverRecord(item, values) {
  const {error}=await window.fleetSupabaseClient.from('vehicle_handovers').update(values).eq('id',item.id);
  if(error)throw Error(error.message || '인수인계 수정에 실패했습니다.');
  await refreshHandoverFromSupabase();
}
async function deleteHandoverRecord(item) {
  const {error}=await window.fleetSupabaseClient.from('vehicle_handovers').delete().eq('id',item.id);
  if(error)throw Error(error.message || '인수인계 삭제에 실패했습니다.');
  const paths=(item.photoPaths||[]).map(photo=>photo.path).filter(Boolean);
  if(paths.length){
    const {error:photoError}=await window.fleetSupabaseClient.storage.from('handover-photos').remove(paths);
    if(photoError)showToast('기록은 삭제됐지만 외관 자료 정리에 실패했습니다. 관리자에게 문의하세요.');
  }
  await refreshHandoverFromSupabase();
}
handoverEl('handoverDate').value = new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
handoverEl('handoverVehicle').addEventListener('change',()=>{
  handoverEl('handoverFrom').value = vehicleForPlate(handoverEl('handoverVehicle').value)?.['담당자(정)'] || '';
});
handoverEl('handoverPhotos').addEventListener('change',async event=>{
  const input=event.target, files=Array.from(input.files);
  handoverPhotoLoading=true; handoverEl('handoverSave').disabled=true; handoverEl('handoverError').textContent='';
  try {
    if (!files.length) return;
    if (files.some(file=>!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type) || file.size>5*1024*1024)) throw Error('JPG/PNG/WebP/PDF, 파일당 5MB 이하 자료를 선택하세요.');
    const photos=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{
      const reader=new FileReader(); reader.onload=()=>resolve({name:file.name,size:file.size,type:file.type,lastModified:file.lastModified,data:reader.result}); reader.onerror=()=>reject(Error('첨부파일을 읽지 못했습니다.')); reader.readAsDataURL(file);
    })));
    const merged=mergeHandoverPhotos(handoverPhotoDraft,photos);
    if(merged.length===handoverPhotoDraft.length)throw Error('이미 추가된 파일입니다.');
    handoverPhotoDraft=merged;handoverEl('handoverPreview').innerHTML=handoverGallery(merged);
  } catch(error) {handoverEl('handoverError').textContent=error.message;}
  finally {input.value='';handoverPhotoLoading=false;handoverEl('handoverSave').disabled=false;}
});
handoverEl('handoverForm').addEventListener('submit',async event=>{
  event.preventDefault(); handoverEl('handoverError').textContent='';
  try {
    if(handoverPhotoLoading)throw Error('사진을 읽는 중입니다.');
    const vehicle=vehicleForPlate(handoverEl('handoverVehicle').value);
    if(!vehicle)throw Error('등록된 차량을 선택하세요.');
    const from=handoverEl('handoverFrom').value.trim(),recipient=handoverRecipients.find(member=>member.id===handoverEl('handoverToUser').value),to=handoverRecipientName(recipient),condition=handoverEl('handoverCondition').value,notes=handoverEl('handoverNotes').value.trim();
    if(!from||!recipient||!to||from===to)throw Error('서로 다른 인계자와 활성 인수자 계정을 선택하세요.');
    if(condition==='이상 있음'&&!notes)throw Error('이상이 있는 위치와 내용을 입력하세요.');
    validateHandoverPhotos(handoverPhotoDraft);
    const record={id:crypto.randomUUID(),vehicleId:vehicle._supabaseId,recipientUserId:recipient.id,date:handoverEl('handoverDate').value,from,to,condition,notes,
      vehicle:Object.fromEntries(['차량번호','차종','본부','부','팀','담당자(정)','담당자(부)'].map(key=>[key,String(vehicle[key]||'')])),
      createdAt:new Date().toISOString()};
    handoverEl('handoverSave').disabled=true;await storeHandover(record,handoverPhotoDraft);await refreshHandoverFromSupabase();
    handoverPhotoDraft=[];handoverEl('handoverPhotos').value='';handoverEl('handoverPreview').innerHTML='';
    handoverEl('handoverToUser').value='';handoverEl('handoverNotes').value='';handoverEl('handoverCondition').value='확인 필요';
    showToast('인수인계 기록을 저장했습니다. 인수자 동의 후 완료됩니다.');
  }catch(error){handoverEl('handoverError').textContent=error.message;}
  finally{handoverEl('handoverSave').disabled=false;}
});
handoverEl('handoverHistorySearch').addEventListener('input',renderHandovers);
async function confirmHandover(item) {
  const { error } = await window.fleetSupabaseClient.rpc('confirm_vehicle_handover',{p_handover_id:item.id});
  if (error) throw Error(error.message || '인수 동의 처리에 실패했습니다.');
  await refreshHandoverFromSupabase();
  showToast('인수 동의가 완료되었습니다. 동의자 이름·ID·시각이 기록되었습니다.');
}
function formatConsentDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ko-KR');
}
function maskedMemberId(id) {
  const value = String(id || '');
  return value.length > 12 ? `${value.slice(0,8)}…${value.slice(-4)}` : (value || '—');
}
handoverEl('handoverRows').addEventListener('click',async event=>{
  const editButton=event.target.closest('[data-handover-edit]');
  if(editButton){
    const item=handoverRecords[Number(editButton.dataset.handoverEdit)];
    if(item)openHandoverEdit(item);
    return;
  }
  const deleteButton=event.target.closest('[data-handover-delete]');
  if(deleteButton){
    const item=handoverRecords[Number(deleteButton.dataset.handoverDelete)];
    if(item)openHandoverDelete(item);
    return;
  }
  const consentButton=event.target.closest('[data-handover-consent]');
  if(consentButton){
    const item=handoverRecords[Number(consentButton.dataset.handoverConsent)];
    if(!item)return;
    try { consentButton.disabled=true; await confirmHandover(item); }
    catch(error){ showToast(error.message); consentButton.disabled=false; }
    return;
  }
  const button=event.target.closest('[data-handover-detail]');if(!button)return;
  const item=handoverRecords[Number(button.dataset.handoverDetail)];if(!item)return;
  const detail=handoverEl('handoverDetail');detail.hidden=false;
  const consentInfo = item.consentStatus === 'completed'
    ? `인수 동의 완료 · ${item.consentedName || '인수자'} · ${formatConsentDate(item.consentedAt)} · 동의 ID ${maskedMemberId(item.consentedBy)}`
    : item.consentStatus === 'pending'
      ? `인수 동의 대기 · 지정 인수자만 동의할 수 있습니다.${canConfirmHandover(item) ? ' 이 계정으로 동의할 수 있습니다.' : ''}`
      : '인수자 계정 미지정 · 수신자 이름과 일치하는 활성 회원 계정을 확인한 뒤 동의할 수 있습니다.';
  detail.innerHTML=`<h3>${escapeHtml(item.vehicle['차량번호'])} · ${escapeHtml(item.date)}</h3><p>${escapeHtml(item.from)} → ${escapeHtml(item.to)} · ${escapeHtml(item.condition)}</p><p class="handover-notes">${escapeHtml(consentInfo)}</p><p class="handover-notes">${escapeHtml(item.notes || '특이사항 없음')}</p><p class="closing-help">사진 또는 PDF를 누르면 원본을 내려받습니다.</p><div class="handover-gallery">${handoverGallery(item.photos)}</div>`;
});
handoverEl('closeHandoverManage').addEventListener('click',closeHandoverManage);
handoverEl('cancelHandoverManage').addEventListener('click',closeHandoverManage);
handoverEl('cancelHandoverDelete').addEventListener('click',closeHandoverManage);
handoverManageModal.addEventListener('click',event=>{if(event.target===handoverManageModal)closeHandoverManage();});
handoverEl('handoverManageForm').addEventListener('submit',async event=>{
  event.preventDefault();
  try {
    const item=managedHandover();
    if(!item||!isHandoverAdmin())throw Error('관리자만 인수인계 기록을 수정할 수 있습니다.');
    const date=handoverEl('handoverManageDate').value,from=handoverEl('handoverManageFrom').value.trim(),condition=handoverEl('handoverManageCondition').value,notes=handoverEl('handoverManageNotes').value.trim();
    if(!date||!from)throw Error('인계일과 인계자를 입력하세요.');
    if(condition==='이상 있음'&&!notes)throw Error('이상이 있는 위치와 내용을 입력하세요.');
    await updateHandoverRecord(item,{handover_date:date,handed_over_by:from,condition,notes});
    closeHandoverManage();showToast('인수인계 기록을 수정했습니다.');
  }catch(error){handoverEl('handoverManageError').textContent=error.message;}
});
handoverEl('handoverDeleteForm').addEventListener('submit',async event=>{
  event.preventDefault();
  try {
    const item=managedHandover();
    if(!item||!isHandoverAdmin())throw Error('관리자만 인수인계 기록을 삭제할 수 있습니다.');
    if(handoverEl('handoverDeleteConfirm').value.trim()!=='삭제')throw Error('삭제 확인란에 삭제를 정확히 입력하세요.');
    await deleteHandoverRecord(item);
    closeHandoverManage();showToast('인수인계 기록과 연결된 외관 자료를 삭제했습니다.');
  }catch(error){handoverEl('handoverDeleteError').textContent=error.message;}
});
handoverEl('handoverDownload').addEventListener('click',downloadHandoverArchive);
handoverEl('handoverRestore').addEventListener('change',async event=>{
  const input=event.target,file=input.files[0];if(!file)return;
  try {
    if(file.size>100*1024*1024)throw Error('보관파일은 100MB 이하만 지원합니다.');
    const data=JSON.parse(await file.text());
    if(data.format!=='fleet-handover-v1'||!Array.isArray(data.records)||!data.records.length)throw Error('지원하지 않는 보관파일입니다.');
    const pending=new Map(handoverRecords.map(item=>[item.id,item]));
    for(const item of data.records){
      if(!item||typeof item.id!=='string'||!item.id||!item.vehicle||typeof item.vehicle!=='object' ||
        ['차량번호','차종','본부','부','팀','담당자(정)','담당자(부)'].some(key=>typeof item.vehicle[key]!=='string') ||
        ['date','from','to','condition','notes','createdAt'].some(key=>typeof item[key]!=='string') ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.date)||!item.vehicle['차량번호']||!item.from||!item.to||
        !['확인 필요','이상 없음','이상 있음'].includes(item.condition))throw Error('기록 형식이 올바르지 않습니다.');
      validateHandoverPhotos(item.photos);
      if(pending.has(item.id)&&JSON.stringify(pending.get(item.id))!==JSON.stringify(item))throw Error('동일 기록에 다른 내용이 있습니다. 기존 자료를 유지합니다.');
      pending.set(item.id,item);
    }
    handoverRecords.splice(0,handoverRecords.length,...Array.from(pending.values()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
    handoverEl('handoverDetail').hidden=true;renderHandovers();showToast('사진 포함 인수인계 기록을 불러왔습니다.');
  }catch(error){showToast(error.message);}finally{input.value='';}
});
renderHandovers();
