/* 인수인계 임시 보관: 서버 연결 전에는 사진 포함 JSON을 별도 보관한다. */
const handoverRecords = [];
let handoverPhotoDraft = [], handoverPhotoLoading = false;
const handoverEl = id => document.getElementById(id);
function refreshHandoverVehicles() {
  const select = handoverEl('handoverVehicle'), selected = select.value;
  select.innerHTML = '<option value="">차량 선택</option>' + vehicleData.map(row =>
    `<option value="${escapeHtml(row['차량번호'])}">${escapeHtml(row['차량번호'])} · ${escapeHtml(row['차종'] || '')}</option>`).join('');
  select.value = selected;
}
function validateHandoverPhotos(photos) {
  if (!Array.isArray(photos) || !photos.length || photos.length > 8) throw Error('외관 사진을 1~8장 첨부하세요.');
  let bytes = 0;
  for (const photo of photos) {
    if (!photo || typeof photo.name !== 'string' || photo.name.length > 255 ||
      !Number.isSafeInteger(photo.size) || photo.size < 1 || photo.size > 5*1024*1024 ||
      typeof photo.data !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data) ||
      photo.data.length > 7*1024*1024) throw Error('사진 형식 또는 크기가 올바르지 않습니다.');
    bytes += Math.max(photo.size, Math.floor(photo.data.split(',')[1].length*3/4));
  }
  if (bytes > 20*1024*1024) throw Error('사진은 총 20MB 이하로 첨부하세요.');
}
function handoverGallery(photos) {
  return photos.map(photo => `<figure><a href="${photo.data}" download="${escapeHtml(photo.name)}"><img src="${photo.data}" alt="${escapeHtml(photo.name)}"></a><figcaption>${escapeHtml(photo.name)}</figcaption></figure>`).join('');
}
function renderHandovers() {
  handoverEl('handoverRows').innerHTML = handoverRecords.map((item,index) =>
    `<tr><td>${escapeHtml(item.date)}</td><td class="plate">${escapeHtml(item.vehicle['차량번호'])}<br>${escapeHtml(item.vehicle['차종'] || '')}</td><td>${escapeHtml(['본부','부','팀'].map(key=>item.vehicle[key] || '').join(' / '))}</td><td>${escapeHtml(item.from)} → ${escapeHtml(item.to)}</td><td>${escapeHtml(item.condition)}</td><td>${item.photos.length}장</td><td><button class="row-edit" data-handover-detail="${index}">상세 보기</button></td></tr>`).join('') ||
    '<tr><td colspan="7" class="empty-table">등록된 인수인계 기록이 없습니다.</td></tr>';
}
function downloadHandoverArchive() {
  if (!handoverRecords.length) { showToast('저장된 기록이 없습니다.'); return; }
  const url = URL.createObjectURL(new Blob([JSON.stringify({format:'fleet-handover-v1',records:handoverRecords})],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download='차량인수인계_사진포함보관파일.json'; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const handoverNav = document.createElement('li');
handoverNav.innerHTML = '<button class="nav-button" data-page="차량인수인계"><svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16m0 0-4-4m4 4-4 4M20 17H4m0 0 4-4m-4 4 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>차량인수인계</button>';
document.querySelector('.nav-list').appendChild(handoverNav);
handoverNav.querySelector('button').addEventListener('click',()=>{showView('차량인수인계');toggleSidebar(false);});
handoverEl('handoverDate').value = new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
handoverEl('handoverVehicle').addEventListener('change',()=>{
  handoverEl('handoverFrom').value = vehicleForPlate(handoverEl('handoverVehicle').value)?.['담당자(정)'] || '';
});
handoverEl('handoverPhotos').addEventListener('change',async event=>{
  const input=event.target, files=Array.from(input.files); handoverPhotoDraft=[]; handoverEl('handoverPreview').innerHTML='';
  handoverPhotoLoading=true; handoverEl('handoverSave').disabled=true; handoverEl('handoverError').textContent='';
  try {
    if (!files.length) return;
    if (files.length>8 || files.reduce((sum,file)=>sum+file.size,0)>20*1024*1024) throw Error('최대 8장, 총 20MB까지 첨부할 수 있습니다.');
    if (files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5*1024*1024)) throw Error('JPG/PNG/WebP, 장당 5MB 이하 사진을 선택하세요.');
    const photos=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{
      const reader=new FileReader(); reader.onload=()=>resolve({name:file.name,size:file.size,data:reader.result}); reader.onerror=()=>reject(Error('사진을 읽지 못했습니다.')); reader.readAsDataURL(file);
    })));
    validateHandoverPhotos(photos); handoverPhotoDraft=photos; handoverEl('handoverPreview').innerHTML=handoverGallery(photos);
  } catch(error) {handoverEl('handoverError').textContent=error.message;input.value='';}
  finally {handoverPhotoLoading=false;handoverEl('handoverSave').disabled=false;}
});
handoverEl('handoverForm').addEventListener('submit',event=>{
  event.preventDefault(); handoverEl('handoverError').textContent='';
  try {
    if(handoverPhotoLoading)throw Error('사진을 읽는 중입니다.');
    const vehicle=vehicleForPlate(handoverEl('handoverVehicle').value);
    if(!vehicle)throw Error('등록된 차량을 선택하세요.');
    const from=handoverEl('handoverFrom').value.trim(),to=handoverEl('handoverTo').value.trim(),condition=handoverEl('handoverCondition').value,notes=handoverEl('handoverNotes').value.trim();
    if(!from||!to||from===to)throw Error('서로 다른 인계자와 인수자를 입력하세요.');
    if(condition==='이상 있음'&&!notes)throw Error('이상이 있는 위치와 내용을 입력하세요.');
    validateHandoverPhotos(handoverPhotoDraft);
    handoverRecords.unshift({id:crypto.randomUUID(),date:handoverEl('handoverDate').value,from,to,condition,notes,
      vehicle:Object.fromEntries(['차량번호','차종','본부','부','팀','담당자(정)','담당자(부)'].map(key=>[key,String(vehicle[key]||'')])),
      photos:handoverPhotoDraft,createdAt:new Date().toISOString()});
    renderHandovers();downloadHandoverArchive();handoverPhotoDraft=[];handoverEl('handoverPhotos').value='';handoverEl('handoverPreview').innerHTML='';
    handoverEl('handoverTo').value='';handoverEl('handoverNotes').value='';handoverEl('handoverCondition').value='확인 필요';
    showToast('임시 기록을 저장했습니다. 내려받은 사진 포함 JSON을 보관하세요.');
  }catch(error){handoverEl('handoverError').textContent=error.message;}
});
handoverEl('handoverRows').addEventListener('click',event=>{
  const button=event.target.closest('[data-handover-detail]');if(!button)return;
  const item=handoverRecords[Number(button.dataset.handoverDetail)];if(!item)return;
  const detail=handoverEl('handoverDetail');detail.hidden=false;
  detail.innerHTML=`<h3>${escapeHtml(item.vehicle['차량번호'])} · ${escapeHtml(item.date)}</h3><p>${escapeHtml(item.from)} → ${escapeHtml(item.to)} · ${escapeHtml(item.condition)}</p><p class="handover-notes">${escapeHtml(item.notes || '특이사항 없음')}</p><p class="closing-help">사진을 누르면 원본을 내려받습니다.</p><div class="handover-gallery">${handoverGallery(item.photos)}</div>`;
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
