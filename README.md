# 법인차량 데이터관리

법인차량의 차량·담당자, 계약, 사고, 인수인계, 운행기록, 비용 마감 자료를 관리하는 홈페이지입니다.

운영 주소: <https://krryugt-gray.vercel.app/>

## 현재 제공 기능

- 이메일 로그인, 관리자·일반회원 권한, 10분 무활동 자동 로그아웃
- 차량현황의 본부·부·팀·CC·담당자·차량 정보 등록, 수정, Excel 업로드·내려받기
- 차량번호를 기준으로 차량계약정보에 조직·CC·담당자 정보를 연결
- 사고접수, 차량인수인계, Q&A, 운행가이드의 사진·PDF 첨부와 이력 조회
- 월별 운행기록·비용마감 자료의 업로드, 조회, 확정·보관 흐름
- 대시보드의 현재 차량·계약 요약, 부서별 차량현황, 차량 이용량, 비용 추이
- 관리자 전용 Storage·DB 사용량과 무료 플랜 기준 잔여용량 확인, 80% 이상 경고

자료는 Supabase에 저장합니다. 차량·계약·회원·이력 같은 구조화된 정보는 DB에, 사고·인수인계·Q&A·가이드의 첨부는 비공개 Storage에 보관합니다. 운행·비용 자료의 실제 저장·마감 흐름은 [검증 목록](docs/test-checklist.md)에서 확인합니다.

## 사용 방법

1. 운영 주소에서 회사 계정으로 로그인합니다.
2. 차량현황에 차량 기본정보를 먼저 등록하거나 Excel로 업로드합니다.
3. 차량계약정보·운행기록데이터·비용마감자료는 차량번호를 기준으로 등록합니다.
4. 대시보드에서 차량·계약·운행·비용 요약을 확인합니다.
5. 관리자 계정은 회원관리와 용량확인 메뉴를 사용할 수 있습니다.

Excel의 열 이름과 날짜 입력 형식은 [Excel 형식](docs/excel-format.md)을 따릅니다. 날짜는 `yyyy-mm-dd`로 표시하며 `2026-9-1`처럼 월·일 앞자리 0을 생략해도 입력할 수 있습니다.

## 로컬 미리보기와 확인

프로젝트 폴더에서 아래 명령을 실행한 뒤 `http://127.0.0.1:4173/`을 엽니다.

```powershell
node scripts/preview.cjs
```

JavaScript 문법 확인 예시:

```powershell
node --check dist/js/app.js
node --check dist/js/dialogs.js
```

배포에는 `dist/` 폴더 전체가 포함되어야 합니다. 최신 배포 화면이 보이지 않으면 Chrome에서 `Ctrl + F5`로 새로고침합니다.

## 문서 안내

- [확정 요구사항](docs/requirements.md)
- [화면·디자인 기준](docs/design.md)
- [저장 구조](docs/data-model.md)
- [Excel 형식](docs/excel-format.md)
- [업무 계산·마감 규칙](docs/data-rules.md)
- [오류 기록과 조치](docs/errors.md)
- [검증 목록](docs/test-checklist.md)
- [현재 진행 상태](docs/roadmap.md)
- [실제 변경 이력](CHANGELOG.md)
- [개발 원칙](AGENTS.md)
