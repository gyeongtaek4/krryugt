/* 사고접수: 활성 회원 접수·열람, 관리자는 처리 코멘트를 남긴다. */
(() => {
  const el=id=>document.getElementById(id);
  const rowsEl=el('accidentRows');
  if(!rowsEl)return;
  const records=[];
  let photoDraft=[],photoLoading=false;
  const isAdmin=()=>window.fleetCurrentRole==='admin';
  const canManage=item=>isAdmin()||item.created_by===window.fleetCurrentUser?.id;
  const safe=value=>escapeHtml(String(value||''));
  const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  const vehicleSnapshot=vehicle=>Object.fromEntries(['차량번호','차종','본부','부','팀','담당자(정)','담당자(부)','지역'].map(key=>[key,String(vehicle[key]||'')]));

  function refreshAccidentVehicles() {
    renderAccidentVehicleInfo();
    renderAccidentVehicleSuggestions();
  }
  window.refreshAccidentVehicles=refreshAccidentVehicles;
  function matchingAccidentVehicles(query) {
    const keyword=normalizePlate(query);
    if(!keyword)return [];
    return vehicleData.filter(vehicle=>normalizePlate(vehicle['차량번호']).includes(keyword)).slice(0,8);
  }
  function renderAccidentVehicleSuggestions() {
    const input=el('accidentVehicle'),suggestions=el('accidentVehicleSuggestions');
    const matches=matchingAccidentVehicles(input.value);
    suggestions.hidden=!matches.length;
    input.setAttribute('aria-expanded',String(Boolean(matches.length)));
    suggestions.innerHTML=matches.map(vehicle=>`<button class="accident-vehicle-suggestion" type="button" role="option" data-accident-vehicle="${safe(vehicle['차량번호'])}"><strong>${safe(vehicle['차량번호'])}</strong><small>${safe([vehicle['본부'],vehicle['부'],vehicle['팀'],vehicle['차종']].filter(Boolean).join(' / ')||'차량 정보')}</small></button>`).join('');
  }
  function selectAccidentVehicle(plate) {
    el('accidentVehicle').value=plate;
    el('accidentVehicleSuggestions').hidden=true;
    el('accidentVehicle').setAttribute('aria-expanded','false');
    renderAccidentVehicleInfo();
  }
  function renderAccidentVehicleInfo() {
    const vehicle=vehicleForPlate(el('accidentVehicle').value);
    el('accidentVehicleInfo').textContent=vehicle?`${vehicle['본부']||'—'} / ${vehicle['부']||'—'} / ${vehicle['팀']||'—'} · ${vehicle['차종']||'차종 미입력'} · 담당(정) ${vehicle['담당자(정)']||'미지정'} · 담당(부) ${vehicle['담당자(부)']||'미지정'}`:'차량번호를 입력하면 본부 · 부 · 팀 · 차종·담당자 정보가 표시됩니다.';
  }
  function validatePhotos(photos) {
    if(photos.length>3)throw Error('사고 현장 자료는 최대 3개까지 첨부할 수 있습니다.');
    let total=0;
    photos.forEach(photo=>{
      if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(photo.type)||photo.size<1||photo.size>5*1024*1024)throw Error('JPG/PNG/WebP/PDF 파일만 파일당 5MB 이하로 첨부하세요.');
      total+=photo.size;
    });
    if(total>15*1024*1024)throw Error('사고 현장 자료는 총 15MB 이하로 첨부하세요.');
  }
  function mergePhotos(incoming) {
    const keys=new Set(photoDraft.map(photo=>`${photo.name}\u0000${photo.size}\u0000${photo.lastModified}`));
    const merged=[...photoDraft];
    incoming.forEach(photo=>{const key=`${photo.name}\u0000${photo.size}\u0000${photo.lastModified}`;if(!keys.has(key)){keys.add(key);merged.push(photo);}});
    validatePhotos(merged);return merged;
  }
  function previewPhotos() {
    el('accidentPreview').innerHTML=photoDraft.map(photo=>`<figure>${photo.type==='application/pdf'?`<a class="attachment-pdf" href="${safe(photo.data)}" target="_blank" rel="noopener">PDF</a>`:`<img src="${safe(photo.data)}" alt="${safe(photo.name)}">`}<figcaption>${safe(photo.name)}</figcaption></figure>`).join('');
  }
  function fileExtension(type) { return type==='image/png'?'png':type==='image/webp'?'webp':type==='application/pdf'?'pdf':'jpg'; }
  async function signedPhotos(paths) {
    if(!paths?.length)return [];
    const {data,error}=await window.fleetSupabaseClient.storage.from('accident-photos').createSignedUrls(paths.map(item=>item.path),3600);
    if(error)throw Error('사고 현장 자료를 불러오지 못했습니다.');
    return paths.map((item,index)=>({...item,data:data[index]?.signedUrl||''}));
  }
  async function refreshAccidentsFromSupabase() {
    if(!window.fleetCurrentUser||!window.fleetSupabaseClient)return;
    const {data,error}=await window.fleetSupabaseClient.from('vehicle_accidents').select('*').order('incident_date',{ascending:false}).order('created_at',{ascending:false});
    if(error)throw Error('사고 접수 이력을 불러오지 못했습니다. 014_vehicle_accidents.sql 실행이 필요할 수 있습니다.');
    const items=await Promise.all((data||[]).map(async item=>({...item,photos:await signedPhotos(item.photo_paths)})));
    records.splice(0,records.length,...items);renderAccidents();
  }
  window.refreshAccidentsFromSupabase=refreshAccidentsFromSupabase;
  function matchingRecords() {
    const keyword=el('accidentSearch').value.trim().toLowerCase();
    return !keyword?records:records.filter(item=>[item.vehicle_snapshot?.['차량번호'],item.passengers,item.replacement_vehicle_number,item.incident_location,item.description].join(' ').toLowerCase().includes(keyword));
  }
  function renderAccidents() {
    const items=matchingRecords();
    rowsEl.innerHTML=items.map(item=>{const index=records.indexOf(item),vehicle=item.vehicle_snapshot||{},manage=canManage(item)?`<button class="row-edit" data-accident-edit="${index}">수정</button><button class="row-delete" data-accident-delete="${index}">삭제</button>`:'';return `<tr data-accident-row="${index}"><td>${safe(item.incident_date)}</td><td class="plate">${safe(vehicle['차량번호'])}<br>${safe(vehicle['차종'])}</td><td>${safe([vehicle['본부'],vehicle['부'],vehicle['팀']].filter(Boolean).join(' / ')||'—')}</td><td>${safe(item.passengers)}</td><td class="plate">${safe(item.replacement_vehicle_number||'—')}</td><td>${safe(item.incident_location)}</td><td>${item.photos.length}건</td><td><div class="handover-management"><button class="row-edit" data-accident-detail="${index}">상세</button>${manage}</div></td></tr>`;}).join('')||`<tr><td colspan="8" class="empty-table">${records.length?'조회 조건에 맞는 사고 접수 이력이 없습니다.':'등록된 사고 접수 이력이 없습니다.'}</td></tr>`;
  }
  async function storeAccident(record) {
    const uploaded=[];
    try {
      for(let index=0;index<photoDraft.length;index++){
        const photo=photoDraft[index],path=`${window.fleetCurrentUser.id}/${record.id}/${index+1}.${fileExtension(photo.type)}`;
        const blob=await (await fetch(photo.data)).blob();
        const {error}=await window.fleetSupabaseClient.storage.from('accident-photos').upload(path,blob,{contentType:photo.type,upsert:false});
        if(error)throw Error(`사고 현장 자료 저장에 실패했습니다: ${error.message||'Storage 오류'}`);
        uploaded.push({path,name:photo.name,size:photo.size,type:photo.type});
      }
      const {error}=await window.fleetSupabaseClient.from('vehicle_accidents').insert({id:record.id,vehicle_id:record.vehicleId,incident_date:record.date,passengers:record.passengers,replacement_vehicle_number:record.replacementVehicleNumber||null,incident_location:record.location,description:record.description,vehicle_snapshot:record.vehicle,photo_paths:uploaded,created_by:window.fleetCurrentUser.id});
      if(error)throw Error(error.message||'사고 접수 저장에 실패했습니다.');
    }catch(error){if(uploaded.length)await window.fleetSupabaseClient.storage.from('accident-photos').remove(uploaded.map(item=>item.path));throw error;}
  }
  function openDetail(item,row) {
    const vehicle=item.vehicle_snapshot||{},detail=document.createElement('div'),comment=item.admin_comment||'';
    if(!row)return;detail.className='handover-detail';document.querySelectorAll('.inline-detail-row').forEach(item=>item.remove());
    detail.innerHTML=`<div class="detail-heading"><h3>${safe(vehicle['차량번호'])} · ${safe(item.incident_date)}</h3><button class="button detail-close" type="button" data-accident-detail-close>접기</button></div><div class="accident-detail-grid"><p><strong>탑승자</strong><br>${safe(item.passengers)}</p><p><strong>대차 차량번호</strong><br>${safe(item.replacement_vehicle_number||'미입력')}</p><p><strong>사고장소</strong><br>${safe(item.incident_location)}</p></div><p class="handover-notes">${safe(item.description)}</p><div class="handover-gallery">${item.photos.map(photo=>`<figure><a href="${safe(photo.data)}" target="_blank" rel="noopener">${photo.type==='application/pdf'?'<span class="attachment-pdf">PDF 열기</span>':`<img src="${safe(photo.data)}" alt="${safe(photo.name)}">`}</a><figcaption>${safe(photo.name)}</figcaption></figure>`).join('')||'<p class="closing-help">첨부 자료 없음</p>'}</div><div class="accident-comment"><strong>관리자 처리 코멘트</strong>${safe(comment||'등록된 코멘트가 없습니다.')}</div>${isAdmin()?`<form class="accident-comment-form" data-accident-comment="${safe(item.id)}"><label class="form-field"><span>처리 코멘트</span><textarea maxlength="2000" required placeholder="사고 처리 현황, 후속 조치, 안내 사항을 입력하세요.">${safe(comment)}</textarea></label><button class="button primary" type="submit">코멘트 저장</button></form>`:''}`;
    const detailRow=document.createElement('tr');detailRow.className='inline-detail-row';detailRow.innerHTML='<td colspan="8"></td>';detailRow.firstElementChild.append(detail);row.after(detailRow);detail.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  let managedAccidentId='';
  document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="accidentManageModal" role="dialog" aria-modal="true" aria-labelledby="accidentManageTitle"><div class="modal"><div class="modal-header"><div><h2 id="accidentManageTitle">사고 접수 수정</h2><p id="accidentManageCopy"></p></div><button class="close-button" id="closeAccidentManage" aria-label="닫기">✕</button></div><form id="accidentManageForm"><div class="form-grid"><label class="form-field"><span>사고일</span><input id="accidentManageDate" type="date" required></label><label class="form-field"><span>탑승자</span><input id="accidentManagePassengers" maxlength="300" required></label><label class="form-field"><span>대차 차량번호</span><input id="accidentManageReplacement" maxlength="30"></label><label class="form-field full"><span>사고장소</span><input id="accidentManageLocation" maxlength="300" required></label><label class="form-field full"><span>상황설명</span><textarea id="accidentManageDescription" maxlength="4000" required></textarea></label></div><p class="form-hint">차량 기본정보·현장 첨부·작성자 정보는 수정하지 않습니다.</p><p class="upload-error" id="accidentManageError"></p><div class="modal-actions"><button class="button" type="button" id="cancelAccidentManage">취소</button><button class="button primary" type="submit">수정 저장</button></div></form><form id="accidentDeleteForm" hidden><p id="accidentDeleteCopy"></p><label class="form-field"><span>삭제 확인</span><input id="accidentDeleteConfirm" autocomplete="off" placeholder="삭제라고 입력하세요"></label><p class="upload-error" id="accidentDeleteError"></p><div class="modal-actions"><button class="button" type="button" id="cancelAccidentDelete">취소</button><button class="button danger" type="submit">사고 접수 삭제</button></div></form></div></div>`);
  const manageEl=id=>el(id),manageModal=manageEl('accidentManageModal');
  const managedAccident=()=>records.find(item=>item.id===managedAccidentId);
  const closeAccidentManage=()=>{manageModal.classList.remove('open');managedAccidentId='';manageEl('accidentManageError').textContent='';manageEl('accidentDeleteError').textContent='';};
  function openAccidentEdit(item){if(!canManage(item))return;managedAccidentId=item.id;manageEl('accidentManageTitle').textContent='사고 접수 수정';manageEl('accidentManageCopy').textContent=`${item.vehicle_snapshot?.['차량번호']||'차량'} · ${item.incident_date} 사고 내용을 수정합니다.`;manageEl('accidentManageDate').value=item.incident_date;manageEl('accidentManagePassengers').value=item.passengers;manageEl('accidentManageReplacement').value=item.replacement_vehicle_number||'';manageEl('accidentManageLocation').value=item.incident_location;manageEl('accidentManageDescription').value=item.description;manageEl('accidentManageForm').hidden=false;manageEl('accidentDeleteForm').hidden=true;manageModal.classList.add('open');}
  function openAccidentDelete(item){if(!canManage(item))return;managedAccidentId=item.id;manageEl('accidentManageTitle').textContent='사고 접수 삭제';manageEl('accidentManageCopy').textContent='';manageEl('accidentDeleteCopy').textContent=`${item.vehicle_snapshot?.['차량번호']||'차량'} · ${item.incident_date} 사고 접수와 첨부자료를 삭제합니다.`;manageEl('accidentDeleteConfirm').value='';manageEl('accidentManageForm').hidden=true;manageEl('accidentDeleteForm').hidden=false;manageModal.classList.add('open');}
  async function updateAccident(item,values){const {error}=await window.fleetSupabaseClient.from('vehicle_accidents').update(values).eq('id',item.id);if(error)throw Error(error.message||'사고 접수 수정에 실패했습니다.');await refreshAccidentsFromSupabase();}
  async function deleteAccident(item){const {error}=await window.fleetSupabaseClient.from('vehicle_accidents').delete().eq('id',item.id);if(error)throw Error(error.message||'사고 접수 삭제에 실패했습니다.');const paths=(item.photo_paths||[]).map(photo=>photo.path).filter(Boolean);if(paths.length){const {error:photoError}=await window.fleetSupabaseClient.storage.from('accident-photos').remove(paths);if(photoError)showToast('사고 접수는 삭제됐지만 첨부자료 정리에 실패했습니다. 관리자에게 문의하세요.');}await refreshAccidentsFromSupabase();}
  el('accidentDate').value=today();
  el('accidentVehicle').addEventListener('input',()=>{renderAccidentVehicleInfo();renderAccidentVehicleSuggestions();});
  el('accidentVehicle').addEventListener('focus',renderAccidentVehicleSuggestions);
  el('accidentVehicle').addEventListener('blur',()=>setTimeout(()=>{el('accidentVehicleSuggestions').hidden=true;el('accidentVehicle').setAttribute('aria-expanded','false');},150));
  el('accidentVehicleSuggestions').addEventListener('click',event=>{const option=event.target.closest('[data-accident-vehicle]');if(option)selectAccidentVehicle(option.dataset.accidentVehicle);});
  el('accidentPhotos').addEventListener('change',async event=>{
    const input=event.target;photoLoading=true;el('accidentSave').disabled=true;el('accidentError').textContent='';
    try{const files=Array.from(input.files);validatePhotos(files);const incoming=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,size:file.size,type:file.type,lastModified:file.lastModified,data:reader.result});reader.onerror=()=>reject(Error('사고 현장 자료를 읽지 못했습니다.'));reader.readAsDataURL(file);})));photoDraft=mergePhotos(incoming);previewPhotos();}
    catch(error){el('accidentError').textContent=error.message;}finally{input.value='';photoLoading=false;el('accidentSave').disabled=false;}
  });
  el('accidentForm').addEventListener('submit',async event=>{
    event.preventDefault();el('accidentError').textContent='';
    try{if(photoLoading)throw Error('사고 현장 자료를 읽는 중입니다.');const vehicle=vehicleForPlate(el('accidentVehicle').value),passengers=el('accidentPassengers').value.trim(),replacementVehicleNumber=el('accidentReplacementVehicle').value.trim(),location=el('accidentLocation').value.trim(),description=el('accidentDescription').value.trim();if(!vehicle)throw Error('등록된 차량을 선택하세요.');if(!passengers||!location||!description)throw Error('탑승자, 사고장소, 상황설명을 모두 입력하세요.');validatePhotos(photoDraft);el('accidentSave').disabled=true;await storeAccident({id:crypto.randomUUID(),vehicleId:vehicle._supabaseId,date:el('accidentDate').value,passengers,replacementVehicleNumber,location,description,vehicle:vehicleSnapshot(vehicle)});photoDraft=[];el('accidentForm').reset();el('accidentDate').value=today();previewPhotos();renderAccidentVehicleInfo();await refreshAccidentsFromSupabase();showToast('사고 접수를 저장했습니다.');}
    catch(error){el('accidentError').textContent=error.message;}finally{el('accidentSave').disabled=false;}
  });
  el('accidentSearch').addEventListener('input',renderAccidents);
  rowsEl.addEventListener('click',event=>{if(event.target.closest('[data-accident-detail-close]')){event.target.closest('.inline-detail-row')?.remove();return;}const edit=event.target.closest('[data-accident-edit]'),remove=event.target.closest('[data-accident-delete]'),button=event.target.closest('[data-accident-detail]');if(edit)openAccidentEdit(records[Number(edit.dataset.accidentEdit)]);else if(remove)openAccidentDelete(records[Number(remove.dataset.accidentDelete)]);else if(button)openDetail(records[Number(button.dataset.accidentDetail)],button.closest('tr'));});
  rowsEl.addEventListener('submit',async event=>{
    const form=event.target.closest('[data-accident-comment]');if(!form)return;event.preventDefault();
    try{if(!isAdmin())throw Error('관리자만 처리 코멘트를 저장할 수 있습니다.');const comment=form.querySelector('textarea').value.trim();if(!comment)throw Error('처리 코멘트를 입력하세요.');const {error}=await window.fleetSupabaseClient.rpc('comment_vehicle_accident',{p_accident_id:form.dataset.accidentComment,p_comment:comment});if(error)throw Error(error.message||'처리 코멘트를 저장하지 못했습니다.');await refreshAccidentsFromSupabase();const updated=records.find(item=>item.id===form.dataset.accidentComment),index=records.indexOf(updated);openDetail(updated,rowsEl.querySelector(`[data-accident-row="${index}"]`));showToast('관리자 처리 코멘트를 저장했습니다.');}
    catch(error){showToast(error.message);}
  });
  manageEl('closeAccidentManage').addEventListener('click',closeAccidentManage);manageEl('cancelAccidentManage').addEventListener('click',closeAccidentManage);manageEl('cancelAccidentDelete').addEventListener('click',closeAccidentManage);manageModal.addEventListener('click',event=>{if(event.target===manageModal)closeAccidentManage();});
  manageEl('accidentManageForm').addEventListener('submit',async event=>{event.preventDefault();try{const item=managedAccident();if(!item||!canManage(item))throw Error('작성자 또는 관리자만 사고 접수를 수정할 수 있습니다.');const date=manageEl('accidentManageDate').value,passengers=manageEl('accidentManagePassengers').value.trim(),replacement=manageEl('accidentManageReplacement').value.trim(),location=manageEl('accidentManageLocation').value.trim(),description=manageEl('accidentManageDescription').value.trim();if(!date||!passengers||!location||!description)throw Error('사고일, 탑승자, 사고장소, 상황설명을 모두 입력하세요.');await updateAccident(item,{incident_date:date,passengers,replacement_vehicle_number:replacement||null,incident_location:location,description});closeAccidentManage();showToast('사고 접수를 수정했습니다.');}catch(error){manageEl('accidentManageError').textContent=error.message;}});
  manageEl('accidentDeleteForm').addEventListener('submit',async event=>{event.preventDefault();try{const item=managedAccident();if(!item||!canManage(item))throw Error('작성자 또는 관리자만 사고 접수를 삭제할 수 있습니다.');if(manageEl('accidentDeleteConfirm').value.trim()!=='삭제')throw Error('삭제 확인란에 삭제를 정확히 입력하세요.');await deleteAccident(item);closeAccidentManage();showToast('사고 접수와 연결된 첨부자료를 삭제했습니다.');}catch(error){manageEl('accidentDeleteError').textContent=error.message;}});
  refreshAccidentVehicles();renderAccidents();
})();
