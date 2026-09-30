# 코드 구조

## 화면과 스타일

- `dist/index.html`: 전체 화면 골격, 메뉴, 표, 카드, 접근성용 ID
- `dist/css/app.css`: 공통 색상·레이아웃·반응형·화면별 스타일
- `dist/js/dialogs.js`: 업로드·직접 입력 팝업의 HTML 구성

## 기능 JavaScript

- `dist/js/supabase-config.js`: Vercel 환경변수로 배포 시 생성되는 Supabase Project URL·Publishable key 설정 파일. 저장소에는 빈 템플릿만 둔다.
- `dist/js/supabase-client.js`: 브라우저 Supabase 연결 객체
- `dist/js/supabase-auth.js`: 로그인·로그아웃·역할 적용·10분 무활동 자동 로그아웃
- `dist/js/members.js`: 회원가입, 관리자 회원관리, 계정 상태·역할 관리
- `dist/js/app.js`: 차량·계약·운행·비용·대시보드·메뉴 이동의 공통 처리
- `dist/js/attachment-compression.js`: 인수인계·사고 현장 사진의 1MB 자동 압축과 3MB 초과 PDF의 3MB 이하 압축 공통 처리. PDF 압축에는 페이지 렌더링용 외부 라이브러리를 사용한다.
- `dist/js/driving-months.js`: 운행 월자료 조회·저장·집계·페이지 이동
- `dist/js/handover.js`: 차량인수인계 입력·첨부·이력·동의
- `dist/js/accidents.js`: 사고접수·첨부·이력·관리자 처리 코멘트
- `dist/js/knowledge.js`: Q&A·운행가이드 등록·조회·PDF 다운로드
- `dist/js/capacity.js`: 관리자 용량확인, Storage·DB 사용량·80% 경고

실행 순서는 HTML 구성 → 외부 라이브러리 → Supabase 설정·연결 → `dialogs.js` 팝업 구성 → 기능 모듈 → `app.js` DOM 연결 순서다. 화면 요소가 제거될 수 있는 기능은 이벤트 연결 전에 요소 존재 여부를 확인한다.

## 저장과 SQL

- `supabase/001_initial_schema.sql`부터 `019_admin_capacity_usage.sql`까지: Supabase 표·함수·RLS·Storage 정책 변경 이력
- 구조화된 정보는 Supabase DB, 사진·PDF 첨부는 비공개 Storage에 저장한다.
- Vercel 환경변수 `FLEET_SUPABASE_URL`·`FLEET_SUPABASE_PUBLISHABLE_KEY`를 `scripts/build.cjs`가 배포 파일에 주입한다. Publishable key는 브라우저 연결에 필요한 공개값이므로 배포 화면에서는 확인될 수 있지만, 저장소 소스에는 넣지 않는다. Secret key와 service role key는 저장하지 않는다.

## 검사와 배포

- `scripts/preview.cjs`: 로컬 미리보기 서버
- `tests/*.cjs`: 화면 구조, 업로드, 계산, 권한 연결을 확인하는 정적·mock 검사
- `scripts/build.cjs`: Vercel 환경변수로 `dist/js/supabase-config.js`를 생성한다.
- `vercel.json`: 환경변수 생성 빌드와 배포 파일의 캐시 정책. 이전 HTML과 최신 JavaScript가 섞이지 않도록 최신 파일을 다시 확인한다.

대표 검사 명령:

```powershell
node --check dist/js/app.js
node tests/dashboard-layout.cjs
node tests/deployment-cache.cjs
```

검사 통과는 코드 구조를 확인한 결과다. 실제 로그인, 파일 업로드, 권한 차단, 저장 후 재접속은 [test-checklist.md](test-checklist.md)의 별도 브라우저 확인 항목을 따른다.
