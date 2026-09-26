// Static upload and entry dialogs; mounted before app.js starts.
(() => {
  const root = document.getElementById("dialogRoot");
  if (!root) throw new Error("Dialog mount point is missing");
  root.outerHTML = `
  <div class="modal-backdrop" id="uploadModal" role="dialog" aria-modal="true" aria-labelledby="uploadTitle">
    <div class="modal">
      <div class="modal-header"><div><h2 id="uploadTitle">담당자 자료 업로드</h2><p>차량 담당자 정보가 들어 있는 Excel 또는 CSV 파일을 선택해 주세요.</p></div><button class="close-button" id="closeModal" aria-label="닫기">✕</button></div>
      <label class="drop-zone" for="fileInput">
        <span class="drop-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <strong id="fileLabel">파일을 끌어놓거나 눌러서 선택</strong>
        <span>지원 형식: .xlsx, .xls, .csv · 최대 20MB</span>
      </label>
      <input type="file" id="fileInput" accept=".xlsx,.xls,.csv">
      <div class="upload-error" id="uploadError"></div>
      <ul class="required-columns" aria-label="필수 열"><li>본부</li><li>부</li><li>팀</li><li>담당자(정)</li><li>담당자(부)</li><li>차량번호</li><li>차종</li><li>지역</li><li>주차장</li></ul>
      <div class="modal-actions"><button class="button" id="cancelUpload">취소</button><button class="button primary" id="confirmUpload">자료 확인하기</button></div>
    </div>
  </div>

  <div class="modal-backdrop" id="contractUploadModal" role="dialog" aria-modal="true" aria-labelledby="contractUploadTitle">
    <div class="modal">
      <div class="modal-header"><div><h2 id="contractUploadTitle">차량계약정보 업로드</h2><p>차량번호, 렌탈료, 계약시작, 계약종료가 들어 있는 Excel 또는 CSV 파일을 선택해 주세요. 조직·담당자·차종은 차량현황에서 자동 연결합니다.</p></div><button class="close-button" id="closeContractModal" aria-label="닫기">✕</button></div>
      <label class="drop-zone" for="contractFileInput">
        <span class="drop-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <strong id="contractFileLabel">파일을 끌어놓거나 눌러서 선택</strong>
        <span>지원 형식: .xlsx, .xls, .csv · 최대 20MB</span>
      </label>
      <input type="file" id="contractFileInput" accept=".xlsx,.xls,.csv">
      <div class="upload-error" id="contractUploadError"></div>
      <ul class="required-columns" aria-label="계약정보 필수 열"><li>차량번호</li><li>렌탈료</li><li>계약시작</li><li>계약종료</li></ul>
      <div class="modal-actions"><button class="button" id="cancelContractUpload">취소</button><button class="button primary" id="confirmContractUpload">자료 확인하기</button></div>
    </div>
  </div>

  <div class="modal-backdrop" id="vehicleFormModal" role="dialog" aria-modal="true" aria-labelledby="vehicleFormTitle">
    <div class="modal">
      <div class="modal-header"><div><h2 id="vehicleFormTitle">차량현황 직접 추가</h2><p>조직과 담당자, 차량 정보를 입력해 주세요.</p></div><button class="close-button" id="closeVehicleForm" aria-label="닫기">✕</button></div>
      <form id="vehicleForm">
        <div class="form-grid">
          <div class="form-field"><label for="vfHeadquarters">본부 *</label><input id="vfHeadquarters" required></div>
          <div class="form-field"><label for="vfDivision">부 *</label><input id="vfDivision" required></div>
          <div class="form-field"><label for="vfTeam">팀 *</label><input id="vfTeam" required></div>
          <div class="form-field"><label for="vfCc">CC *</label><input id="vfCc" required></div>
          <div class="form-field"><label for="vfPrimary">담당자(정) *</label><input id="vfPrimary" required></div>
          <div class="form-field"><label for="vfSecondary">담당자(부)</label><input id="vfSecondary"></div>
          <div class="form-field"><label for="vfPlate">차량번호 *</label><input id="vfPlate" required></div>
          <div class="form-field"><label for="vfModel">차종 *</label><input id="vfModel" required></div>
          <div class="form-field"><label for="vfRegion">지역</label><input id="vfRegion" placeholder="예: 서울"></div>
          <div class="form-field"><label for="vfParking">주차장</label><input id="vfParking" placeholder="예: 본사 지하주차장"></div>
        </div>
        <div class="upload-error" id="vehicleFormError"></div>
        <div class="modal-actions"><button class="button" type="button" id="cancelVehicleForm">취소</button><button class="button primary" type="submit">저장하기</button></div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="contractFormModal" role="dialog" aria-modal="true" aria-labelledby="contractFormTitle">
    <div class="modal">
      <div class="modal-header"><div><h2 id="contractFormTitle">차량계약정보 직접 추가</h2><p>차량현황에 등록된 차량번호를 입력하세요. 조직·담당자는 자동 연결됩니다. 렌탈료는 부가세 포함입니다.</p></div><button class="close-button" id="closeContractForm" aria-label="닫기">✕</button></div>
      <form id="contractForm">
        <div class="form-grid">
          <div class="form-field"><label for="cfHeadquarters">본부 *</label><input id="cfHeadquarters" required></div>
          <div class="form-field"><label for="cfDivision">부 *</label><input id="cfDivision" required></div>
          <div class="form-field"><label for="cfTeam">팀 *</label><input id="cfTeam" required></div>
          <div class="form-field"><label for="cfCc">CC *</label><input id="cfCc" required></div>
          <div class="form-field"><label for="cfPrimary">담당자(정) *</label><input id="cfPrimary" required></div>
          <div class="form-field"><label for="cfSecondary">담당자(부)</label><input id="cfSecondary"></div>
          <div class="form-field"><label for="cfModel">차종 *</label><input id="cfModel" required></div>
          <div class="form-field"><label for="cfPlate">차량번호 *</label><input id="cfPlate" required></div>
          <div class="form-field"><label for="cfFee">월 렌탈료(원) *</label><input id="cfFee" type="number" min="0" step="1000" required></div>
          <div class="form-field"><label for="cfStart">계약시작 *</label><input id="cfStart" type="month" required></div>
          <div class="form-field"><label for="cfEnd">계약종료 *</label><input id="cfEnd" type="month" required></div>
        </div>
        <p class="form-hint">총 계약기간과 남은 계약기간은 시작·종료년월을 기준으로 자동 계산됩니다.</p>
        <div class="upload-error" id="contractFormError"></div>
        <div class="modal-actions"><button class="button" type="button" id="cancelContractForm">취소</button><button class="button primary" type="submit">저장하기</button></div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="drivingUploadModal" role="dialog" aria-modal="true" aria-labelledby="drivingUploadTitle">
    <div class="modal">
      <div class="modal-header"><div><h2 id="drivingUploadTitle">운행기록 업로드</h2><p>차량번호, 키로수, 운행년월일이 들어 있는 Excel 또는 CSV 파일을 선택해 주세요.</p></div><button class="close-button" id="closeDrivingUpload" aria-label="닫기">✕</button></div>
      <label class="drop-zone" for="drivingFileInput">
        <span class="drop-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <strong id="drivingFileLabel">파일을 끌어놓거나 눌러서 선택</strong>
        <span>지원 형식: .xlsx, .xls, .csv · 최대 20MB</span>
      </label>
      <input type="file" id="drivingFileInput" accept=".xlsx,.xls,.csv">
      <div class="upload-error" id="drivingUploadError"></div>
      <ul class="required-columns" aria-label="운행기록 필수 열"><li>차량번호</li><li>키로수</li><li>운행년월일</li></ul>
      <div class="modal-actions"><button class="button" id="cancelDrivingUpload">취소</button><button class="button primary" id="confirmDrivingUpload">자료 확인하기</button></div>
    </div>
  </div>

  <div class="modal-backdrop" id="drivingFormModal" role="dialog" aria-modal="true" aria-labelledby="drivingFormTitle">
    <div class="modal">
      <div class="modal-header"><div><h2 id="drivingFormTitle">운행기록 직접 추가</h2><p>차량번호와 이번 운행의 이동거리, 운행일자를 입력해 주세요.</p></div><button class="close-button" id="closeDrivingForm" aria-label="닫기">✕</button></div>
      <form id="drivingForm">
        <div class="form-grid">
          <div class="form-field full"><label for="dfPlate">차량번호 *</label><input id="dfPlate" required placeholder="예: 12가 3456"></div>
          <div class="form-field"><label for="dfMileage">운행 이동거리(km) *</label><input id="dfMileage" type="number" min="0" step="any" required></div>
          <div class="form-field"><label for="dfDate">운행년월일 *</label><input id="dfDate" type="date" required></div>
        </div>
        <p class="form-hint">차량현황에 같은 차량번호가 있으면 본부·부·팀·차종이 자동으로 연결됩니다.</p>
        <div class="upload-error" id="drivingFormError"></div>
        <div class="modal-actions"><button class="button" type="button" id="cancelDrivingForm">취소</button><button class="button primary" type="submit">저장하기</button></div>
      </form>
    </div>
  </div>

  <div class="modal-backdrop" id="drivingDetailModal" role="dialog" aria-modal="true" aria-labelledby="drivingDetailTitle">
    <div class="modal driving-detail-modal">
      <div class="modal-header"><div><h2 id="drivingDetailTitle">일별 운행기록</h2><p id="drivingDetailDescription">선택한 차량의 날짜별 합산 이동거리입니다.</p></div><button class="close-button" id="closeDrivingDetail" aria-label="닫기">✕</button></div>
      <div class="driving-detail-summary" id="drivingDetailSummary"></div>
      <div class="table-wrap driving-detail-table-wrap">
        <table class="driving-detail-table"><thead><tr><th>운행일</th><th>요일</th><th>일 이동거리</th></tr></thead><tbody id="drivingDetailRows"></tbody></table>
      </div>
      <div class="modal-actions"><button class="button" id="downloadDrivingDetail">Excel 내려받기</button><button class="button primary" id="closeDrivingDetailConfirm">확인</button></div>
    </div>
  </div>
`;
})();
