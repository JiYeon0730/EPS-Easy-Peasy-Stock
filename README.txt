EPS v0.7.1: account/page.tsx ESLint 오류 2개 수정

적용 위치:
  EPS-Easy-Peasy-Stock/src/app/account/page.tsx

수정 사항:
  1. Supabase 설정 여부에 맞게 초기 checking 상태를 설정.
  2. 기존 브라우저 종목(localStorage)은 useState 지연 초기화로 한번만 읽기.
  3. useEffect 안의 동기 setState 호출 두 곳 제거.

기존 종목 DB, API 키, Gemini 캡처, 통화 선택 코드는 변경하지 않음.

Windows PowerShell 검증:
  npm.cmd run typecheck
  npm.cmd run lint
  npm.cmd run build

주의: 백업하고 동일 경로 파일을 교체하세요.
