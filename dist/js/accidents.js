/* 사고접수: 활성 회원 접수·열람, 관리자는 처리 코멘트를 남긴다. */
(() => {
  const el=id=>document.getElementById(id);
  const rowsEl=el('accidentRows');
  if(!rowsEl)return;
  const records=[];
  let photoDraft=[],photoLoading=false;
  const isAdmin=()=>window.fleetCurrentRole==='admin';
  const safe=value=>escapeHtml(String(value||''));
  const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  const vehicleSnapshot=vehicle=>Object.fromEntries(['차량번호','차종','본부','부','팀','담당자(정)','담당자(부)','지역'].map(key=>[key,String(vehicle[key]||'')]));

  function refreshAccidentVehicles() {
    const select=el('accidentVehicle'),selected=select.value;
    select.innerHTML='<option value="">차량 선택</option>'+vehicleData.map(vehicle=>`<option value="${safe(vehicle['차량번호'])}">${safe(vehicle['차량번호'])} · ${safe(vehicle['차종'])}</option>`).join('');
    select.value=selected;renderAccidentVehicleInfo();
  }
  window.refreshAccidentVehicles=refreshAccidentVehicles;
  function renderAccidentVehicleInfo() {
    const vehicle=vehicleForPlate(el('accidentVehicle').value);
    el('accidentVehicleInfo').textContent=vehicle?`${vehicle['본부']||'—'} / ${vehicle['부']||'—'} / ${vehicle['팀']||'—'} · ${vehicle['차종']||'차종 미입력'} · 담당 ${vehicle['담당자(정)']||'미지정'}`:'차량을 선택하면 본부 · 부 · 팀 · 차종 정보가 표시됩니다.';
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
    return !keyword?records:records.filter(item=>[item.vehicle_snapshot?.['차량번호'],item.passengers,item.incident_location,item.description].join(' ').toLowerCase().includes(keyword));
  }
  function renderAccidents() {
    const items=matchingRecords();
    rowsEl.innerHTML=items.map(item=>{const index=records.indexOf(item),vehicle=item.vehicle_snapshot||{};return `<tr><td>${safe(item.incident_date)}</td><td class="plate">${safe(vehicle['차량번호'])}<br>${safe(vehicle['차종'])}</td><td>${safe([vehicle['본부'],vehicle['부'],vehicle['팀']].filter(Boolean).join(' / ')||'—')}</td><td>${safe(item.passengers)}</td><td>${safe(item.incident_location)}</td><td>${item.photos.length}장</td><td><button class="row-edit" data-accident-detail="${index}">상세</button></td></tr>`;}).join('')||`<tr><td colspan="7" class="empty-table">${records.length?'조회 조건에 맞는 사고 접수 이력이 없습니다.':'등록된 사고 접수 이력이 없습니다.'}</td></tr>`;
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
      const {error}=await window.fleetSupabaseClient.from('vehicle_accidents').insert({id:record.id,vehicle_id:record.vehicleId,incident_date:record.date,passengers:record.passengers,incident_location:record.location,description:record.description,vehicle_snapshot:record.vehicle,photo_paths:uploaded,created_by:window.fleetCurrentUser.id});
      if(error)throw Error(error.message||'사고 접수 저장에 실패했습니다.');
    }catch(error){if(uploaded.length)await window.fleetSupabaseClient.storage.from('accident-photos').remove(uploaded.map(item=>item.path));throw error;}
  }
  function openDetail(item) {
    const vehicle=item.vehicle_snapshot||{},detail=el('accidentDetail'),comment=item.admin_comment||'';
    detail.hidden=false;
    detail.innerHTML=`<h3>${safe(vehicle['차량번호'])} · ${safe(item.incident_date)}</h3><div class="accident-detail-grid"><p><strong>탑승자</strong><br>${safe(item.passengers)}</p><p><strong>사고장소</strong><br>${safe(item.incident_location)}</p></div><p class="handover-notes">${safe(item.description)}</p><div class="handover-gallery">${item.photos.map(photo=>`<figure><a href="${safe(photo.data)}" target="_blank" rel="noopener">${photo.type==='application/pdf'?'<span class="attachment-pdf">PDF 열기</span>':`<img src="${safe(photo.data)}" alt="${safe(photo.name)}">`}</a><figcaption>${safe(photo.name)}</figcaption></figure>`).join('')||'<p class="closing-help">첨부 자료 없음</p>'}</div><div class="accident-comment"><strong>관리자 처리 코멘트</strong>${safe(comment||'등록된 코멘트가 없습니다.')}</div>${isAdmin()?`<form class="accident-comment-form" data-accident-comment="${safe(item.id)}"><label class="form-field"><span>처리 코멘트</span><textarea maxlength="2000" required placeholder="사고 처리 현황, 후속 조치, 안내 사항을 입력하세요.">${safe(comment)}</textarea></label><button class="button primary" type="submit">코멘트 저장</button></form>`:''}`;
    detail.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  el('accidentDate').value=today();
  el('accidentVehicle').addEventListener('change',renderAccidentVehicleInfo);
  el('accidentPhotos').addEventListener('change',async event=>{
    const input=event.target;photoLoading=true;el('accidentSave').disabled=true;el('accidentError').textContent='';
    try{const files=Array.from(input.files);validatePhotos(files);const incoming=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,size:file.size,type:file.type,lastModified:file.lastModified,data:reader.result});reader.onerror=()=>reject(Error('사고 현장 자료를 읽지 못했습니다.'));reader.readAsDataURL(file);})));photoDraft=mergePhotos(incoming);previewPhotos();}
    catch(error){el('accidentError').textContent=error.message;}finally{input.value='';photoLoading=false;el('accidentSave').disabled=false;}
  });
  el('accidentForm').addEventListener('submit',async event=>{
    event.preventDefault();el('accidentError').textContent='';
    try{if(photoLoading)throw Error('사고 현장 자료를 읽는 중입니다.');const vehicle=vehicleForPlate(el('accidentVehicle').value),passengers=el('accidentPassengers').value.trim(),location=el('accidentLocation').value.trim(),description=el('accidentDescription').value.trim();if(!vehicle)throw Error('등록된 차량을 선택하세요.');if(!passengers||!location||!description)throw Error('탑승자, 사고장소, 상황설명을 모두 입력하세요.');validatePhotos(photoDraft);el('accidentSave').disabled=true;await storeAccident({id:crypto.randomUUID(),vehicleId:vehicle._supabaseId,date:el('accidentDate').value,passengers,location,description,vehicle:vehicleSnapshot(vehicle)});photoDraft=[];el('accidentForm').reset();el('accidentDate').value=today();previewPhotos();renderAccidentVehicleInfo();await refreshAccidentsFromSupabase();showToast('사고 접수를 저장했습니다.');}
    catch(error){el('accidentError').textContent=error.message;}finally{el('accidentSave').disabled=false;}
  });
  el('accidentSearch').addEventListener('input',renderAccidents);
  rowsEl.addEventListener('click',event=>{const button=event.target.closest('[data-accident-detail]');if(button)openDetail(records[Number(button.dataset.accidentDetail)]);});
  el('accidentDetail').addEventListener('submit',async event=>{
    const form=event.target.closest('[data-accident-comment]');if(!form)return;event.preventDefault();
    try{if(!isAdmin())throw Error('관리자만 처리 코멘트를 저장할 수 있습니다.');const comment=form.querySelector('textarea').value.trim();if(!comment)throw Error('처리 코멘트를 입력하세요.');const {error}=await window.fleetSupabaseClient.rpc('comment_vehicle_accident',{p_accident_id:form.dataset.accidentComment,p_comment:comment});if(error)throw Error(error.message||'처리 코멘트를 저장하지 못했습니다.');await refreshAccidentsFromSupabase();openDetail(records.find(item=>item.id===form.dataset.accidentComment));showToast('관리자 처리 코멘트를 저장했습니다.');}
    catch(error){showToast(error.message);}
  });
  refreshAccidentVehicles();renderAccidents();
})();
