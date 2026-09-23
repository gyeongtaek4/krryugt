let drivingPage = 1, drivingArchivePage = 1, drivingDetailExportData = null;
const drivingPageSize = 20;
function drivingMonthlyTotals(month) {
  const rows = drivingArchive[month]?.rows || drivingData.filter(row=>drivingRowMonth(row)===month);
  const groups = new Map();
  rows.forEach(row=>{
    const plate=normalizePlate(row['차량번호']);
    if(!groups.has(plate))groups.set(plate,{plate:row['차량번호'],org:drivingArchive[month] ? row._organization : vehicleForPlate(row['차량번호']),distance:0,days:new Set()});
    const item=groups.get(plate);item.distance+=mileageNumber(row['키로수']);item.days.add(normalizeDrivingDate(row['운행년월일']));
  });
  return [...groups.values()].sort((a,b)=>normalizePlate(a.plate).localeCompare(normalizePlate(b.plate),'ko'));
}
function drivingDailyTotals(month,plate) {
  const rows=drivingArchive[month]?.rows || drivingData.filter(row=>drivingRowMonth(row)===month);
  const target=normalizePlate(plate),groups=new Map();
  rows.forEach(row=>{
    if(normalizePlate(row['차량번호'])!==target)return;
    const date=normalizeDrivingDate(row['운행년월일']);
    if(!date)return;
    if(!groups.has(date))groups.set(date,{date,distance:0});
    groups.get(date).distance+=mileageNumber(row['키로수']);
  });
  return [...groups.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
function drivingWeekday(date) {
  return ['일','월','화','수','목','금','토'][new Date(`${date}T00:00:00+09:00`).getDay()];
}
function koreanHolidayName(date) {
  const holidays={
    '2025-01-01':'신정','2025-01-28':'설날 연휴','2025-01-29':'설날','2025-01-30':'설날 연휴','2025-03-01':'삼일절','2025-03-03':'삼일절 대체공휴일','2025-05-05':'어린이날·부처님오신날','2025-05-06':'대체공휴일','2025-06-06':'현충일','2025-08-15':'광복절','2025-10-03':'개천절','2025-10-05':'추석 연휴','2025-10-06':'추석','2025-10-07':'추석 연휴','2025-10-08':'추석 대체공휴일','2025-10-09':'한글날','2025-12-25':'성탄절',
    '2026-01-01':'신정','2026-02-16':'설날 연휴','2026-02-17':'설날','2026-02-18':'설날 연휴','2026-03-01':'삼일절','2026-03-02':'삼일절 대체공휴일','2026-05-05':'어린이날','2026-05-24':'부처님오신날','2026-05-25':'부처님오신날 대체공휴일','2026-06-03':'전국동시지방선거','2026-06-06':'현충일','2026-08-15':'광복절','2026-08-17':'광복절 대체공휴일','2026-09-24':'추석 연휴','2026-09-25':'추석','2026-09-26':'추석 연휴','2026-10-03':'개천절','2026-10-09':'한글날','2026-12-25':'성탄절',
    '2027-01-01':'신정','2027-02-06':'설날 연휴','2027-02-07':'설날','2027-02-08':'설날 연휴','2027-02-09':'설날 대체공휴일','2027-03-01':'삼일절','2027-05-05':'어린이날','2027-05-13':'부처님오신날','2027-06-06':'현충일','2027-06-07':'현충일 대체공휴일','2027-08-15':'광복절','2027-08-16':'광복절 대체공휴일','2027-09-14':'추석 연휴','2027-09-15':'추석','2027-09-16':'추석 연휴','2027-10-03':'개천절','2027-10-04':'개천절 대체공휴일','2027-10-09':'한글날','2027-10-11':'한글날 대체공휴일','2027-12-25':'성탄절','2027-12-27':'성탄절 대체공휴일'
  };
  return holidays[date]||'';
}
function drivingDayStatus(date) {
  const holiday=koreanHolidayName(date);
  if(holiday)return {isHoliday:true,label:holiday};
  const weekday=new Date(`${date}T00:00:00+09:00`).getDay();
  return weekday===0||weekday===6?{isHoliday:true,label:'주말'}:{isHoliday:false,label:'평일'};
}
function toggleDrivingDetail(open) {
  document.getElementById('drivingDetailModal').classList.toggle('open',open);
  document.body.style.overflow=open?'hidden':'';
}
function openDrivingDetail(month,plate) {
  const item=drivingMonthlyTotals(month).find(value=>normalizePlate(value.plate)===normalizePlate(plate));
  const days=drivingDailyTotals(month,plate);
  if(!item||!days.length){showToast('표시할 날짜별 운행기록이 없습니다.');return;}
  const org=item.org||{},team=[org['본부'],org['부'],org['팀']].filter(Boolean).join(' / ');
  document.getElementById('drivingDetailTitle').textContent=`${item.plate} 일별 운행기록`;
  document.getElementById('drivingDetailDescription').textContent=`${month} · 같은 날짜의 운행은 합산해 표시합니다.`;
  document.getElementById('drivingDetailSummary').innerHTML=`<div><strong>${escapeHtml(item.plate)}</strong><span class="detail-team">${escapeHtml(team||'차량현황 미매칭')}</span></div><div class="detail-total"><span>이용일수</span><strong>${days.length}일</strong></div><div class="detail-total"><span>월 이동거리</span><strong>${item.distance.toLocaleString('ko-KR')}km</strong></div>`;
  document.getElementById('drivingDetailRows').innerHTML=days.map(day=>{
    const status=drivingDayStatus(day.date);
    return `<tr class="${status.isHoliday?'holiday-row':''}" title="${escapeHtml(status.label)}"><td>${escapeHtml(day.date.replaceAll('-','.'))}</td><td>${drivingWeekday(day.date)}요일</td><td class="distance-value">${day.distance.toLocaleString('ko-KR')}km</td></tr>`;
  }).join('');
  drivingDetailExportData={month,plate:item.plate,team,days};
  toggleDrivingDetail(true);
}
function downloadDrivingDetailExcel() {
  const detail=drivingDetailExportData;
  if(!detail){showToast('내려받을 일별 운행기록이 없습니다.');return;}
  const rows=detail.days.map(day=>{
    const status=drivingDayStatus(day.date);
    return {'이용월':detail.month,'차량번호':detail.plate,'소속':detail.team||'차량현황 미매칭','운행일':day.date,'요일':`${drivingWeekday(day.date)}요일`,'구분':status.label,'일 이동거리(km)':day.distance};
  });
  downloadExcel(rows,'일별 운행기록',`일별운행기록_${detail.month}_${normalizePlate(detail.plate)}.xlsx`);
}
function drivingPagination(id,total,page) {
  const pages=Math.max(1,Math.ceil(total/drivingPageSize));
  document.getElementById(id).innerHTML=`<button class="button" data-page-step="-1" ${page<=1?'disabled':''}>이전</button><span>${page} / ${pages} 페이지 · 총 ${total}건</span><button class="button" data-page-step="1" ${page>=pages?'disabled':''}>다음</button>`;
}
async function refreshDrivingFromSupabase() {
  if(!window.fleetCurrentUser || !window.fleetSupabaseClient)return;
  const all=[];
  for(let offset=0;;offset+=500){
    const {data,error}=await window.fleetSupabaseClient.from('driving_months').select('*').order('month').range(offset,offset+499);
    if(error)throw Error('운행자료 서버 연결을 확인하세요. 003_driving_months.sql 실행이 필요할 수 있습니다.');
    all.push(...data);if(data.length<500)break;
  }
  drivingData=all.flatMap(item=>item.rows);
  Object.keys(drivingArchive).forEach(key=>delete drivingArchive[key]);
  all.filter(item=>item.confirmed_at).forEach(item=>drivingArchive[item.month]={rows:item.rows,confirmedAt:item.confirmed_at});
  const latest=latestConfirmedDrivingMonth();
  if(latest){document.getElementById('usageMonth').value=latest;document.getElementById('dashboardUsageMonth').value=latest;}
  renderDriving();
}
window.refreshDrivingFromSupabase=refreshDrivingFromSupabase;
async function storeDrivingMonth(month,rows,confirmed=false) {
  if(!window.fleetCurrentUser || !window.fleetSupabaseClient)throw Error('로그인 후 저장하세요.');
  const {data,error}=await window.fleetSupabaseClient.rpc('save_driving_month',{p_month:month,p_rows:rows,p_confirm:confirmed});
  if(error)throw Error(error.message || '운행자료 저장에 실패했습니다.');
  drivingData=drivingData.filter(row=>drivingRowMonth(row)!==month).concat(data.rows);
  if(data.confirmed_at)drivingArchive[month]={rows:data.rows,confirmedAt:data.confirmed_at};
}
renderDrivingArchive = function() {
  const month=document.getElementById('usageMonth').value,saved=drivingArchive[month];
  const months=[...new Set([...drivingData.map(drivingRowMonth),...Object.keys(drivingArchive)])].sort().reverse();
  document.getElementById('drivingArchiveStatus').textContent=`${month} · ${saved?'마감 확정':'확정 전 검토'}`;
  document.getElementById('confirmDrivingMonth').disabled=!!saved||!drivingMonthlyTotals(month).length;
  document.getElementById('drivingSourceFileName').textContent=saved?'서버 확정자료':'미확정 검토자료';
  document.getElementById('drivingSourceUpdated').textContent=saved?`확정일 ${new Date(saved.confirmedAt).toLocaleString('ko-KR')}`:'월도별 검토 후 확정';
  drivingArchivePage=Math.min(drivingArchivePage,Math.max(1,Math.ceil(months.length/drivingPageSize)));
  document.getElementById('drivingArchiveList').innerHTML=months.slice((drivingArchivePage-1)*20,drivingArchivePage*20).map(key=>{
    const items=drivingMonthlyTotals(key),distance=items.reduce((sum,item)=>sum+item.distance,0),item=drivingArchive[key];
    return `<tr><td>${escapeHtml(key)}</td><td>${items.length}대</td><td class="distance-value">${distance.toLocaleString('ko-KR')}km</td><td>${item?'확정':'미확정'}</td><td>${item?escapeHtml(new Date(item.confirmedAt).toLocaleString('ko-KR')):'—'}</td><td><button class="row-edit" data-driving-month="${key}">조회</button></td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty-table">운행자료를 업로드하면 월별 합계가 표시됩니다.</td></tr>';
  drivingPagination('drivingArchivePagination',months.length,drivingArchivePage);renderDashboardUsage();
};
renderDriving = function() {
  const month=document.getElementById('usageMonth').value,keyword=document.getElementById('drivingSearch').value.trim().toLowerCase();
  const summary=confirmedDrivingSummary();
  document.getElementById('drivingSummaryBasis').textContent=summary.month?`마지막 확정 저장 기준 · ${summary.month}`:'확정된 자료 없음 · 아래 업로드 자료를 검토하세요.';
  document.getElementById('usageVehicleCount').textContent=summary.month?`${summary.count}대`:'—';
  document.getElementById('usageTotalDistance').textContent=summary.month?`${summary.distance.toLocaleString('ko-KR')}km`:'—';
  ['Headquarters','Division','Team'].forEach((key,index)=>{
    document.getElementById(`usage${key}Count`).textContent=summary.month?`${[summary.headquarters,summary.divisions,summary.teams][index]}개`:'—';
  });
  const items=drivingMonthlyTotals(month).filter(item=>!keyword || [item.plate,...Object.values(item.org||{})].join(' ').toLowerCase().includes(keyword));
  drivingPage=Math.min(drivingPage,Math.max(1,Math.ceil(items.length/20)));
  document.getElementById('drivingTableBody').innerHTML=items.slice((drivingPage-1)*20,drivingPage*20).map(item=>{
    const org=item.org||{};
    return `<tr><td>${escapeHtml(month)}</td>${['본부','부','팀'].map(key=>`<td>${escapeHtml(org[key]||'미매칭')}</td>`).join('')}<td class="plate"><button class="plate-detail-button" data-driving-detail="${escapeHtml(normalizePlate(item.plate))}" aria-label="${escapeHtml(item.plate)} 일별 운행기록 보기">${escapeHtml(item.plate)}</button></td><td>${escapeHtml(org['차종']||'—')}</td><td class="distance-value">${item.distance.toLocaleString('ko-KR')}km</td><td>${item.days.size}일</td><td>${item.org?'연결 완료':'차량현황 확인'}</td></tr>`;
  }).join('')||'<tr><td colspan="9" class="empty-table">조건에 맞는 월별 차량자료가 없습니다.</td></tr>';
  document.getElementById('drivingRecordCount').textContent=`${items.length}대`;
  drivingPagination('drivingPagination',items.length,drivingPage);renderDrivingArchive();
};
exportDrivingData = function() {
  const month=document.getElementById('usageMonth').value;
  const rows=drivingMonthlyTotals(month).map(item=>({'이용월도':month,...Object.fromEntries(['본부','부','팀'].map(key=>[key,item.org?.[key]||'미매칭'])),'차량번호':item.plate,'차종':item.org?.['차종']||'','월 이용키로수':item.distance,'이용일수':item.days.size}));
  if(!rows.length){showToast('내려받을 자료가 없습니다.');return;}
  downloadExcel(rows,'차량별 월 운행합계',`차량별운행합계_${month}.xlsx`);
};
// app.js에서 연결한 기존 다운로드 버튼의 함수를 월 합계로 교체한다.
const oldExport=document.getElementById('exportDrivingButton'),newExport=oldExport.cloneNode(true);oldExport.replaceWith(newExport);newExport.addEventListener('click',exportDrivingData);
['drivingPagination','drivingArchivePagination'].forEach(id=>document.getElementById(id).addEventListener('click',event=>{
  const button=event.target.closest('[data-page-step]');if(!button||button.disabled)return;
  if(id==='drivingPagination')drivingPage+=Number(button.dataset.pageStep);else drivingArchivePage+=Number(button.dataset.pageStep);
  renderDriving();
}));
document.getElementById('usageMonth').addEventListener('change',()=>{drivingPage=1;renderDriving();});
document.getElementById('drivingSearch').addEventListener('input',()=>{drivingPage=1;renderDriving();});
document.getElementById('drivingTableBody').addEventListener('click',event=>{
  const button=event.target.closest('[data-driving-detail]');
  if(button)openDrivingDetail(document.getElementById('usageMonth').value,button.dataset.drivingDetail);
});
['closeDrivingDetail','closeDrivingDetailConfirm'].forEach(id=>document.getElementById(id).addEventListener('click',()=>toggleDrivingDetail(false)));
document.getElementById('downloadDrivingDetail').addEventListener('click',downloadDrivingDetailExcel);
document.getElementById('drivingDetailModal').addEventListener('click',event=>{if(event.target===event.currentTarget)toggleDrivingDetail(false);});
renderDriving();
// 이전 월합계 파일에는 실제 운행 날짜가 없어 일수로 해석하지 않는다.
document.getElementById('restoreDrivingArchive').disabled=true;
document.getElementById('restoreDrivingArchive').parentElement.hidden=true;
