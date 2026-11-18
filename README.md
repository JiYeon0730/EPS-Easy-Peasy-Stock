# EPS — Easy Peasy Stock v0.6

쉽게 주식을 관리하는 Next.js 16 · React · TypeScript 웹사이트.

## v0.6에서 추가된 기능

- `캡처로 등록` 페이지에서 증권사 이미지를 선택하고 **브라우저에서 검은 박스를 그려 개인정보를 직접 가리기**
- 가림 처리가 반영된 JPEG만 EPS 서버 Route Handler로 전송; Gemini Vision으로 종목 코드, 종목명, 시장, 수량, 평균 매수가 인식
- Gemini JSON Schema 및 서버측 Zod 검증 → 사용자가 추출된 데이터를 수정하고 선택하여 등록
- 등록이 완료되기 전까지 기존 보유 종목에 쓰지 않음
- 원본 이미지/마스킹 이미지는 디스크, Supabase, localStorage에 저장하지 않음
- 데이터는 기존 브라우저 localStorage(`eps.holdings.v1`)에만 저장. **Supabase 로그인·RLS는 아직 미구현**
- 기존 v0.5 주가, 환율, 한미통화 이중 표시, 검색, 수동 CRUD 유지

## 설치

1. 압축을 풀고 EPS 폴더를 VS Code로 엽니다.
2. 기존 프로젝트의 `.env.local`을 복사하거나 `.env.example`을 `.env.local`로 복사합니다.
3. `.env.local`에 다음 키를 설정합니다 (실제 값은 채팅/저장소에 절대 게시하지 마세요):

```dotenv
FSC_STOCK_API_KEY=
FSC_LIST_API_KEY=
FINNHUB_API_KEY=
GEMINI_API_KEY=
GEMINI_VISION_MODEL=gemini-3.8-flash
```

4. Windows PowerShell에서 다음 명령어를 **한 줄씩** 실행합니다.

```powershell
npm.cmd install
npm.cmd run dev
```

5. `http://localhost:3000/import` 접속 → 테스트용 스크린샷 선택 → 민감정보 검은 박스 → 전송 동의 → AI 분석 → 추출값 검토 → 등록.

Google AI Studio API 키 발급: https://aistudio.google.com/apikey

### 주의: 개인정보·API 약관

- 자동 개인정보 탐지는 **없습니다**. 잘못 가리면 민감한 정보가 Google API에 전달될 수 있습니다. 가림 상태를 육안으로 확인해야 합니다.
- 브라우저 `canvas.toBlob()`에서 이미지 전체를 다시 그려 전송하므로 원본 파일과 EXIF가 전송되지 않도록 설계했습니다. 서버는 요청을 일시적으로 메모리에서 처리하며 디스크/스토리지에 쓰지 않습니다.
- Google **무료 Gemini API**의 제출 데이터는 약관에 따라 Google 제품 및 모델 개선에 사용될 수 있습니다. **개인정보가 포함된 실제 계좌 화면으로 테스트하지 마세요.** API의 별도 로깅/보관 규정도 확인하세요. https://ai.google.dev/gemini-api/terms
- 현재 인증 없이 로컬에서 기능을 검증하는 **MVP 단계**입니다. 메모리 기반 요청 제한은 여러 서버 인스턴스에서 일관되게 동작하지 않습니다. 안전을 위해 `NODE_ENV=production`에서는 캡처 API가 기본 비활성화됩니다. 공개 서비스 전에 Supabase Auth, 사용자별 한도, 모니터링, 보관정책과 라이선스를 검증해야 합니다.
- `@google/genai` 패키지 설치 없이 작동하도록 이번 버전의 Gemini 호출은 공식 `generateContent` REST API로 구현했습니다. 후속 단계에서 SDK 전환 가능합니다. Gemini 모델은 `.env.local`의 `GEMINI_VISION_MODEL`로 지정할 수 있습니다.

## 검사

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:vision
npm.cmd run test:catalog
npm.cmd run test:quotes
npm.cmd run test:dashboard
npm.cmd run test:directory
npm.cmd run build
```

`npm.cmd run build`는 개발 PC에서 별도 확인하세요. 테스트 환경에서는 Linux SWC 바이너리 다운로드가 불가했습니다.

### 화면별 구조

- `/` 포트폴리오 대시보드
- `/portfolio` 종목 추가/수정/삭제, 현재가 및 통화 환산
- `/import` 캡처 마스킹, AI 분석, 결과 검토 및 등록
- `/news` 맞춤 뉴스 링크 UI
- `/insights` 기본 인사이트 UI
- `/settings` 로컬 데이터 및 기타 설정

### 주요 구현 파일

- `src/app/import/page.tsx`: 마스킹 캔버스 및 결과 확인 UI
- `src/app/api/vision/extract/route.ts`: Gemini Vision 백엔드 Route Handler
- `src/lib/vision-extraction.ts`: JSON Schema, Zod 검증, 파일 시그니처 검증, 저장 전 유효성 검사
- `tests/vision-extraction.test.mjs`: OCR 결과 검증 및 유효성 테스트

## 프로젝트 개발 현황 (In Progress)

### 구현 및 검증 완료
- Next.js, React, TypeScript 기반 웹 애플리케이션
- Supabase Auth 로그인 기능
- Supabase 보유 종목 CRUD
- 새로고침 이후 데이터 유지 확인
- 데이터베이스 저장·수정·삭제 결과 검증
- GitHub 기반 소스 코드 관리

### 추가 검증 및 개발 예정
- 이메일 인증 및 다중 계정 테스트
- 계정별 데이터 접근 권한 검증
- 추가 기능 구현과 서비스 안정화
