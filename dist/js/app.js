const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('scrim');
const modal = document.getElementById('uploadModal');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const uploadError = document.getElementById('uploadError');
const fileInput = document.getElementById('fileInput');
const requiredColumns = ['본부', '부', '팀', '담당자(정)', '담당자(부)', '차량번호', '차종', '지역', '주차장'];
let toastTimer;
let vehicleData = [
  { '본부':'영업본부', '부':'국내영업부', '팀':'영업1팀', '담당자(정)':'김민준', '담당자(부)':'이서연', '차량번호':'12가 3456', '차종':'그랜저', '지역':'서울', '주차장':'본사 지하주차장' },
  { '본부':'영업본부', '부':'국내영업부', '팀':'영업1팀', '담당자(정)':'김민준', '담당자(부)':'이서연', '차량번호':'34나 7890', '차종':'쏘렌토', '지역':'서울', '주차장':'본사 지하주차장' },
  { '본부':'영업본부', '부':'국내영업부', '팀':'영업2팀', '담당자(정)':'박지훈', '담당자(부)':'최유진', '차량번호':'45다 2211', '차종':'K5', '지역':'경기', '주차장':'수원사업장 주차장' },
  { '본부':'영업본부', '부':'해외영업부', '팀':'글로벌영업팀', '담당자(정)':'정하늘', '담당자(부)':'윤서준', '차량번호':'18라 9034', '차종':'투싼', '지역':'서울', '주차장':'본사 외부주차장' },
  { '본부':'기술지원본부', '부':'고객지원부', '팀':'현장지원1팀', '담당자(정)':'최도윤', '담당자(부)':'김예은', '차량번호':'56다 1122', '차종':'아반떼', '지역':'대전', '주차장':'대전센터 주차장' },
  { '본부':'기술지원본부', '부':'고객지원부', '팀':'현장지원1팀', '담당자(정)':'최도윤', '담당자(부)':'김예은', '차량번호':'67마 4589', '차종':'카니발', '지역':'대전', '주차장':'대전센터 주차장' },
  { '본부':'기술지원본부', '부':'품질관리부', '팀':'품질보증팀', '담당자(정)':'장현우', '담당자(부)':'오수빈', '차량번호':'23거 7741', '차종':'스포티지', '지역':'충남', '주차장':'천안공장 주차장' },
  { '본부':'경영지원본부', '부':'총무부', '팀':'자산관리팀', '담당자(정)':'이준호', '담당자(부)':'한지민', '차량번호':'31도 8265', '차종':'그랜저', '지역':'서울', '주차장':'본사 지하주차장' },
  { '본부':'경영지원본부', '부':'총무부', '팀':'자산관리팀', '담당자(정)':'이준호', '담당자(부)':'한지민', '차량번호':'72오 3158', '차종':'K8', '지역':'서울', '주차장':'본사 지하주차장' },
  { '본부':'경영지원본부', '부':'재무부', '팀':'회계팀', '담당자(정)':'신지우', '담당자(부)':'강민서', '차량번호':'89주 6402', '차종':'쏘나타', '지역':'서울', '주차장':'본사 외부주차장' },
  { '본부':'물류운영본부', '부':'운송관리부', '팀':'수도권운영팀', '담당자(정)':'조성민', '담당자(부)':'배유나', '차량번호':'94하 5127', '차종':'스타리아', '지역':'인천', '주차장':'인천물류센터 주차장' },
  { '본부':'물류운영본부', '부':'운송관리부', '팀':'지방운영팀', '담당자(정)':'임태호', '담당자(부)':'문가영', '차량번호':'11호 2486', '차종':'봉고3', '지역':'부산', '주차장':'부산물류센터 주차장' }
];
const contractModal = document.getElementById('contractUploadModal');
const contractFileInput = document.getElementById('contractFileInput');
const contractUploadError = document.getElementById('contractUploadError');
const contractColumns = ['본부', '부', '팀', '담당자(정)', '담당자(부)', '차종', '차량번호', '렌탈료', '계약시작', '계약종료'];
let contractData = [
  { '본부':'영업본부','부':'국내영업부','팀':'영업1팀','담당자(정)':'김민준','담당자(부)':'이서연','차종':'그랜저','차량번호':'12가 3456','렌탈료':'1150000','계약시작':'2024-01','계약종료':'2027-12' },
  { '본부':'영업본부','부':'국내영업부','팀':'영업1팀','담당자(정)':'김민준','담당자(부)':'이서연','차종':'쏘렌토','차량번호':'34나 7890','렌탈료':'1080000','계약시작':'2023-11','계약종료':'2026-10' },
  { '본부':'영업본부','부':'국내영업부','팀':'영업2팀','담당자(정)':'박지훈','담당자(부)':'최유진','차종':'K5','차량번호':'45다 2211','렌탈료':'820000','계약시작':'2025-03','계약종료':'2029-02' },
  { '본부':'영업본부','부':'해외영업부','팀':'글로벌영업팀','담당자(정)':'정하늘','담당자(부)':'윤서준','차종':'투싼','차량번호':'18라 9034','렌탈료':'930000','계약시작':'2024-07','계약종료':'2027-06' },
  { '본부':'기술지원본부','부':'고객지원부','팀':'현장지원1팀','담당자(정)':'최도윤','담당자(부)':'김예은','차종':'아반떼','차량번호':'56다 1122','렌탈료':'690000','계약시작':'2024-12','계약종료':'2027-11' },
  { '본부':'기술지원본부','부':'고객지원부','팀':'현장지원1팀','담당자(정)':'최도윤','담당자(부)':'김예은','차종':'카니발','차량번호':'67마 4589','렌탈료':'1260000','계약시작':'2023-10','계약종료':'2026-09' },
  { '본부':'기술지원본부','부':'품질관리부','팀':'품질보증팀','담당자(정)':'장현우','담당자(부)':'오수빈','차종':'스포티지','차량번호':'23거 7741','렌탈료':'910000','계약시작':'2025-01','계약종료':'2028-12' },
  { '본부':'경영지원본부','부':'총무부','팀':'자산관리팀','담당자(정)':'이준호','담당자(부)':'한지민','차종':'그랜저','차량번호':'31도 8265','렌탈료':'1170000','계약시작':'2024-05','계약종료':'2028-04' },
  { '본부':'경영지원본부','부':'재무부','팀':'회계팀','담당자(정)':'신지우','담당자(부)':'강민서','차종':'쏘나타','차량번호':'89주 6402','렌탈료':'860000','계약시작':'2023-12','계약종료':'2026-11' },
  { '본부':'물류운영본부','부':'운송관리부','팀':'수도권운영팀','담당자(정)':'조성민','담당자(부)':'배유나','차종':'스타리아','차량번호':'94하 5127','렌탈료':'1210000','계약시작':'2025-06','계약종료':'2029-05' }
];
const drivingUploadModal = document.getElementById('drivingUploadModal');
const drivingFormModal = document.getElementById('drivingFormModal');
const drivingFileInput = document.getElementById('drivingFileInput');
const drivingUploadError = document.getElementById('drivingUploadError');
const drivingColumns = ['차량번호', '키로수', '운행년월일'];
let drivingData = [];
const drivingArchive = {};
const vehicleFormModal = document.getElementById('vehicleFormModal');
const contractFormModal = document.getElementById('contractFormModal');
let editingVehicleIndex = null;
let editingContractIndex = null;
let editingDrivingIndex = null;

async function refreshVehiclesFromSupabase() {
  if (!window.fleetCurrentUser || !window.fleetSupabaseClient) return;
  const { data, error } = await window.fleetSupabaseClient.from('vehicles').select('*');
  if (error) {
    console.error('차량현황 Supabase 조회 오류', error);
    showToast('차량현황을 불러오지 못했습니다. Supabase 권한 정책을 확인해 주세요.');
    return;
  }
  vehicleData = (data || []).sort((a, b) => String(a.vehicle_number_normalized || a.vehicle_number || '').localeCompare(String(b.vehicle_number_normalized || b.vehicle_number || ''))).map(row => ({
    '본부': row.headquarters || '', '부': row.division || '', '팀': row.team || '',
    '담당자(정)': row.primary_manager || '', '담당자(부)': row.secondary_manager || '',
    '차량번호': row.vehicle_number || '', '차종': row.vehicle_model || '',
    '지역': row.region || '', '주차장': row.parking_lot || '', _supabaseId: row.id
  }));
  refreshFilters(); renderVehicles(); renderDriving();
}
window.refreshVehiclesFromSupabase = refreshVehiclesFromSupabase;

function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function toggleSidebar(open) {
  sidebar.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
}

function toggleModal(open) {
  modal.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    uploadError.classList.remove('show');
    uploadError.textContent = '';
    document.getElementById('closeModal').focus();
  }
}

function showView(page) {
  const isVehicles = page === '차량 현황';
  const isContracts = page === '차량계약정보';
  const isDriving = page === '운행기록데이터';
  const isClosing = page === '월별 비용마감자료';
  document.getElementById('closingView').classList.toggle('active', isClosing);
  document.getElementById('dashboardView').classList.toggle('active', !isVehicles && !isContracts && !isDriving && !isClosing);
  document.getElementById('vehiclesView').classList.toggle('active', isVehicles);
  document.getElementById('contractsView').classList.toggle('active', isContracts);
  document.getElementById('drivingView').classList.toggle('active', isDriving);
  document.getElementById('breadcrumbCurrent').textContent = isVehicles ? '차량현황' : isContracts ? '차량계약정보' : isDriving ? '운행기록데이터' : '대시보드';
  document.querySelectorAll('.nav-button').forEach(item => item.classList.toggle('active', item.dataset.page === page));
  if (isClosing) { document.getElementById('breadcrumbCurrent').textContent = page; renderClosing(); }
  if (isDriving) renderDriving();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleContractModal(open) {
  contractModal.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    contractUploadError.classList.remove('show');
    contractUploadError.textContent = '';
    document.getElementById('closeContractModal').focus();
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

  // 확정 마감자료에서 계산하는 월별 렌트비용입니다. 단위: 만원.
const rentMonthlyData = {};
const closingArchive = {};
let closingDraft = null;
let closingEditMonth = null;
const costKeys = ['렌탈료', '주유비', '통행료', '주차비'];
const closingMonthValue = () => document.getElementById('closingMonth').value;
const won = value => `${value.toLocaleString('ko-KR')}원`;
function closingTotals(rows) { return costKeys.map(key => rows.reduce((sum, row) => sum + row[key], 0)); }
function renderClosing() {
  const month = closingMonthValue(), saved = closingArchive[month];
  const isEditing = closingEditMonth === month && closingDraft && closingDraft.month === month;
  const rows = isEditing ? closingDraft.rows : saved ? saved.rows : closingDraft && closingDraft.month === month ? closingDraft.rows : [];
  document.getElementById('closingStatus').textContent = isEditing ? '관리자 수정 중 · 재확정 필요' : saved ? '마감 확정 · 수정 잠금' : rows.length ? '확정 전 검토' : '미마감';
  document.getElementById('closingUpload').disabled = !!saved && !isEditing;
  document.getElementById('closingConfirm').disabled = !rows.length || (!!saved && !isEditing);
  document.getElementById('closingConfirm').textContent = isEditing ? '수정 마감 확정 · 보관파일 저장' : '마감 확정 · 보관파일 저장';
  document.getElementById('closingAdminEdit').style.display = saved && !isEditing ? 'inline-flex' : 'none';
  document.getElementById('closingCorrectionReason').style.display = isEditing ? 'inline-block' : 'none';
  const totals = closingTotals(rows);
  document.getElementById('closingTotal').textContent = rows.length ? `총 비용 ${won(totals.reduce((a,b)=>a+b,0))} · 부가세 포함` : '—';
  document.getElementById('closingRows').innerHTML = rows.length ? rows.map(row=>`<tr>${['본부','부','팀','차량번호'].map(key=>`<td>${escapeHtml(row[key] || '미매칭')}</td>`).join('')}${costKeys.map(key=>`<td>${won(row[key])}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="8" class="empty-table">선택월의 자료를 업로드하거나 보관파일을 불러오세요.</td></tr>';
  document.getElementById('closingArchiveRows').innerHTML = Object.keys(closingArchive).sort().reverse().map(key=>{const item=closingArchive[key], totals=closingTotals(item.rows), revisions=item.revisions||[];return `<tr><td>${escapeHtml(key)}</td><td>${item.rows.length}대</td><td>${won(totals[0])}</td><td>${won(totals.reduce((a,b)=>a+b,0))}</td><td>${escapeHtml(item.confirmedAt)}</td><td>${revisions.length ? `${revisions.length}회` : '없음'}</td><td><button class="row-edit" data-closing-month="${escapeHtml(key)}">조회</button></td></tr>`;}).join('') || '<tr><td colspan="7" class="empty-table">확정된 비용마감자료가 없습니다.</td></tr>';
}
function downloadClosingArchive() {
  if (!Object.keys(closingArchive).length) { showToast('확정된 마감자료가 없습니다.'); return; }
  const url=URL.createObjectURL(new Blob([JSON.stringify({format:'fleet-cost-archive-v1',months:closingArchive},null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`차량비용마감자료_${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function syncClosingDashboard() {
  Object.keys(rentMonthlyData).forEach(key=>delete rentMonthlyData[key]);
  Object.entries(closingArchive).forEach(([month,item])=>rentMonthlyData[month]=closingTotals(item.rows)[0]/10000);
  renderRentChart();
}

function shiftRentMonth(month, offset) {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatRentAmount(value) {
  if (value === null || !Number.isFinite(value)) return '—';
  const amount = Math.round(value);
  const hundredMillion = Math.floor(amount / 10000);
  const remainder = amount % 10000;
  return hundredMillion ? `${hundredMillion}억${remainder ? ` ${remainder.toLocaleString('ko-KR')}만원` : '원'}` : `${amount.toLocaleString('ko-KR')}만원`;
}

function renderRentChart() {
  const reference = document.getElementById('rentReferenceMonth').value;
  const selectedClosing=closingArchive[reference];
  const selectedCosts=selectedClosing ? closingTotals(selectedClosing.rows).slice(1) : null;
  const extraTotal=selectedCosts ? selectedCosts.reduce((a,b)=>a+b,0) : null;
  document.querySelector('.cost-panel .panel-subtitle').textContent=`${reference || '기준월 선택 필요'} · ${selectedClosing ? '확정 마감자료' : '미마감'}`;
  document.querySelector('.cost-total strong').textContent=extraTotal===null?'—':won(extraTotal);
  document.querySelectorAll('.cost-item').forEach((item,index)=>{
    const value=selectedCosts?.[index], ratio=extraTotal ? value/extraTotal*100 : 0;
    item.querySelector('.cost-value').textContent=value===undefined?'—':won(value);
    item.querySelector('small').textContent=selectedCosts ? `전체 부대비용의 ${ratio.toFixed(1)}%` : '확정 자료 없음';
    item.querySelector('.cost-progress i').style.setProperty('--value',`${ratio}%`);
  });
  document.querySelector('.cost-source-note').textContent='선택한 기준월의 확정 비용마감자료입니다. 현재 차량정보와 별도로 집계합니다.';
  const chart = document.getElementById('rentChart');
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(reference);
  const months = valid ? Array.from({ length: 12 }, (_, index) => shiftRentMonth(reference, index - 11)) : [];
  const values = months.map(month => rentMonthlyData[month] ?? null);
  const displayedValues = values.filter(value => Number.isFinite(value));
  const average = displayedValues.length ? displayedValues.reduce((sum, value) => sum + value, 0) / displayedValues.length : null;
  const monthLabel = valid ? `${reference.slice(0, 4)}년 ${Number(reference.slice(5))}월` : '기준월 선택 필요';
  const label = displayedValues.length ? `그래프에 집계된 ${displayedValues.length}개월 평균` : '조회기간 평균';
  document.getElementById('rentAverageAmount').textContent = formatRentAmount(average);
  document.getElementById('rentAverageLabel').textContent = label;
  document.getElementById('rentAverageNote').textContent = !valid ? '조회할 기준월을 선택해 주세요.' : average === null
    ? '선택한 조회기간에 집계된 월 렌트비용이 없습니다.'
    : `확정 마감자료의 월 렌트비용 합계 ÷ ${displayedValues.length}개월 · 미마감 월 제외`;
  if (!valid) {
    document.getElementById('rentChartPeriod').textContent = '기준월을 선택해 주세요.';
    chart.innerHTML = '<title id="rentChartTitle">기준월 선택 필요</title><desc id="rentChartDesc">기준월을 선택하면 최근 12개월을 표시합니다.</desc>';
    return;
  }

  const averages = months.map(() => average);
  document.getElementById('rentChartPeriod').textContent = `${months[0].replace('-', '.')}~${reference.replace('-', '.')} · 최근 12개월 · 부가세 포함 · 단위 만원`;
  const known = [...values, ...averages].filter(value => value !== null);
  const low = 0;
  const high = known.length ? Math.max(low + 1000, Math.ceil(Math.max(...known) / 1000) * 1000) : 12000;
  const yFor = value => 250 - (value - low) / (high - low) * 220;
  let markup = `<title id="rentChartTitle">${monthLabel} 기준 최근 12개월 렌트비용</title><desc id="rentChartDesc">막대는 월 비용, 선은 조회기간의 확정월 전체 평균입니다. 자료가 없는 달은 미집계로 표시합니다.</desc>`;
  for (let tick = 0; tick <= 6; tick++) {
    const y = 30 + tick * 220 / 6;
    const amount = high - tick * (high - low) / 6;
    markup += `<line class="grid-line" x1="78" y1="${y}" x2="920" y2="${y}"/><text class="axis-label" x="67" y="${y + 4}" text-anchor="end">${Math.round(amount).toLocaleString('ko-KR')}</text>`;
  }
  months.forEach((month, index) => {
    const x = 110 + index * 70;
    const value = values[index];
    markup += value === null ? `<text class="future-month" x="${x}" y="235" text-anchor="middle">미집계</text>`
      : `<rect class="rent-bar" x="${x - 11}" y="${yFor(value)}" width="22" height="${250 - yFor(value)}" rx="4"><title>${month.replace('-', '.')} · 월 렌트비용 ${formatRentAmount(value)}</title></rect>`;
    markup += `<text class="month-label" x="${x}" y="271" text-anchor="middle">${Number(month.slice(5))}월</text>`;
  });
  let points = [];
  const flushLine = () => {
    if (points.length > 1) markup += `<polyline class="average-line" points="${points.join(' ')}"/>`;
    points = [];
  };
  averages.forEach((value, index) => {
    if (value === null) { flushLine(); return; }
    points.push(`${110 + index * 70},${yFor(value)}`);
  });
  flushLine();
  averages.forEach((value, index) => {
    if (value !== null) markup += `<circle class="average-dot" cx="${110 + index * 70}" cy="${yFor(value)}" r="${index === 11 ? 4.4 : 3.8}"><title>${months[index].replace('-', '.')} · 전체 평균 ${formatRentAmount(value)}</title></circle>`;
  });
  const years = [];
  months.forEach((month, index) => {
    const year = month.slice(0, 4);
    if (!years.length || years[years.length - 1].year !== year) years.push({ year, start: index, end: index });
    else years[years.length - 1].end = index;
  });
  years.forEach(group => {
    const start = 80 + group.start * 70, end = 150 + group.end * 70;
    markup += `<line class="grid-line" x1="${start}" y1="285" x2="${end}" y2="285"/><text class="year-label" x="${(start + end) / 2}" y="305" text-anchor="middle">${group.year}년</text>`;
  });
  chart.innerHTML = markup;
}

function initials(name) {
  const text = String(name || '-').trim();
  return text === '-' ? '-' : text.slice(-2);
}

function uniqueValues(key, rows = vehicleData) {
  return [...new Set(rows.map(row => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
}

function setSelectOptions(select, label, values) {
  const current = select.value;
  select.innerHTML = `<option value="">전체 ${label}</option>` + values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  if (values.includes(current)) select.value = current;
}

function refreshFilters() {
  const headquarters = document.getElementById('headquartersFilter');
  const division = document.getElementById('divisionFilter');
  const team = document.getElementById('teamFilter');
  setSelectOptions(headquarters, '본부', uniqueValues('본부'));
  const divisionRows = headquarters.value ? vehicleData.filter(row => row['본부'] === headquarters.value) : vehicleData;
  setSelectOptions(division, '부', uniqueValues('부', divisionRows));
  const teamRows = divisionRows.filter(row => !division.value || row['부'] === division.value);
  setSelectOptions(team, '팀', uniqueValues('팀', teamRows));
}

function renderVehicles() {
  const keyword = document.getElementById('vehicleSearch').value.trim().toLowerCase();
  const headquarters = document.getElementById('headquartersFilter').value;
  const division = document.getElementById('divisionFilter').value;
  const team = document.getElementById('teamFilter').value;
  const filtered = vehicleData.map((row, index) => ({ row, index })).filter(item => {
    const row = item.row;
    const matchesFilter = (!headquarters || row['본부'] === headquarters) && (!division || row['부'] === division) && (!team || row['팀'] === team);
    const searchable = requiredColumns.map(key => row[key]).join(' ').toLowerCase();
    return matchesFilter && (!keyword || searchable.includes(keyword));
  });
  const body = document.getElementById('vehicleTableBody');
  body.innerHTML = filtered.length ? filtered.map(item => { const row = item.row; return `<tr>
    <td>${escapeHtml(row['본부'])}</td><td>${escapeHtml(row['부'])}</td><td>${escapeHtml(row['팀'])}</td>
    <td><div class="person"><span class="person-avatar">${escapeHtml(initials(row['담당자(정)']))}</span><strong>${escapeHtml(row['담당자(정)'] || '-')}</strong></div></td>
    <td><div class="person secondary"><span class="person-avatar">${escapeHtml(initials(row['담당자(부)']))}</span><span>${escapeHtml(row['담당자(부)'] || '-')}</span></div></td>
    <td class="plate">${escapeHtml(row['차량번호'])}</td><td>${escapeHtml(row['차종'])}</td><td>${escapeHtml(row['지역'] || '-')}</td><td>${escapeHtml(row['주차장'] || '-')}</td><td><button class="row-edit" data-vehicle-edit="${item.index}">수정</button></td>
  </tr>`; }).join('') : '<tr><td class="empty-table" colspan="10">조건에 맞는 차량이 없습니다.</td></tr>';
  document.getElementById('recordCount').textContent = `${filtered.length}건`;
  document.getElementById('totalVehicles').textContent = `${vehicleData.length}대`;
  document.getElementById('totalHeadquarters').textContent = `${uniqueValues('본부').length}개`;
  document.getElementById('totalManagers').textContent = `${uniqueValues('담당자(정)').length}명`;
}

function parseYearMonth(value) {
  const match = String(value || '').trim().match(/(\d{4})\D*(\d{1,2})/);
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year, month } : null;
}

function normalizeYearMonth(value) {
  const parsed = parseYearMonth(value);
  return parsed ? `${parsed.year}-${String(parsed.month).padStart(2, '0')}` : String(value || '').trim();
}

function monthSpan(start, end) {
  const from = parseYearMonth(start), to = parseYearMonth(end);
  if (!from || !to) return 0;
  return Math.max(0, (to.year - from.year) * 12 + to.month - from.month + 1);
}

function remainingMonths(end) {
  const to = parseYearMonth(end), now = new Date();
  if (!to) return 0;
  return Math.max(0, (to.year - now.getFullYear()) * 12 + to.month - (now.getMonth() + 1) + 1);
}

function formatYearMonth(value) {
  const parsed = parseYearMonth(value);
  return parsed ? `${parsed.year}.${String(parsed.month).padStart(2, '0')}` : value;
}

function rentalNumber(value) {
  return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
}

function contractUniqueValues(key, rows = contractData) {
  return [...new Set(rows.map(row => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
}

function refreshContractFilters() {
  const headquarters = document.getElementById('contractHeadquartersFilter');
  const division = document.getElementById('contractDivisionFilter');
  const team = document.getElementById('contractTeamFilter');
  setSelectOptions(headquarters, '본부', contractUniqueValues('본부'));
  const divisionRows = headquarters.value ? contractData.filter(row => row['본부'] === headquarters.value) : contractData;
  setSelectOptions(division, '부', contractUniqueValues('부', divisionRows));
  const teamRows = divisionRows.filter(row => !division.value || row['부'] === division.value);
  setSelectOptions(team, '팀', contractUniqueValues('팀', teamRows));
}

function renderContracts() {
  const keyword = document.getElementById('contractSearch').value.trim().toLowerCase();
  const headquarters = document.getElementById('contractHeadquartersFilter').value;
  const division = document.getElementById('contractDivisionFilter').value;
  const team = document.getElementById('contractTeamFilter').value;
  const filtered = contractData.map((row, index) => ({ row, index })).filter(item => {
    const row = item.row;
    const matchesFilter = (!headquarters || row['본부'] === headquarters) && (!division || row['부'] === division) && (!team || row['팀'] === team);
    const searchable = contractColumns.map(key => row[key]).join(' ').toLowerCase();
    return matchesFilter && (!keyword || searchable.includes(keyword));
  });
  const body = document.getElementById('contractTableBody');
  body.innerHTML = filtered.length ? filtered.map(item => { const row = item.row;
    const total = monthSpan(row['계약시작'], row['계약종료']);
    const remaining = remainingMonths(row['계약종료']);
    const stateClass = remaining <= 3 ? 'urgent' : remaining <= 12 ? 'soon' : '';
    const remainingText = remaining ? `${remaining}개월 남음` : '계약 종료';
    return `<tr>
      <td>${escapeHtml(row['본부'])}</td><td>${escapeHtml(row['부'])}</td><td>${escapeHtml(row['팀'])}</td>
      <td><div class="person"><span class="person-avatar">${escapeHtml(initials(row['담당자(정)']))}</span><strong>${escapeHtml(row['담당자(정)'] || '-')}</strong></div></td>
      <td><div class="person secondary"><span class="person-avatar">${escapeHtml(initials(row['담당자(부)']))}</span><span>${escapeHtml(row['담당자(부)'] || '-')}</span></div></td>
      <td>${escapeHtml(row['차종'])}</td><td class="plate">${escapeHtml(row['차량번호'])}</td><td class="money">${rentalNumber(row['렌탈료']).toLocaleString('ko-KR')}원</td>
      <td><div class="contract-period"><strong>${escapeHtml(formatYearMonth(row['계약시작']))} ~ ${escapeHtml(formatYearMonth(row['계약종료']))}</strong></div></td>
      <td><div class="contract-period"><strong>총 ${total}개월</strong><span class="remaining-badge ${stateClass}">${remainingText}</span></div></td><td><button class="row-edit" data-contract-edit="${item.index}">수정</button></td>
    </tr>`;
  }).join('') : '<tr><td class="empty-table" colspan="11">조건에 맞는 계약정보가 없습니다.</td></tr>';
  const totalFee = contractData.reduce((sum, row) => sum + rentalNumber(row['렌탈료']), 0);
  document.getElementById('dashboardContractAmount').textContent = `${totalFee.toLocaleString('ko-KR')}원`;
  const expiring = contractData.filter(row => { const months = remainingMonths(row['계약종료']); return months > 0 && months <= 12; }).length;
  document.getElementById('contractRecordCount').textContent = `${filtered.length}건`;
  document.getElementById('totalContracts').textContent = `${contractData.length}대`;
  document.getElementById('totalRentalFee').textContent = `${Math.round(totalFee / 10000).toLocaleString('ko-KR')}만원`;
  document.getElementById('contractsExpiring').textContent = `${expiring}대`;
}

function normalizePlate(value) {
  return String(value || '').replace(/\s/g, '').toUpperCase();
}

function vehicleForPlate(plate) {
  const normalized = normalizePlate(plate);
  return vehicleData.find(row => normalizePlate(row['차량번호']) === normalized) || null;
}

function normalizeDrivingDate(value) {
  const text = String(value ?? '').trim();
  let match = text.match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match && /^\d{8}$/.test(text)) match = [text, text.slice(0, 4), text.slice(4, 6), text.slice(6, 8)];
  if (!match) return '';
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function mileageNumber(value) {
  return Number(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0;
}

function distanceForItems(items) {
  return items.reduce((sum, item) => sum + mileageNumber(item.row['키로수']), 0);
}

function drivingRowMonth(row) { return normalizeDrivingDate(row['운행년월일']).slice(0,7); }
function drivingOrganization(row) { return drivingArchive[drivingRowMonth(row)] ? row._organization : vehicleForPlate(row['차량번호']); }
function mergeDrivingRows(incoming) {
  const next=drivingData.slice(), keys=new Map(next.map((row,index)=>[normalizePlate(row['차량번호'])+'|'+drivingRowMonth(row),index]));
  let added=0, duplicate=0, locked=0;
  for(const row of incoming){
    if(drivingArchive[drivingRowMonth(row)]){locked++;continue;}
    const key=normalizePlate(row['차량번호'])+'|'+drivingRowMonth(row);
    if(keys.has(key)){if(mileageNumber(next[keys.get(key)]['키로수'])!==mileageNumber(row['키로수']))throw Error(`${row['차량번호']} ${row['운행년월일']}: 기존 기록과 키로수가 다릅니다. 미확정 기록의 수정 기능으로 확인하세요.`);duplicate++;continue;}
    keys.set(key,next.length);next.push(row);added++;
  }
  drivingData=next;return {added,duplicate,locked};
}
function drivingReportForMonth(month) {
  const groups=new Map();
  drivingData.filter(row=>drivingRowMonth(row)===month).forEach(row=>{
    const org=drivingOrganization(row);if(!org)return;
    const key=JSON.stringify([org['본부'],org['부'],org['팀']]);
    if(!groups.has(key))groups.set(key,{org,vehicles:new Map(),days:new Set()});
    const group=groups.get(key),plate=normalizePlate(row['차량번호']);
    if(!group.vehicles.has(plate))group.vehicles.set(plate,[]);
    group.vehicles.get(plate).push({row});group.days.add(normalizeDrivingDate(row['운행년월일']));
  });
  return [...groups.values()].map(group=>{const distance=[...group.vehicles.values()].reduce((sum,items)=>sum+distanceForItems(items),0);return {'본부':group.org['본부'],'부':group.org['부'],'팀':group.org['팀'],'운행 차량':group.vehicles.size,'월 주행거리(km)':distance,'운행일수':'자료 없음','차량당 평균(km)':Math.round(distance/group.vehicles.size)};}).sort((a,b)=>b['월 주행거리(km)']-a['월 주행거리(km)']);
}
function drivingReportMarkup(rows) { return rows.map(row=>`<tr>${['본부','부','팀'].map(key=>`<td>${escapeHtml(row[key])}</td>`).join('')}<td>${row['운행 차량']}대</td><td>${row['월 주행거리(km)'].toLocaleString('ko-KR')}km</td><td>${row['운행일수']}</td><td>${row['차량당 평균(km)'].toLocaleString('ko-KR')}km</td></tr>`).join(''); }
function renderDashboardUsage() {
  const month=document.getElementById('dashboardUsageMonth').value,item=drivingArchive[month];
  document.getElementById('dashboardUsageStatus').textContent=item ? `${month} · 확정자료 ${item.rows.length}건 · 확정 당시 부서 기준` : `${month || '보고월 선택 필요'} · 확정된 운행자료 없음`;
  document.getElementById('dashboardUsageRows').innerHTML=item ? drivingReportMarkup(drivingReportForMonth(month)) : '<tr><td colspan="7" class="empty-table">운행기록데이터에서 해당 월을 확정하거나 보관파일을 불러오세요.</td></tr>';
}
function renderDrivingArchive() {
  const month=document.getElementById('usageMonth').value,saved=drivingArchive[month],rows=drivingData.filter(row=>drivingRowMonth(row)===month);
  document.getElementById('drivingArchiveStatus').textContent=saved ? `${month} · 마감 확정 · 수정 잠금` : `${month || '조회월 선택 필요'} · 미확정`;
  document.getElementById('confirmDrivingMonth').disabled=!!saved||!rows.length;
  document.getElementById('drivingSourceFileName').textContent=saved ? '확정 보관자료' : rows.length ? '미확정 운행자료' : '자료 없음';
  document.getElementById('drivingSourceUpdated').textContent=saved ? `확정일 ${saved.confirmedAt}` : '월별 보관 · 확정 전';
  const months=[...new Set(drivingData.map(drivingRowMonth))].sort().reverse();
  document.getElementById('drivingArchiveList').innerHTML=months.map(key=>`<tr><td>${escapeHtml(key)}</td><td>${drivingData.filter(row=>drivingRowMonth(row)===key).length}건</td><td>${drivingArchive[key]?'확정':'미확정'}</td><td>${escapeHtml(drivingArchive[key]?.confirmedAt || '—')}</td><td><button class="row-edit" data-driving-month="${escapeHtml(key)}">조회</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty-table">운행자료를 업로드하면 월도별로 표시됩니다.</td></tr>';
  renderDashboardUsage();
}
function downloadDrivingArchiveFile() {
  if(!Object.keys(drivingArchive).length){showToast('확정된 운행자료가 없습니다.');return;}
  const url=URL.createObjectURL(new Blob([JSON.stringify({format:'fleet-driving-monthly-v2',months:drivingArchive},null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`운행확정보관자료_${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderDriving() {
  const month = document.getElementById('usageMonth').value;
  const keyword = document.getElementById('drivingSearch').value.trim().toLowerCase();
  const monthlyItems = drivingData.map((row, index) => ({ row, index, vehicle: drivingOrganization(row) }))
    .filter(item => normalizeDrivingDate(item.row['운행년월일']).slice(0, 7) === month);
  const matchedItems = monthlyItems.filter(item => item.vehicle);
  const unmatchedItems = monthlyItems.filter(item => !item.vehicle);

  const byVehicle = new Map();
  matchedItems.forEach(item => {
    const key = normalizePlate(item.row['차량번호']);
    if (!byVehicle.has(key)) byVehicle.set(key, []);
    byVehicle.get(key).push(item);
  });
  const totalDistance = [...byVehicle.values()].reduce((sum, items) => sum + distanceForItems(items), 0);
  document.getElementById('usageVehicleCount').textContent = `${byVehicle.size}대`;
  document.getElementById('usageTotalDistance').textContent = `${totalDistance.toLocaleString('ko-KR')}km`;
  document.getElementById('usageUnmatchedCount').textContent = `${unmatchedItems.length}건`;

  const filtered = monthlyItems.filter(item => {
    const vehicle = item.vehicle || {};
    const searchable = [item.row['차량번호'], vehicle['본부'], vehicle['부'], vehicle['팀'], vehicle['차종']].join(' ').toLowerCase();
    return !keyword || searchable.includes(keyword);
  }).sort((a, b) => normalizeDrivingDate(b.row['운행년월일']).localeCompare(normalizeDrivingDate(a.row['운행년월일'])) || normalizePlate(a.row['차량번호']).localeCompare(normalizePlate(b.row['차량번호']), 'ko'));
  document.getElementById('drivingTableBody').innerHTML = filtered.length ? filtered.map(item => {
    const vehicle = item.vehicle;
    const date = normalizeDrivingDate(item.row['운행년월일']).replaceAll('-', '.');
    return `<tr class="${vehicle ? '' : 'unmatched-row'}">
      <td>${escapeHtml(date)}</td><td>${escapeHtml(vehicle ? vehicle['본부'] : '미매칭')}</td><td>${escapeHtml(vehicle ? vehicle['부'] : '-')}</td><td>${escapeHtml(vehicle ? vehicle['팀'] : '-')}</td>
      <td class="plate">${escapeHtml(item.row['차량번호'])}</td><td>${escapeHtml(vehicle ? vehicle['차종'] : '-')}</td><td class="distance-value">${mileageNumber(item.row['키로수']).toLocaleString('ko-KR')}km</td>
      <td><span class="match-pill ${vehicle ? '' : 'unmatched'}">${vehicle ? '연결 완료' : '차량현황 확인'}</span></td><td>${drivingArchive[month] ? '확정 · 잠금' : `<button class="row-edit" data-driving-edit="${item.index}">수정</button>`}</td>
    </tr>`;
  }).join('') : '<tr><td class="empty-table" colspan="9">조건에 맞는 운행기록이 없습니다.</td></tr>';
  document.getElementById('drivingRecordCount').textContent = `${filtered.length}건`;
  renderDrivingArchive();
}

function showContractUploadError(message) {
  contractUploadError.textContent = message;
  contractUploadError.classList.add('show');
}

function toggleDrivingUploadModal(open) {
  drivingUploadModal.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    drivingUploadError.classList.remove('show');
    drivingUploadError.textContent = '';
    document.getElementById('closeDrivingUpload').focus();
  }
}

function showDrivingUploadError(message) {
  drivingUploadError.textContent = message;
  drivingUploadError.classList.add('show');
}

async function readContractFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (file.size > 20 * 1024 * 1024) throw new Error('파일 크기는 20MB 이하여야 합니다.');
  let rows;
  if (window.XLSX) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
  } else if (extension === 'csv') rows = parseCsv(await file.text());
  else throw new Error('Excel 읽기 기능을 불러오지 못했습니다. 잠시 후 다시 시도하거나 CSV 파일을 사용해 주세요.');
  if (!rows.length) throw new Error('파일에 표시할 계약정보가 없습니다.');
  const normalize = value => String(value).replace(/\s/g, '');
  const headerMap = Object.keys(rows[0]).reduce((map, key) => (map[normalize(key)] = key, map), {});
  const missing = contractColumns.filter(column => !headerMap[normalize(column)]);
  if (missing.length) throw new Error(`필수 열이 없습니다: ${missing.join(', ')}`);
  const cleanRows = rows.map(row => Object.fromEntries(contractColumns.map(column => [column, String(row[headerMap[normalize(column)]] ?? '').trim()])))
    .filter(row => contractColumns.some(column => row[column]));
  cleanRows.forEach((row, index) => {
    row['계약시작'] = normalizeYearMonth(row['계약시작']);
    row['계약종료'] = normalizeYearMonth(row['계약종료']);
    if (!parseYearMonth(row['계약시작']) || !parseYearMonth(row['계약종료'])) throw new Error(`${index + 2}행의 계약시작 또는 계약종료 형식을 확인해 주세요.`);
  });
  if (!cleanRows.length) throw new Error('필수 열 아래에 입력된 데이터가 없습니다.');
  return cleanRows;
}

function openVehicleForm(index = null) {
  editingVehicleIndex = index;
  document.getElementById('vehicleForm').reset();
  document.getElementById('vehicleFormError').classList.remove('show');
  document.getElementById('vehicleFormTitle').textContent = index === null ? '차량현황 직접 추가' : '차량현황 정보 수정';
  if (index !== null) {
    const row = vehicleData[index];
    document.getElementById('vfHeadquarters').value = row['본부'];
    document.getElementById('vfDivision').value = row['부'];
    document.getElementById('vfTeam').value = row['팀'];
    document.getElementById('vfPrimary').value = row['담당자(정)'];
    document.getElementById('vfSecondary').value = row['담당자(부)'];
    document.getElementById('vfPlate').value = row['차량번호'];
    document.getElementById('vfModel').value = row['차종'];
    document.getElementById('vfRegion').value = row['지역'] || '';
    document.getElementById('vfParking').value = row['주차장'] || '';
  }
  vehicleFormModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('vfHeadquarters').focus(), 0);
}

function closeVehicleForm() {
  vehicleFormModal.classList.remove('open');
  document.body.style.overflow = '';
}

function vehicleSupabasePayload(row) {
  return {
    vehicle_number: row['차량번호'], vehicle_model: row['차종'], region: row['지역'], parking_lot: row['주차장'],
    headquarters: row['본부'], division: row['부'], team: row['팀'],
    primary_manager: row['담당자(정)'], secondary_manager: row['담당자(부)']
  };
}

async function saveVehicleToSupabase(row, index) {
  if (!window.fleetCurrentUser || !window.fleetSupabaseClient) return null;
  const payload = vehicleSupabasePayload(row);
  if (index !== null && vehicleData[index]?._supabaseId) {
    const { error } = await window.fleetSupabaseClient.from('vehicles').update(payload).eq('id', vehicleData[index]._supabaseId);
    if (error) throw error;
    return 'updated';
  }
  const { error } = await window.fleetSupabaseClient.from('vehicles').insert(payload);
  if (error) throw error;
  return 'inserted';
}

async function saveVehicleFileToSupabase(rows) {
  if (!window.fleetCurrentUser || !window.fleetSupabaseClient) return false;
  const payload = rows.map(vehicleSupabasePayload);
  const { error } = await window.fleetSupabaseClient.from('vehicles').upsert(payload, { onConflict: 'vehicle_number_normalized' });
  if (error) throw error;
  return true;
}

function openContractForm(index = null) {
  editingContractIndex = index;
  document.getElementById('contractForm').reset();
  document.getElementById('contractFormError').classList.remove('show');
  document.getElementById('contractFormTitle').textContent = index === null ? '차량계약정보 직접 추가' : '차량계약정보 수정';
  if (index !== null) {
    const row = contractData[index];
    document.getElementById('cfHeadquarters').value = row['본부'];
    document.getElementById('cfDivision').value = row['부'];
    document.getElementById('cfTeam').value = row['팀'];
    document.getElementById('cfPrimary').value = row['담당자(정)'];
    document.getElementById('cfSecondary').value = row['담당자(부)'];
    document.getElementById('cfModel').value = row['차종'];
    document.getElementById('cfPlate').value = row['차량번호'];
    document.getElementById('cfFee').value = rentalNumber(row['렌탈료']);
    document.getElementById('cfStart').value = normalizeYearMonth(row['계약시작']);
    document.getElementById('cfEnd').value = normalizeYearMonth(row['계약종료']);
  }
  contractFormModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('cfHeadquarters').focus(), 0);
}

function closeContractForm() {
  contractFormModal.classList.remove('open');
  document.body.style.overflow = '';
}

function openDrivingForm(index = null) {
  editingDrivingIndex = index;
  document.getElementById('drivingForm').reset();
  document.getElementById('drivingFormError').classList.remove('show');
  document.getElementById('drivingFormTitle').textContent = index === null ? '운행기록 직접 추가' : '운행기록 수정';
  if (index !== null) {
    const row = drivingData[index];
    document.getElementById('dfPlate').value = row['차량번호'];
    document.getElementById('dfMileage').value = mileageNumber(row['키로수']);
    document.getElementById('dfDate').value = normalizeDrivingDate(row['운행년월일']);
  }
  drivingFormModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('dfPlate').focus(), 0);
}

function closeDrivingForm() {
  drivingFormModal.classList.remove('open');
  document.body.style.overflow = '';
}

function downloadExcel(rows, sheetName, fileName) {
  if (!window.XLSX) { showToast('Excel 기능을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'); return; }
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
  showToast(`${fileName} 파일을 내려받았습니다.`);
}

function downloadTemplate(columns, sheetName, fileName) {
  if (!window.XLSX) { showToast('Excel 기능을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'); return; }
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([columns]);
  worksheet['!cols'] = columns.map(column => ({ wch: Math.max(12, String(column).length * 2 + 4) }));
  worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s:{ c:0, r:0 }, e:{ c:columns.length - 1, r:0 } }) };
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
  showToast(`${fileName} 입력 양식을 내려받았습니다.`);
}

function exportVehicleData() {
  downloadExcel(vehicleData.map(row => Object.fromEntries(requiredColumns.map(column => [column, row[column] || '']))), '차량현황', '차량현황.xlsx');
}

function exportContractData() {
  const rows = contractData.map(row => {
    const total = monthSpan(row['계약시작'], row['계약종료']);
    const remaining = remainingMonths(row['계약종료']);
    return {
      '본부': row['본부'], '부': row['부'], '팀': row['팀'], '담당자(정)': row['담당자(정)'], '담당자(부)': row['담당자(부)'],
      '차종': row['차종'], '차량번호': row['차량번호'], '렌탈료': rentalNumber(row['렌탈료']),
      '계약시작': normalizeYearMonth(row['계약시작']), '계약종료': normalizeYearMonth(row['계약종료']),
      '계약기간': `${formatYearMonth(row['계약시작'])} ~ ${formatYearMonth(row['계약종료'])}`,
      '총계약기간': `${total}개월`, '남은계약기간': remaining ? `${remaining}개월` : '계약 종료'
    };
  });
  downloadExcel(rows, '차량계약정보', '차량계약정보.xlsx');
}

function exportDrivingData() {
  const month=document.getElementById('usageMonth').value;
  const rows = drivingData.filter(row=>drivingRowMonth(row)===month).map(row => {
    const vehicle = drivingOrganization(row);
    return {
      '운행년월일': normalizeDrivingDate(row['운행년월일']), '차량번호': row['차량번호'], '키로수': mileageNumber(row['키로수']),
      '본부': vehicle ? vehicle['본부'] : '', '부': vehicle ? vehicle['부'] : '', '팀': vehicle ? vehicle['팀'] : '',
      '차종': vehicle ? vehicle['차종'] : '', '매칭상태': vehicle ? '연결 완료' : '미매칭'
    };
  });
  downloadExcel(rows, '운행기록데이터', `운행기록데이터_${month}.xlsx`);
}

function downloadVehicleTemplate() {
  downloadTemplate(requiredColumns, '차량현황 양식', '차량현황_업로드양식.xlsx');
}

function downloadContractTemplate() {
  downloadTemplate(contractColumns, '차량계약정보 양식', '차량계약정보_업로드양식.xlsx');
}

function downloadDrivingTemplate() {
  downloadTemplate(drivingColumns, '운행기록 양식', '운행기록데이터_업로드양식.xlsx');
}

function downloadClosingTemplate() {
  downloadTemplate(['차량번호', '렌탈료', '주유비', '통행료', '주차비', '본부', '부', '팀'], '월별 비용마감 양식', '월별비용마감_업로드양식.xlsx');
}

function showUploadError(message) {
  uploadError.textContent = message;
  uploadError.classList.add('show');
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i], next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell); if (row.some(value => value.trim())) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  row.push(cell); if (row.some(value => value.trim())) rows.push(row);
  const headers = (rows.shift() || []).map(value => value.replace(/^\uFEFF/, '').trim());
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

async function readVehicleFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (file.size > 20 * 1024 * 1024) throw new Error('파일 크기는 20MB 이하여야 합니다.');
  let rows;
  if (window.XLSX) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  } else if (extension === 'csv') {
    rows = parseCsv(await file.text());
  } else {
    throw new Error('Excel 읽기 기능을 불러오지 못했습니다. 잠시 후 다시 시도하거나 CSV 파일을 사용해 주세요.');
  }
  if (!rows.length) throw new Error('파일에 표시할 데이터가 없습니다.');
  const normalize = value => String(value).replace(/\s/g, '');
  const headerMap = Object.keys(rows[0]).reduce((map, key) => (map[normalize(key)] = key, map), {});
  const missing = requiredColumns.filter(column => !headerMap[normalize(column)]);
  if (missing.length) throw new Error(`필수 열이 없습니다: ${missing.join(', ')}`);
  const cleanRows = rows.map(row => Object.fromEntries(requiredColumns.map(column => [column, String(row[headerMap[normalize(column)]] ?? '').trim()])))
    .filter(row => requiredColumns.some(column => row[column]));
  if (!cleanRows.length) throw new Error('필수 열 아래에 입력된 데이터가 없습니다.');
  return cleanRows;
}

async function readDrivingFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (file.size > 20 * 1024 * 1024) throw new Error('파일 크기는 20MB 이하여야 합니다.');
  let rows;
  if (window.XLSX) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
  } else if (extension === 'csv') rows = parseCsv(await file.text());
  else throw new Error('Excel 읽기 기능을 불러오지 못했습니다. 잠시 후 다시 시도하거나 CSV 파일을 사용해 주세요.');
  if (!rows.length) throw new Error('파일에 표시할 운행기록이 없습니다.');
  const normalize = value => String(value).replace(/\s/g, '');
  const headerMap = Object.keys(rows[0]).reduce((map, key) => (map[normalize(key)] = key, map), {});
  const missing = drivingColumns.filter(column => !headerMap[normalize(column)]);
  if (missing.length) throw new Error(`필수 열이 없습니다: ${missing.join(', ')}`);
  const cleanRows = rows.map(row => Object.fromEntries(drivingColumns.map(column => [column, String(row[headerMap[normalize(column)]] ?? '').trim()])))
    .filter(row => drivingColumns.some(column => row[column]));
  cleanRows.forEach((row, index) => {
    const date = normalizeDrivingDate(row['운행년월일']);
    const mileageText = String(row['키로수']).replace(/[,\skm킬로미터]/gi, '');
    if (!row['차량번호']) throw new Error(`${index + 2}행의 차량번호를 확인해 주세요.`);
    if (!date) throw new Error(`${index + 2}행의 운행년월일 형식을 확인해 주세요. 예: 2026-09-16`);
    if (mileageText === '' || !Number.isFinite(Number(mileageText)) || Number(mileageText) < 0) throw new Error(`${index + 2}행의 키로수를 숫자로 입력해 주세요.`);
    row['운행년월일'] = date;
    row['키로수'] = String(Number(mileageText));
  });
  if (!cleanRows.length) throw new Error('필수 열 아래에 입력된 데이터가 없습니다.');
  return cleanRows.sort((a, b) => normalizeDrivingDate(a['운행년월일']).localeCompare(normalizeDrivingDate(b['운행년월일'])));
}

document.getElementById('menuButton').addEventListener('click', () => toggleSidebar(true));
scrim.addEventListener('click', () => toggleSidebar(false));
['vehicleUploadButton', 'guideUploadButton'].forEach(id => document.getElementById(id).addEventListener('click', () => toggleModal(true)));
document.getElementById('closeModal').addEventListener('click', () => toggleModal(false));
document.getElementById('cancelUpload').addEventListener('click', () => toggleModal(false));
modal.addEventListener('click', event => { if (event.target === modal) toggleModal(false); });
['contractUploadButton', 'contractGuideUploadButton'].forEach(id => document.getElementById(id).addEventListener('click', () => toggleContractModal(true)));
document.getElementById('closeContractModal').addEventListener('click', () => toggleContractModal(false));
document.getElementById('cancelContractUpload').addEventListener('click', () => toggleContractModal(false));
contractModal.addEventListener('click', event => { if (event.target === contractModal) toggleContractModal(false); });
['drivingUploadButton', 'drivingGuideUploadButton'].forEach(id => document.getElementById(id).addEventListener('click', () => toggleDrivingUploadModal(true)));
document.getElementById('closeDrivingUpload').addEventListener('click', () => toggleDrivingUploadModal(false));
document.getElementById('cancelDrivingUpload').addEventListener('click', () => toggleDrivingUploadModal(false));
drivingUploadModal.addEventListener('click', event => { if (event.target === drivingUploadModal) toggleDrivingUploadModal(false); });
document.getElementById('addVehicleButton').addEventListener('click', () => openVehicleForm());
document.getElementById('addContractButton').addEventListener('click', () => openContractForm());
document.getElementById('addDrivingButton').addEventListener('click', () => openDrivingForm());
document.getElementById('exportVehiclesButton').addEventListener('click', exportVehicleData);
document.getElementById('exportContractsButton').addEventListener('click', exportContractData);
document.getElementById('exportDrivingButton').addEventListener('click', exportDrivingData);
document.getElementById('downloadVehicleTemplate').addEventListener('click', downloadVehicleTemplate);
document.getElementById('downloadContractTemplate').addEventListener('click', downloadContractTemplate);
document.getElementById('downloadDrivingTemplate').addEventListener('click', downloadDrivingTemplate);
document.getElementById('closeVehicleForm').addEventListener('click', closeVehicleForm);
document.getElementById('cancelVehicleForm').addEventListener('click', closeVehicleForm);
document.getElementById('closeContractForm').addEventListener('click', closeContractForm);
document.getElementById('cancelContractForm').addEventListener('click', closeContractForm);
document.getElementById('closeDrivingForm').addEventListener('click', closeDrivingForm);
document.getElementById('cancelDrivingForm').addEventListener('click', closeDrivingForm);
vehicleFormModal.addEventListener('click', event => { if (event.target === vehicleFormModal) closeVehicleForm(); });
contractFormModal.addEventListener('click', event => { if (event.target === contractFormModal) closeContractForm(); });
drivingFormModal.addEventListener('click', event => { if (event.target === drivingFormModal) closeDrivingForm(); });

document.getElementById('vehicleTableBody').addEventListener('click', event => {
  const button = event.target.closest('[data-vehicle-edit]');
  if (button) openVehicleForm(Number(button.dataset.vehicleEdit));
});
document.getElementById('contractTableBody').addEventListener('click', event => {
  const button = event.target.closest('[data-contract-edit]');
  if (button) openContractForm(Number(button.dataset.contractEdit));
});
document.getElementById('drivingTableBody').addEventListener('click', event => {
  const button = event.target.closest('[data-driving-edit]');
  if (button) openDrivingForm(Number(button.dataset.drivingEdit));
});

document.getElementById('vehicleForm').addEventListener('submit', async event => {
  event.preventDefault();
  const formError = document.getElementById('vehicleFormError');
  formError.classList.remove('show');
  const row = {
    '본부': document.getElementById('vfHeadquarters').value.trim(),
    '부': document.getElementById('vfDivision').value.trim(),
    '팀': document.getElementById('vfTeam').value.trim(),
    '담당자(정)': document.getElementById('vfPrimary').value.trim(),
    '담당자(부)': document.getElementById('vfSecondary').value.trim(),
    '차량번호': document.getElementById('vfPlate').value.trim(),
    '차종': document.getElementById('vfModel').value.trim(),
    '지역': document.getElementById('vfRegion').value.trim(),
    '주차장': document.getElementById('vfParking').value.trim()
  };
  try {
    const saved = await saveVehicleToSupabase(row, editingVehicleIndex);
    if (saved) {
      await refreshVehiclesFromSupabase();
    } else {
      if (editingVehicleIndex === null) vehicleData.push(row); else vehicleData[editingVehicleIndex] = row;
      refreshFilters(); renderVehicles(); renderDriving();
    }
    closeVehicleForm();
    showToast(editingVehicleIndex === null ? '차량정보를 추가했습니다.' : '차량정보를 수정했습니다.');
  } catch (error) {
    console.error('차량정보 저장 오류', error);
    formError.textContent = error.code === '23505' ? '같은 차량번호가 이미 등록되어 있습니다.' : '저장하지 못했습니다. 관리자 권한과 입력값을 확인해 주세요.';
    formError.classList.add('show');
  }
});

document.getElementById('contractForm').addEventListener('submit', event => {
  event.preventDefault();
  const start = document.getElementById('cfStart').value;
  const end = document.getElementById('cfEnd').value;
  if (!monthSpan(start, end)) {
    const error = document.getElementById('contractFormError');
    error.textContent = '계약종료는 계약시작과 같거나 이후여야 합니다.';
    error.classList.add('show');
    return;
  }
  const row = {
    '본부': document.getElementById('cfHeadquarters').value.trim(),
    '부': document.getElementById('cfDivision').value.trim(),
    '팀': document.getElementById('cfTeam').value.trim(),
    '담당자(정)': document.getElementById('cfPrimary').value.trim(),
    '담당자(부)': document.getElementById('cfSecondary').value.trim(),
    '차종': document.getElementById('cfModel').value.trim(),
    '차량번호': document.getElementById('cfPlate').value.trim(),
    '렌탈료': document.getElementById('cfFee').value,
    '계약시작': start,
    '계약종료': end
  };
  if (editingContractIndex === null) contractData.push(row); else contractData[editingContractIndex] = row;
  refreshContractFilters(); renderContracts(); closeContractForm();
  showToast(editingContractIndex === null ? '차량계약정보를 추가했습니다.' : '차량계약정보를 수정했습니다.');
});

document.getElementById('drivingForm').addEventListener('submit', event => {
  event.preventDefault();
  const plate = document.getElementById('dfPlate').value.trim();
  const mileage = Number(document.getElementById('dfMileage').value);
  const date = normalizeDrivingDate(document.getElementById('dfDate').value);
  const error = document.getElementById('drivingFormError');
  if (!plate || !date || document.getElementById('dfMileage').value.trim()==='' || !Number.isFinite(mileage) || mileage < 0) {
    error.textContent = '차량번호, 월 이동키로수, 운행년월일을 올바르게 입력해 주세요.';
    error.classList.add('show');
    return;
  }
  const row = { '차량번호': plate, '키로수': String(mileage), '운행년월일': date };
  if(drivingArchive[date.slice(0,7)] || (editingDrivingIndex!==null && drivingArchive[drivingRowMonth(drivingData[editingDrivingIndex])])){error.textContent='확정된 월의 기록은 추가하거나 수정할 수 없습니다.';error.classList.add('show');return;}
  if(drivingData.some((item,index)=>index!==editingDrivingIndex && normalizePlate(item['차량번호'])===normalizePlate(plate) && drivingRowMonth(item)===date.slice(0,7))){error.textContent='같은 차량과 월의 기록이 이미 있습니다. 기존 기록을 수정하세요.';error.classList.add('show');return;}
  if (editingDrivingIndex === null) drivingData.push(row); else drivingData[editingDrivingIndex] = row;
  document.getElementById('usageMonth').value = date.slice(0, 7);
  renderDriving(); closeDrivingForm();
  showToast(editingDrivingIndex === null ? '운행기록을 추가했습니다.' : '운행기록을 수정했습니다.');
});

fileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (file) {
    document.getElementById('fileLabel').textContent = file.name;
    uploadError.classList.remove('show');
  }
});

contractFileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (file) {
    document.getElementById('contractFileLabel').textContent = file.name;
    contractUploadError.classList.remove('show');
  }
});

drivingFileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (file) {
    document.getElementById('drivingFileLabel').textContent = file.name;
    drivingUploadError.classList.remove('show');
  }
});

document.getElementById('confirmUpload').addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) { showUploadError('먼저 업로드할 파일을 선택해 주세요.'); return; }
  const button = document.getElementById('confirmUpload');
  button.disabled = true;
  button.textContent = '자료 확인 중...';
  try {
    const uploadedRows = await readVehicleFile(file);
    const savedToSupabase = await saveVehicleFileToSupabase(uploadedRows);
    if (savedToSupabase) await refreshVehiclesFromSupabase();
    else vehicleData = uploadedRows;
    document.getElementById('vehicleSearch').value = '';
    ['headquartersFilter', 'divisionFilter', 'teamFilter'].forEach(id => document.getElementById(id).value = '');
    refreshFilters();
    renderVehicles();
    renderDriving();
    document.getElementById('sourceFileName').textContent = file.name;
    document.getElementById('sourceUpdated').textContent = `${new Date().toLocaleString('ko-KR')} 반영`;
    toggleModal(false);
    showView('차량 현황');
    showToast(`${uploadedRows.length}건의 차량 담당자 정보를 ${savedToSupabase ? '저장하고 ' : ''}불러왔습니다.`);
  } catch (error) {
    showUploadError(error.message || '파일을 읽는 중 문제가 발생했습니다.');
  } finally {
    button.disabled = false;
    button.textContent = '자료 확인하기';
  }
});

document.getElementById('confirmContractUpload').addEventListener('click', async () => {
  const file = contractFileInput.files[0];
  if (!file) { showContractUploadError('먼저 업로드할 파일을 선택해 주세요.'); return; }
  const button = document.getElementById('confirmContractUpload');
  button.disabled = true;
  button.textContent = '자료 확인 중...';
  try {
    contractData = await readContractFile(file);
    document.getElementById('contractSearch').value = '';
    ['contractHeadquartersFilter', 'contractDivisionFilter', 'contractTeamFilter'].forEach(id => document.getElementById(id).value = '');
    refreshContractFilters();
    renderContracts();
    document.getElementById('contractSourceFileName').textContent = file.name;
    document.getElementById('contractSourceUpdated').textContent = `${new Date().toLocaleString('ko-KR')} 반영`;
    toggleContractModal(false);
    showView('차량계약정보');
    showToast(`${contractData.length}건의 차량계약정보를 불러왔습니다.`);
  } catch (error) {
    showContractUploadError(error.message || '파일을 읽는 중 문제가 발생했습니다.');
  } finally {
    button.disabled = false;
    button.textContent = '자료 확인하기';
  }
});

document.getElementById('confirmDrivingUpload').addEventListener('click', async () => {
  const file = drivingFileInput.files[0];
  if (!file) { showDrivingUploadError('먼저 업로드할 파일을 선택해 주세요.'); return; }
  const button = document.getElementById('confirmDrivingUpload');
  button.disabled = true;
  button.textContent = '자료 확인 중...';
  try {
    const incoming = await readDrivingFile(file);
    const result = mergeDrivingRows(incoming);
    document.getElementById('drivingSearch').value = '';
    const newestDate = incoming.reduce((latest, row) => normalizeDrivingDate(row['운행년월일']) > latest ? normalizeDrivingDate(row['운행년월일']) : latest, '');
    if (newestDate) document.getElementById('usageMonth').value = newestDate.slice(0, 7);
    renderDriving();
    toggleDrivingUploadModal(false);
    showView('운행기록데이터');
    showToast(`새 기록 ${result.added}건 · 동일 중복 ${result.duplicate}건 · 확정월 제외 ${result.locked}건`);
  } catch (error) {
    showDrivingUploadError(error.message || '파일을 읽는 중 문제가 발생했습니다.');
  } finally {
    button.disabled = false;
    button.textContent = '자료 확인하기';
  }
});

document.querySelectorAll('.period-tab').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.period-tab').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    showToast(`${button.textContent} 기준으로 화면을 전환했습니다.`);
  });
});

const closingNav=document.createElement('li');
closingNav.innerHTML='<button class="nav-button" data-page="월별 비용마감자료"><svg viewBox="0 0 24 24" fill="none"><path d="M5 4h14v17H5V4Zm3 5h8m-8 4h8m-8 4h5" stroke="currentColor" stroke-width="1.7"/></svg>월별 비용마감자료</button>';
document.querySelector('[data-page="운행기록데이터"]').closest('li').after(closingNav);
document.getElementById('closingMonth').addEventListener('change',()=>{closingDraft=null;closingEditMonth=null;document.getElementById('closingCorrectionReason').value='';document.getElementById('closingUpload').value='';renderClosing();});
document.getElementById('closingUpload').addEventListener('change',async event=>{
  const file=event.target.files[0], month=closingMonthValue();
  if(!file)return;
  try {
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('마감월도를 선택하세요.');
    if(closingArchive[month] && closingEditMonth!==month)throw Error('이미 확정된 월도입니다. 관리자 마감 수정으로 전환한 뒤 수정해 주세요.');
    if(file.size>20*1024*1024)throw Error('파일은 20MB 이하로 올려주세요.');
    if(!window.XLSX)throw Error('Excel 기능을 불러오지 못했습니다. 잠시 후 다시 시도하세요.');
    const workbook=XLSX.read(await file.arrayBuffer(),{type:'array'});
    const raw=XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]],{defval:'',raw:false});
    if(!raw.length)throw Error('비용자료가 비어 있습니다.');
    const seen=new Set();
    const rows=raw.map((row,index)=>{
      const plate=String(row['차량번호']||'').trim(),normalized=normalizePlate(plate);
      if(!normalized||seen.has(normalized))throw Error(`${index+2}행: 차량번호 누락 또는 중복입니다.`);
      seen.add(normalized);
      if(String(row['렌탈료']??'').trim()==='')throw Error(`${index+2}행: 렌탈료를 입력하세요.`);
      const result={'차량번호':plate};
      costKeys.forEach(key=>{const text=String(row[key]??'').trim().replace(/[,\s원₩]/g,'');const value=text===''?0:Number(text);if(!Number.isSafeInteger(value)||value<0)throw Error(`${index+2}행: ${key}는 0 이상의 정수(원)여야 합니다.`);result[key]=value;});
      const vehicle=vehicleForPlate(plate);
      ['본부','부','팀'].forEach(key=>result[key]=String(row[key]||vehicle?.[key]||''));
      return result;
    });
    if(closingMonthValue()!==month)throw Error('월도가 변경되었습니다. 다시 업로드하세요.');
    closingDraft={month,rows,source:file.name};renderClosing();
    const missing=rows.filter(row=>!row['본부']||!row['부']||!row['팀']).length;
    document.getElementById('closingMessage').textContent=missing?`조직정보 미매칭 ${missing}건입니다. 차량현황을 수정하거나 Excel에 본부, 부, 팀을 입력한 뒤 다시 업로드하세요.`:`${rows.length}대 검토 준비 완료. 확정하면 부서정보와 비용을 이 월도에 고정하고 보관파일을 다운로드합니다.`;
  }catch(error){showToast(error.message);event.target.value='';}
});
document.getElementById('closingConfirm').addEventListener('click',()=>{
  const month=closingMonthValue();
  const isEditing=closingEditMonth===month;
  if((closingArchive[month]&&!isEditing)||!closingDraft||closingDraft.month!==month)return;
  if(closingDraft.rows.some(row=>!row['본부']||!row['부']||!row['팀'])){showToast('미매칭 조직정보를 먼저 확인해 주세요.');return;}
  const reason=document.getElementById('closingCorrectionReason').value.trim();
  if(isEditing&&!reason){showToast('정정 사유를 입력해 주세요.');return;}
  if(!confirm(isEditing ? `${month} 수정자료를 재확정할까요? 이전 확정본은 정정 이력으로 보관됩니다.` : `${month} 비용자료를 확정하고 보관파일을 다운로드할까요? 확정된 월도는 수정되지 않습니다.`))return;
  const previous=closingArchive[month];
  const revisions=isEditing ? [...(previous.revisions||[]),{rows:JSON.parse(JSON.stringify(previous.rows)),source:previous.source,confirmedAt:previous.confirmedAt,correctedAt:new Date().toISOString(),reason}] : [];
  closingArchive[month]={rows:JSON.parse(JSON.stringify(closingDraft.rows)),source:closingDraft.source,confirmedAt:new Date().toISOString(),revisions};
  closingDraft=null;closingEditMonth=null;document.getElementById('closingCorrectionReason').value='';renderClosing();syncClosingDashboard();downloadClosingArchive();
  document.getElementById('closingMessage').textContent=isEditing?'수정 마감 확정 완료. 이전 확정본은 정정 이력에 보관되며 최신 보관파일을 다운로드했습니다.':'마감 확정 완료. 다운로드된 JSON 보관파일을 안전한 폴더에 저장하세요. 다음 접속 시 불러오면 복원됩니다.';
});
document.getElementById('closingDownload').addEventListener('click',downloadClosingArchive);
document.getElementById('downloadClosingTemplate').addEventListener('click',downloadClosingTemplate);
document.getElementById('closingAdminEdit').addEventListener('click',()=>{
  const month=closingMonthValue(), saved=closingArchive[month];
  if(!saved)return;
  if(!confirm(`${month} 마감자료를 관리자 수정 모드로 전환할까요? 수정 후에는 정정 사유를 입력하고 다시 확정해야 합니다.`))return;
  closingDraft={month,rows:JSON.parse(JSON.stringify(saved.rows)),source:saved.source};closingEditMonth=month;document.getElementById('closingCorrectionReason').value='';renderClosing();
  document.getElementById('closingMessage').textContent='관리자 수정 모드입니다. Excel을 다시 업로드한 뒤 정정 사유를 입력하고 수정 마감 확정을 진행하세요.';
});
document.getElementById('closingArchiveRows').addEventListener('click',event=>{const button=event.target.closest('[data-closing-month]');if(button){document.getElementById('closingMonth').value=button.dataset.closingMonth;closingDraft=null;closingEditMonth=null;document.getElementById('closingCorrectionReason').value='';renderClosing();}});
document.getElementById('closingRestore').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>20*1024*1024)throw Error('보관파일은 20MB 이하만 지원합니다.');
    const data=JSON.parse(await file.text());
    if(data.format!=='fleet-cost-archive-v1'||!data.months||typeof data.months!=='object'||Array.isArray(data.months))throw Error('지원하지 않는 보관파일입니다.');
    const entries=Object.entries(data.months);if(!entries.length)throw Error('보관파일이 비어 있습니다.');
    const restored={};
    for(const [month,item] of entries){
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!Array.isArray(item.rows)||!item.rows.length||typeof item.confirmedAt!=='string')throw Error('마감자료 형식이 올바르지 않습니다.');
      const seen=new Set();
      for(const row of item.rows){if(!row||typeof row['차량번호']!=='string'||!normalizePlate(row['차량번호'])||seen.has(normalizePlate(row['차량번호']))||costKeys.some(key=>!Number.isSafeInteger(row[key])||row[key]<0)||['본부','부','팀'].some(key=>typeof row[key]!=='string'||!row[key]))throw Error('보관자료에 누락 또는 잘못된 값이 있습니다.');seen.add(normalizePlate(row['차량번호']));}
      if(closingArchive[month]&&JSON.stringify(closingArchive[month])!==JSON.stringify(item))throw Error(`${month}에 다른 확정자료가 있어 불러오기를 취소했습니다. 기존 자료는 유지됩니다.`);
      restored[month]=item;
    }
    Object.assign(closingArchive,restored);closingDraft=null;renderClosing();syncClosingDashboard();showToast('보관자료를 불러왔습니다.');
  }catch(error){showToast(error.message||'보관파일을 읽을 수 없습니다.');}finally{event.target.value='';}
});
renderClosing();
document.querySelectorAll('.nav-button').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.page === '대시보드' || button.dataset.page === '차량 현황' || button.dataset.page === '차량계약정보' || button.dataset.page === '운행기록데이터' || button.dataset.page === '월별 비용마감자료') showView(button.dataset.page);
    else showToast(`${button.dataset.page} 화면은 다음 단계에서 함께 만들 수 있습니다.`);
    toggleSidebar(false);
  });
});

document.getElementById('vehicleSearch').addEventListener('input', renderVehicles);
document.getElementById('headquartersFilter').addEventListener('change', () => { document.getElementById('divisionFilter').value = ''; document.getElementById('teamFilter').value = ''; refreshFilters(); renderVehicles(); });
document.getElementById('divisionFilter').addEventListener('change', () => { document.getElementById('teamFilter').value = ''; refreshFilters(); renderVehicles(); });
document.getElementById('teamFilter').addEventListener('change', renderVehicles);
document.getElementById('resetFilters').addEventListener('click', () => {
  document.getElementById('vehicleSearch').value = '';
  ['headquartersFilter', 'divisionFilter', 'teamFilter'].forEach(id => document.getElementById(id).value = '');
  refreshFilters(); renderVehicles();
});

document.getElementById('contractSearch').addEventListener('input', renderContracts);
document.getElementById('contractHeadquartersFilter').addEventListener('change', () => { document.getElementById('contractDivisionFilter').value = ''; document.getElementById('contractTeamFilter').value = ''; refreshContractFilters(); renderContracts(); });
document.getElementById('contractDivisionFilter').addEventListener('change', () => { document.getElementById('contractTeamFilter').value = ''; refreshContractFilters(); renderContracts(); });
document.getElementById('contractTeamFilter').addEventListener('change', renderContracts);
document.getElementById('resetContractFilters').addEventListener('click', () => {
  document.getElementById('contractSearch').value = '';
  ['contractHeadquartersFilter', 'contractDivisionFilter', 'contractTeamFilter'].forEach(id => document.getElementById(id).value = '');
  refreshContractFilters(); renderContracts();
});

document.getElementById('confirmDrivingMonth').addEventListener('click',()=>{
  const month=document.getElementById('usageMonth').value;
  if(drivingArchive[month])return;
  const rows=drivingData.filter(row=>drivingRowMonth(row)===month);
  if(!rows.length){showToast('선택월에 운행자료가 없습니다.');return;}
  const vehicles=new Map();
  for(const row of rows){
    const org=vehicleForPlate(row['차량번호']);
    if(!org || ['본부','부','팀'].some(key=>!org[key])){showToast('미매칭 차량의 부서정보를 먼저 차량현황에서 확인하세요.');return;}
    const plate=normalizePlate(row['차량번호']);if(!vehicles.has(plate))vehicles.set(plate,[]);vehicles.get(plate).push(row);
  }
  if([...vehicles.values()].some(items=>items.length>1)){showToast('차량별 월 이동거리는 월마다 한 건만 입력하세요.');return;}
  if(!confirm(`${month} 운행자료 ${rows.length}건을 확정할까요? 부서정보를 고정하고 수정 잠금 후 전체 확정자료 보관파일을 다운로드합니다.`))return;
  const snapshots=rows.map(row=>({...row,_organization:Object.fromEntries(['본부','부','팀','차종'].map(key=>[key,String(vehicleForPlate(row['차량번호'])[key] || '')]))}));
  drivingArchive[month]={rows:snapshots,confirmedAt:new Date().toISOString()};
  drivingData=drivingData.filter(row=>drivingRowMonth(row)!==month).concat(snapshots);
  document.getElementById('dashboardUsageMonth').value=month;
  renderDriving();downloadDrivingArchiveFile();showToast('월별 운행자료를 확정했습니다. 다운로드한 파일을 보관하세요.');
});
document.getElementById('downloadDrivingArchive').addEventListener('click',downloadDrivingArchiveFile);
document.getElementById('dashboardUsageMonth').addEventListener('change',renderDashboardUsage);
document.getElementById('drivingArchiveList').addEventListener('click',event=>{const button=event.target.closest('[data-driving-month]');if(button){document.getElementById('usageMonth').value=button.dataset.drivingMonth;renderDriving();}});
document.getElementById('exportDrivingReport').addEventListener('click',()=>{const month=document.getElementById('usageMonth').value;if(!drivingArchive[month]){showToast('보고자료는 마감 확정 후 내려받을 수 있습니다.');return;}downloadExcel(drivingReportForMonth(month).map(row=>({'보고월':month,...row})),'부서별 운행보고',`부서별운행보고_${month}.xlsx`);});
document.getElementById('restoreDrivingArchive').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>20*1024*1024)throw Error('보관파일은 20MB 이하여야 합니다.');
    const data=JSON.parse(await file.text());
    if(data.format==='fleet-driving-archive-v1')throw Error('이 파일은 이전 누적 계기판 형식입니다. 원본을 보관하고 월 이동거리 자료로 다시 작성하세요. 기존 자료는 변경하지 않습니다.');
    if(data.format!=='fleet-driving-monthly-v2'||!data.months||typeof data.months!=='object'||Array.isArray(data.months))throw Error('월 이동거리 확정보관자료 JSON 파일을 선택하세요.');
    const entries=Object.entries(data.months);if(!entries.length)throw Error('확정자료가 비어 있습니다.');
    for(const [month,item] of entries){
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!item||!Array.isArray(item.rows)||!item.rows.length||typeof item.confirmedAt!=='string'||!Number.isFinite(Date.parse(item.confirmedAt)))throw Error('보관자료 형식이 올바르지 않습니다.');
      const seen=new Set(),byPlate=new Map();
      for(const row of item.rows){
        if(!row||typeof row['차량번호']!=='string'||!normalizePlate(row['차량번호'])||!normalizeDrivingDate(row['운행년월일'])||drivingRowMonth(row)!==month||String(row['키로수']??'').trim()===''||!Number.isFinite(Number(row['키로수']))||Number(row['키로수'])<0||!row._organization||['본부','부','팀'].some(key=>typeof row._organization[key]!=='string'||!row._organization[key]))throw Error('운행기록 또는 확정 부서정보를 확인할 수 없습니다.');
        const plate=normalizePlate(row['차량번호']),key=plate+'|'+normalizeDrivingDate(row['운행년월일']);if(seen.has(key))throw Error('보관파일에 차량·날짜 중복이 있습니다.');seen.add(key);
        if(!byPlate.has(plate))byPlate.set(plate,[]);byPlate.get(plate).push(row);
      }
      if([...byPlate.values()].some(rows=>rows.length>1))throw Error('보관자료에 동일 차량·월 중복이 있습니다.');
      if(drivingArchive[month]&&JSON.stringify(drivingArchive[month])!==JSON.stringify(item))throw Error(`${month}의 기존 확정자료와 달라 불러오기를 취소했습니다. 기존 자료는 유지됩니다.`);
    }
    const restoredMonths=new Set(entries.map(([month])=>month));
    const draftCount=drivingData.filter(row=>restoredMonths.has(drivingRowMonth(row))&&!drivingArchive[drivingRowMonth(row)]).length;
    if(draftCount && !confirm(`불러오는 월도에 미확정 기록 ${draftCount}건이 있습니다. 보관파일의 확정자료로 바꿀까요? 다른 월도는 유지됩니다.`))return;
    const retained=drivingData.filter(row=>!restoredMonths.has(drivingRowMonth(row)));
    Object.assign(drivingArchive,data.months);drivingData=retained.concat(entries.flatMap(([,item])=>item.rows));
    const latest=[...restoredMonths].sort().at(-1);document.getElementById('usageMonth').value=latest;document.getElementById('dashboardUsageMonth').value=latest;
    renderDriving();showToast(`${entries.length}개월의 확정 운행자료를 불러왔습니다.`);
  }catch(error){showToast(error.message || '보관파일을 읽을 수 없습니다.');}finally{event.target.value='';}
});
document.getElementById('usageMonth').addEventListener('change', renderDriving);
document.getElementById('drivingSearch').addEventListener('input', renderDriving);
document.getElementById('rentReferenceMonth').addEventListener('change', renderRentChart);

document.getElementById('reportButton').addEventListener('click', () => {
  const month=document.getElementById('rentReferenceMonth').value;
  if(!parseYearMonth(month)){showToast('보고 기준월을 선택하세요.');return;}
  const costs=closingArchive[month], usage=drivingArchive[month];
  const totals=costs ? closingTotals(costs.rows) : null;
  let report=document.getElementById('printReport');
  if(!report){report=document.createElement('section');report.id='printReport';document.body.appendChild(report);}
  const fee=contractData.reduce((sum,row)=>sum+rentalNumber(row['렌탈료']),0);
  report.innerHTML=`<h1>법인차량 관리 보고서</h1><p>기준월: ${escapeHtml(month)} · 비용은 부가세 포함</p><p>현재 저장계약 월 렌탈료 합계: ${won(fee)} (과거 확정비용과 별도)</p><h2>월별 확정 비용</h2>${totals ? `<p>확정일: ${escapeHtml(costs.confirmedAt)} · 버전 ${1+(costs.revisions||[]).length}</p><table><tr>${costKeys.map(key=>`<th>${escapeHtml(key)}</th>`).join('')}<th>합계</th></tr><tr>${totals.map(value=>`<td>${won(value)}</td>`).join('')}<td>${won(totals.reduce((a,b)=>a+b,0))}</td></tr></table>` : '<p>비용 미마감 — 금액 없음</p>'}<h2>최근 12개월 렌트비용</h2><p>${escapeHtml(document.getElementById('rentAverageLabel').textContent)}: ${escapeHtml(document.getElementById('rentAverageAmount').textContent)}</p>${document.getElementById('rentChart').outerHTML}<h2>부서별 확정 월 이동거리</h2>${usage ? `<p>확정일: ${escapeHtml(usage.confirmedAt)}</p><table><thead><tr><th>본부</th><th>부</th><th>팀</th><th>차량</th><th>월 이동거리</th><th>운행일수</th><th>차량당 평균</th></tr></thead><tbody>${drivingReportMarkup(drivingReportForMonth(month))}</tbody></table>` : '<p>운행 미마감 — 거리 없음</p>'}<p>운행일수는 월 이동거리만으로 계산할 수 없습니다. 서버 영구 저장 연결 전에는 원본과 보관파일을 별도 보관하세요.</p>`;
  window.print();
});
document.getElementById('allVehiclesButton').addEventListener('click', () => showView('차량계약정보'));
document.getElementById('noticeButton').addEventListener('click', () => showToast('확인이 필요한 계약 만료 차량이 3대 있습니다.'));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { toggleModal(false); toggleContractModal(false); toggleDrivingUploadModal(false); closeVehicleForm(); closeContractForm(); closeDrivingForm(); toggleSidebar(false); }
});

refreshFilters();
renderVehicles();
refreshContractFilters();
renderContracts();
renderDriving();
renderRentChart();
