# 오류 기록

## 인수인계 선택·텍스트영역 스타일 미적용 (2026-09-19)

- 원인: CSS가 존재하지 않는 `.handover-form` 클래스를 대상으로 해 실제 `#handoverForm` 내부 요소에 적용되지 않았다.
- 조치: 실제 form ID를 대상으로 입력·날짜·select·textarea의 높이, 테두리, 모서리, 포커스를 통일하고 select 화살표를 유지했다.
- 상태: 코드·mock 검증 완료. 실제 브라우저 시각 확인은 미검증.

## 운행 저장 함수 schema cache 오류 (2026-09-18)

- 원인 확인: 003 SQL의 조회 정책에 enum app_role에 없는 executive를 포함해 22P02 발생. 트랜잭션 전체가 실패하여 함수가 생성되지 않았다.
- 수정: 실제 enum의 admin/editor/viewer만 사용. 함수 권한 검사에서 빈 문자열 enum 변환 오류가 없도록 text로 명시 변환. 성공 후 API 캐시 갱신 알림 추가.
- 상태: SQL 재실행 검증 완료. 2026-09-18 실제 프로젝트에서 실행 성공, 표·함수 존재 true, 인수 일치 및 authenticated 호출 권한 true 확인. 실제 파일 재업로드는 미검증.

- 접수: 업로드 후 save_driving_month(p_confirm,p_month,p_rows) 함수를 schema cache에서 찾을 수 없다는 오류.
- 발생 단계: 엑셀 읽기 이후 RPC 호출. 첨부 파일 자체의 전체 적합성을 검증한 것은 아니다.
- 코드 정의와 호출 인수는 p_month text, p_rows jsonb, p_confirm boolean으로 일치한다.
- 함수 미생성·다른 프로젝트 실행·API 캐시 미갱신 가능성을 구분하기 위해 004_check_driving_function.sql을 준비했다. 홈페이지 프로젝트는 jmzjttyijccilqefgbzt다.
- 캐시 재조회 명령 NOTIFY pgrst, 'reload schema' 실행 완료. 함수 존재 확인 완료, 홈페이지 파일 재시도 결과는 미확인.

업무 원본·개인정보는 첨부하지 않는다. 추정 원인은 추정으로 표시한다.
상태: 접수 / 조사 중 / 수정됨·미검증 / 검증 완료 / 미해결.

## 차량현황 제목과 데이터 열 밀림

- 원인: 제목의 체크박스는 첫 열, 데이터 행의 체크박스는 여섯 번째 열에 배치되어 순서가 달랐다.
- 조치: 사용자 요청대로 선택 체크박스·선택 삭제 제거. 제목과 행 모두 본부부터 관리까지 동일한 10열로 구성.
- 검증: JavaScript 문법 검사와 diff 검사 통과. 실데이터 삭제는 수행하지 않음.

## ERR-001: 업로드 시 null.value 오류

- 접수: 사용자 제보. 정확한 최초 발생일 미기록.
- 증상: Cannot set properties of null (setting 'value').
- 재현: 운행 업로드 팝업에서 파일을 선택하고 자료 확인 진행.
- 원인: 기존 개발 가이드에는 화면 수정 시 조회월 입력칸 제거로 DOM 연결이 깨진 것으로 기록되어 있다.
- 조치: 조회월 입력칸 복원 기록이 있다.
- 상태: 수정 기록 있음. 이후 리팩터링 검증에서 운행 CSV 업로드·월 조회 성공 확인. 최초 실패 파일 자체는 재검증하지 않음.
- 근거: DEVELOPMENT_GUIDE.md, docs/code-structure.md.

## ERR-002: BOM 없는 한글 UTF-8 CSV 열 인식 오류

- 확인: 2026-09-17 리팩터링 검증 기록 기준.
- 증상: 한글 필수 열 제목이 있음에도 누락 안내.
- 재현: BOM 없는 UTF-8 운행 CSV를 기존 SheetJS 읽기 경로로 업로드.
- 원인: 인코딩 처리 문제로 추정. 근본 원인은 추가 조사 필요.
- 우회: UTF-8 BOM 포함 익명 CSV는 업로드 성공.
- 상태: 미해결. 우회 확인은 근본 해결이 아니다.
- 다음 검증: BOM 유무 CSV, xlsx, 날짜·숫자·중복 입력을 함께 점검.

## 새 오류 기록 양식

- ID / 제목 / 확인일 / 상태:
- 증상과 영향 범위:
- 익명 재현자료와 실행 순서:
- 확인된 원인 또는 추정:
- 수정 내용 / 관련 파일·커밋:
- 실제 검증 결과 / 미확인 범위:
- 후속 작업:
# 2026-09-19 — 인수인계 PDF Storage 저장 실패

- 증상: PDF 선택 후 저장하면 `외관 자료 저장에 실패했습니다.` 표시.
- 원인: 화면은 PDF를 허용하도록 변경됐지만 실제 `handover-photos` 버킷의 `allowed_mime_types`에는 이미지 형식만 남아 있었다.
- 확인: Supabase 조회 결과 `image/jpeg`, `image/png`, `image/webp`만 허용됨.
- 조치: 화면 오류에 Storage 상세 사유를 표시하고, `005_handovers.sql`과 실제 버킷 허용 목록에 `application/pdf`를 추가했다.
- 검증: 실제 조회 결과 허용 목록에 `application/pdf`가 표시되고 `pdf_allowed=true`임을 확인했다.
