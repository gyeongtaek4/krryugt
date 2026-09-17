# 코드 구조와 리팩터링 기록

## 현재 구조

```text
dist/
  index.html       화면 골격과 카테고리 화면 (306줄)
  css/app.css     기존 디자인과 반응형 스타일
  js/dialogs.js   업로드·직접 입력 팝업의 정적 HTML 구성
  js/supabase-config.js  Supabase Project URL·Publishable key 공개 연결 설정
  js/supabase-client.js  Supabase 브라우저 연결 객체
  js/supabase-auth.js    이메일 로그인·로그아웃과 프로필 역할 표시
  js/app.js       기존 데이터·계산·업로드·조회·마감 처리
scripts/
  preview.cjs     Node.js 로컬 미리보기 서버
tests/fixtures/
  driving.csv     Excel 호환 UTF-8 BOM 익명 운행 샘플 (8월·9월)
  costs.csv       Excel 호환 UTF-8 BOM 익명 비용 샘플
```

## 실행과 배포

1. 프로젝트 폴더에서 `node scripts/preview.cjs`를 실행한다.
2. `http://127.0.0.1:4173/`에서 확인한다. 종료는 Ctrl+C.
3. JavaScript 문법은 `node --check dist/js/app.js`와 `node --check dist/js/dialogs.js`로 확인한다.
4. Supabase 연결 파일 순서는 `node tests/supabase-config-check.cjs`로 확인한다.
5. 배포 대상은 `dist/` 전체다. index.html만 업로드하면 CSS와 기능 파일이 빠진다.

별도 빌드나 npm 설치 없이 정적 파일로 동작한다. 외부 SheetJS 로딩은 기존과 동일하다.
실행 순서: HTML 구성 → SheetJS·Supabase 라이브러리 → Supabase 설정·연결 객체 → dialogs.js에서 팝업 구성 → app.js에서 DOM 연결과 초기 화면 표시.
supabase-client.js, dialogs.js와 app.js에 임의로 async를 추가하지 않는다. 팝업 DOM 생성 또는 Supabase 연결 객체 생성 전에 app.js가 실행되면 연결 오류가 발생할 수 있다.
`dialogRoot`는 팝업 위치를 표시하는 자리이며, dialogs.js가 기존 팝업 HTML로 교체한다.

## 완료한 범위

- 약 2,000줄의 index.html에서 CSS, 팝업 HTML, JavaScript를 각각 분리했다.
- 화면 내용과 기능 코드를 압축하거나 삭제하지 않았다. HTML의 빈 간격 줄만 정리했다.
- 기존 계산, 데이터 보관 방식, 메뉴, 입력 기능은 변경하지 않았다.
- app.js는 기존 코드를 유지하는 첫 단계다. 차량·계약·운행·마감별 모듈화는 이번 범위에 포함하지 않았다.
- Supabase Project URL·Publishable key를 전용 파일로 추가하고 브라우저 연결 객체를 생성했다. 로그인 후 `vehicles` 조회도 연결했다. 차량 추가·수정 저장, 비용·운행 표 연결은 후속 작업이다.

## 검증 결과

- 원본과 분리된 CSS·기능 JavaScript의 내용 일치 확인.
- 팝업을 포함하여 조립한 body 마크업이 원본과 일치함을 확인 (공백 및 script 연결 제외).
- 두 JavaScript 파일의 문법 확인.
- 실제 로컬 브라우저에서 대시보드 초기 표시 및 운행 메뉴 이동 확인.
- driving.csv 실제 업로드: 8월·9월 각 2건 동시 유지, 조회월 9월 자동 선택, 500km 표시 확인.
- 8월 조회: 기록 2건과 300km 표시 확인.
- 직접 입력 팝업을 열어 새 기록 저장 후 목록에 추가되는 것을 확인.
- 양식 내려받기 클릭 시 완료 안내 표시 및 브라우저 오류 로그 없음 확인. 다운로드 이벤트는 검증 도구에서 포착되지 않아 실제 저장파일 내용까지 재검증하지는 않았다.
- 비용 샘플은 준비했지만 이번 브라우저 검증에서 사용하지 않았다. 비용 마감·정정·복원은 이번 변경에서 로직을 수정하지 않았고 전체 흐름을 재검증하지 않았다.

검증 중 BOM 없는 UTF-8 CSV는 기존 SheetJS 읽기 방식에서 한글 열 이름 인식 오류가 발생했다. BOM을 포함한 샘플은 업로드됐다.
이는 기존 코드에서도 동일한 읽기 경로를 사용하는 별도 개선 대상이며, 이번 구조 분리에서 처리 방식을 바꾸지 않았다.

## 후속 작업

- 기능별 JavaScript 모듈화와 공통 업로드 처리 정리.
- CSV 인코딩 처리와 익명 샘플을 이용한 자동 회귀검증.
- 영구 저장, 관리자 권한, 마감 버전 등 업무 기능은 개발 가이드의 STEP에 따라 별도로 진행.
