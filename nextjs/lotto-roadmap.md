# 가변 로또 이벤트 플랫폼 개발 로드맵

관리자가 규칙을 자유롭게 설정하여 독립적인 로또 이벤트 프로젝트를 생성·운영하는 모바일 기반 웹 서비스

## 개요

가변 로또 이벤트 플랫폼(Lotto Event Engine)은 다음 기능을 제공합니다:

- **가변 규칙 이벤트 생성**: 숫자 범위, 세트 구성, 당첨 조건, 운영 주기를 자유롭게 설정
- **자동 추첨 배치 시스템**: 설정된 주기에 따라 당첨 번호 자동 생성 및 당첨 판정
- **모바일 퍼스트 참여 UI**: URL 링크 하나로 진입, 번호 선택부터 결과 확인까지 원활한 모바일 경험
- **관리자 대시보드**: 다수 프로젝트 동시 운영, 통계, 보상 처리

## 개발 워크플로우

1. **작업 계획**
   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 `lotto-roadmap.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**
   - 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
   - **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)**

3. **작업 구현**
   - 작업 파일의 명세서를 따름
   - **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수**
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**
   - 로드맵에서 완료된 작업을 ✅로 표시

## 개발 단계

### Phase 1: 기반 구축 — 우선순위

- **Task 001: 프로젝트 구조 및 라우팅 설정** — 우선순위
  - Next.js App Router 기반 전체 라우트 구조 생성
  - Admin 페이지 라우트: `/admin/login`, `/admin`, `/admin/projects/new`, `/admin/projects/[id]`, `/admin/projects/[id]/rounds/[roundId]`, `/admin/rewards`
  - User 페이지 라우트: `/event/[projectId]`, `/event/[projectId]/play`, `/event/[projectId]/history`, `/event/[projectId]/results`, `/event/[projectId]/claim/[resultId]`
  - 모든 주요 페이지의 빈 껍데기 파일 생성
  - Admin 사이드바 레이아웃 / User 모바일 레이아웃 골격 구현

- **Task 002: TypeScript 타입 정의 및 인터페이스 설계**
  - PRD 섹션 5.4 데이터 모델 기반 TypeScript 인터페이스 정의
  - `projects`, `reward_policies`, `draw_rounds`, `participants`, `entries`, `winning_results`, `reward_claims`, `chance_usage` 타입 정의
  - API 요청/응답 타입 정의 (Admin API, User API, Batch API)
  - 컴포넌트 Props 타입 정의 (NumberGrid, NumberBall, Countdown)
  - 더미 데이터 생성 유틸리티 작성

- **Task 003: Supabase DB 스키마 및 초기 설정**
  - PRD 섹션 5.4 기준 테이블 생성 SQL 마이그레이션 작성
  - `integer[]` 배열 타입 사용 (JSON 배열 대체 금지)
  - Row Level Security (RLS) 정책 설정
  - 주요 인덱스 생성: `entries(round_id, participant_id)`, `draw_rounds(project_id, status, scheduled_at)` 등
  - DB 트리거 구현: `projects` 정책 필드 UPDATE 방지, `reward_policies` 추첨 후 변경 방지
  - pgcrypto 확장 활성화 (보상 정보 암호화용)
  - Supabase 클라이언트 설정 (`@supabase/supabase-js`, 환경 변수 관리)

- **Task 004: 관리자 인증 시스템**
  - Supabase Auth 기반 이메일/비밀번호 로그인 구현
  - Next.js 미들웨어로 `/admin/*` 경로 JWT 검증 및 리다이렉트 처리
  - 세션 만료 처리 및 재로그인 요구
  - 로그인/로그아웃 Server Action 구현
  - Playwright MCP를 활용한 인증 플로우 E2E 테스트

### Phase 2: UI/UX 구현 (더미 데이터 활용)

- **Task 005: 커스텀 컴포넌트 라이브러리 구현**
  - shadcn/ui 추가 컴포넌트 설치 (Tabs, Dialog, Badge, Accordion, Sheet, Select, Stepper)
  - **NumberGrid** 컴포넌트: `number_min`~`number_max` 범위 그리드, 선택 시 primary 강조 + 애니메이션, 완료 시 나머지 muted 처리, 5열(모바일)/7열(태블릿) 레이아웃
  - **NumberBall** 컴포넌트: 원형 숫자 공, 당첨 일치 시 success 색상 + 바운스 애니메이션, sm/md/lg 크기 변형
  - **Countdown** 컴포넌트: 시:분:초 표시, 1분 이하 경고 색상, 0초 시 콜백 트리거
  - 로딩 스켈레톤, 빈 상태 UI 컴포넌트 구현

- **Task 006: 관리자 페이지 UI 구현**
  - 관리자 로그인 페이지 UI (`/admin/login`)
  - 대시보드 메인: 프로젝트 목록 + 요약 통계 카드 (`/admin`)
  - 프로젝트 생성 단계별 폼 위저드 UI (`/admin/projects/new`): 기본 설정 → 리워드 정책 → 참여 기회 → 검토 확인
  - 프로젝트 상세: 설정 확인 + 통계 + 회차 목록 탭 UI (`/admin/projects/[id]`)
  - 회차 상세: 당첨 번호 + 당첨자 목록 테이블 (`/admin/projects/[id]/rounds/[roundId]`)
  - 보상 관리: 상태별 필터 테이블 + 지급 처리 Dialog (`/admin/rewards`)
  - 더미 차트 컴포넌트 구현 (참여 추이)
  - 반응형 사이드바 레이아웃 (태블릿 이상)

- **Task 007: 사용자 페이지 UI 구현**
  - 사용자명 입력 가입 폼 UI (`/event/[projectId]` 첫 진입)
  - 이벤트 메인 화면: 남은 기회 + 카운트다운 + 최신 결과 + 참여 CTA (`/event/[projectId]`)
  - 번호 선택 페이지: NumberGrid + 직접/자동 선택 모드 + 제출 확인 팝업 (`/event/[projectId]/play`)
  - 참여 이력 페이지: 회차별 Accordion, 당첨 번호 하이라이트 (`/event/[projectId]/history`)
  - 결과 확인 페이지: NumberBall 표시, 당첨 여부 강조 (`/event/[projectId]/results`)
  - 보상 수령 폼: 이름, 연락처, 계좌 정보 입력 (`/event/[projectId]/claim/[resultId]`)
  - 데스크탑에서 max-width 480px 중앙 정렬 유지
  - userid 파라미터 누락, 비활성/종료 프로젝트 접근 에러 상태 UI

### Phase 3: 핵심 API 및 비즈니스 로직 구현

- **Task 008: 관리자 프로젝트 관리 API**
  - `POST /api/admin/projects`: 프로젝트 생성 (Zod 스키마 검증, `pick_count <= number_max - number_min + 1` 검증, `draw_interval_minutes` 범위 60~10080)
  - `GET /api/admin/projects`: 상태별 필터 목록 조회
  - `GET /api/admin/projects/[id]`: 프로젝트 상세 + reward_policies 조회
  - `PATCH /api/admin/projects/[id]/status`: 상태 변경 (paused/ended, 종료 후 재활성화 불가)
  - 모든 Admin API JWT 검증 미들웨어 적용
  - Playwright MCP를 활용한 프로젝트 생성/조회/상태 변경 테스트

- **Task 009: 사용자 진입 및 번호 제출 API**
  - `GET /api/event/[projectId]`: 프로젝트 정보 + 현재 회차 조회 (userid 파라미터 검증)
  - `POST /api/event/[projectId]/join`: 참여자 가입 (사용자명 2~20자, 한글/영문/숫자 검증)
  - `GET /api/event/[projectId]/chances`: 남은 참여 기회 계산 (시간 기반 로직, `chance_usage` 테이블 조회)
  - `POST /api/event/[projectId]/entries`: 번호 제출 (기회 차감 + 번호 저장 단일 트랜잭션, Race Condition 방지 `SELECT FOR UPDATE`)
  - Rate Limiting 적용: 번호 제출 API 사용자당 분당 10회
  - 추첨 중 제출 시 다음 회차 귀속 처리
  - Playwright MCP를 활용한 가입 → 기회 조회 → 번호 제출 E2E 테스트

- **Task 010: 자동 추첨 배치 시스템**
  - `POST /api/batch/draw`: 배치 추첨 API (API Key 인증, Cron 호출 전용)
  - 활성 프로젝트 중 `scheduled_at` 도래한 `draw_rounds` 조회
  - 숫자 범위 내 `pick_count`개 중복 없이 무작위 당첨 번호 생성
  - 해당 회차 `entries` 전체 조회 → 당첨 번호와 비교 → `match_count` 계산
  - `reward_policies` 기준 당첨 Case 판정 → `winning_results` 저장
  - 추첨 완료 후 다음 회차 `draw_rounds` 자동 생성
  - 비활성/종료 프로젝트 추첨 건너뜀 처리
  - Vercel Cron Jobs 설정 (`vercel.json`)
  - 추첨 실행 로그 기록 + 재시도 로직 구현
  - Playwright MCP를 활용한 추첨 실행 통합 테스트

### Phase 4: 보상 및 통계

- **Task 011: 회차 결과 및 통계 조회 API**
  - `GET /api/admin/projects/[id]/rounds`: 회차 목록 페이지네이션
  - `GET /api/admin/projects/[id]/rounds/[roundId]`: 회차 상세 (당첨 번호, 당첨자 목록)
  - `GET /api/admin/projects/[id]/stats`: 총 참여자 수, 총 참여 횟수, 누적 당첨금, 회차별 참여 추이 데이터
  - `GET /api/event/[projectId]/rounds/latest`: 최신 추첨 결과 + 본인 당첨 여부
  - `GET /api/event/[projectId]/entries`: 본인 참여 이력 (회차별 번호 세트 + 당첨 여부)
  - 관리자 통계 페이지 차트 실데이터 연동
  - Playwright MCP를 활용한 결과 조회 테스트

- **Task 012: 보상 수령 플로우 구현**
  - `POST /api/event/[projectId]/rewards/[resultId]/claim`: 보상 정보 제출 (pgcrypto로 이름, 연락처, 계좌 암호화 저장)
  - `GET /api/event/[projectId]/rewards`: 본인 당첨/보상 현황 조회
  - 보상 수령 상태(unclaimed/claimed/processing/paid) UI 표시
  - 당첨 시 축하 화면 + "보상 수령" 버튼 표시
  - Zod 스키마 검증 (이름, 연락처, 계좌번호 형식)
  - Playwright MCP를 활용한 보상 수령 플로우 E2E 테스트

- **Task 013: 관리자 보상 관리 API**
  - `GET /api/admin/rewards`: 보상 대기 목록 (프로젝트별/상태별 필터)
  - `PATCH /api/admin/rewards/[id]/status`: 보상 지급 상태 변경 (processing → paid)
  - 복호화된 수령인 정보 조회 (관리자 전용)
  - 일괄 지급 처리 기능
  - Playwright MCP를 활용한 보상 관리 테스트

### Phase 5: 폴리싱 및 최적화

- **Task 014: 실시간 기능 및 UX 개선**
  - Countdown 컴포넌트 0초 도달 시 최신 결과 자동 갱신 (polling 또는 Supabase Realtime)
  - 추첨 완료 후 접속 시 새 결과 배너 알림 (U-6)
  - 당첨 시 강조 알림 화면
  - 광고 시청 Mock 구현: 버튼 클릭 후 3초 대기 후 기회 지급
  - 네트워크 오류 재시도 버튼 및 오류 메시지 처리
  - Toast 알림 시스템 (sonner) 전체 적용
  - 로딩 스켈레톤 및 빈 상태 UI 전체 적용

- **Task 015: 성능 최적화 및 배포**
  - 모바일 FCP 2초 이하 달성 검증
  - Supabase 쿼리 최적화 (인덱스 활용 확인)
  - 번들 크기 최적화
  - Vercel 환경 변수 구성 및 프로덕션 배포
  - Cron Job 설정 확인 및 추첨 배치 모니터링
  - 전체 플로우 E2E 테스트 (관리자 + 사용자 + 배치 추첨)
  - 주요 브라우저 호환성 테스트 (Chrome, Safari, Samsung Internet)

## 작업별 세부 사항

### 각 Task 파일 구조
```markdown
# Task XXX: [작업명]

## 개요
- **목표**: [작업의 핵심 목표]
- **관련 기능**: [A-1, U-2 등 PRD 기능 ID]
- **의존성**: [이전에 완료되어야 할 Task]

## 구현 사항
- [ ] 세부 구현 항목 1
- [ ] 세부 구현 항목 2

## 수락 기준
- 기준 1: [측정 가능한 완료 조건]
- 기준 2: [측정 가능한 완료 조건]

## 테스트 체크리스트 (API/비즈니스 로직 작업 시)
- [ ] Playwright MCP 테스트 시나리오 1
- [ ] Playwright MCP 테스트 시나리오 2
- [ ] 에러 케이스 테스트

## 관련 파일
- /app/[경로]/page.tsx
- /components/[컴포넌트].tsx
- /lib/[유틸리티].ts
```

## 기술 스택 체크리스트

### 이미 설치됨 ✅
- [x] Next.js (App Router)
- [x] TypeScript
- [x] Tailwind CSS v4
- [x] shadcn/ui (new-york 스타일, neutral 색상)
- [x] lucide-react
- [x] next-themes
- [x] @supabase/supabase-js
- [x] react-hook-form
- [x] zod
- [x] sonner

### 추가 필요
- [ ] `vercel.json` Cron Jobs 설정 (Task 010에서 구성)

### 사용 금지 (PRD 11.3 준수)
- ❌ Prisma, Drizzle 등 별도 ORM
- ❌ Redux, Zustand 등 상태관리 라이브러리
- ❌ Socket.io
- ❌ NextAuth 등 별도 인증 라이브러리

## 품질 체크리스트

### Phase 완료 기준

#### Phase 1 (기반 구축)
- [ ] 전체 Admin/User 라우트 파일 생성 완료
- [ ] TypeScript 타입 정의 완료 (PRD 5.4 기준)
- [ ] Supabase 테이블, RLS, 인덱스, 트리거 생성 완료
- [ ] 관리자 로그인/세션/리다이렉트 동작 확인

#### Phase 2 (UI/UX)
- [ ] NumberGrid, NumberBall, Countdown 커스텀 컴포넌트 완성
- [ ] 모든 Admin/User 페이지 UI가 더미 데이터로 완성
- [ ] 모바일 퍼스트 레이아웃 (User 페이지 데스크탑 480px 중앙 정렬)
- [ ] 에러 상태 UI (userid 누락, 비활성/종료 프로젝트) 완성

#### Phase 3 (핵심 API)
- [ ] 관리자 프로젝트 생성/조회/상태 변경 API 동작
- [ ] 사용자 가입 → 기회 조회 → 번호 제출 전체 플로우 동작
- [ ] 자동 추첨 배치 정시 실행 (설정 시간 ±10초 이내)
- [ ] Race Condition 방지 트랜잭션 처리 확인
- [ ] Playwright MCP 테스트 통과

#### Phase 4 (보상 및 통계)
- [ ] 보상 정보 pgcrypto 암호화 저장 확인
- [ ] 관리자 통계 페이지 실데이터 연동
- [ ] 보상 수령 → 관리자 처리 전체 플로우 동작

#### Phase 5 (최적화)
- [ ] 모바일 FCP 2초 이하 달성
- [ ] Vercel 프로덕션 배포 성공
- [ ] Cron Job 배치 추첨 동작 확인
- [ ] 전체 E2E 테스트 통과

## 주요 엣지 케이스 체크리스트

- [ ] `userid` 파라미터 누락 시 안내 메시지 + 참여 차단
- [ ] 비활성화된 프로젝트 접근 시 "이벤트가 일시 중단되었습니다" 표시
- [ ] 종료된 프로젝트 접근 시 "이벤트가 종료되었습니다" + 결과 조회만 허용
- [ ] 참여 기회 소진 시 다음 충전 카운트다운 표시
- [ ] 추첨 중 번호 제출 시 다음 회차 자동 귀속
- [ ] `pick_count > number_max - number_min + 1` 프로젝트 생성 거부
- [ ] `draw_interval_minutes` 범위(60~10080) 외 입력 거부
- [ ] 기회 차감 Race Condition 방지 (DB 트랜잭션)
- [ ] 네트워크 오류 재시도 버튼 제공

## 마일스톤 대응표

| 마일스톤 | PRD 정의 | 로드맵 Phase |
|---------|---------|------------|
| M1: 기반 구축 | DB 스키마, Supabase 설정, 인증, 프로젝트 생성 API | Phase 1 + Task 008 |
| M2: 사용자 참여 | 사용자 가입, 번호 선택 UI, 번호 제출 API | Phase 2 (Task 007) + Task 009 |
| M3: 추첨 엔진 | 배치 추첨, 당첨 판정, 결과 표시 | Task 010 + Task 011 |
| M4: 보상 및 통계 | 보상 수령 플로우, 관리자 통계, 보상 관리 | Task 012 + Task 013 |
| M5: 폴리싱 | 실시간 카운트다운, 알림, UX 개선, 성능 최적화 | Phase 5 |

## 다음 단계

1. **즉시 시작**: Task 001 (프로젝트 구조 및 라우팅 설정)
2. **Phase 1 완료 후**: Task 005 커스텀 컴포넌트 개발 시작
3. **UI 우선 개발**: Phase 2에서 더미 데이터로 전체 UI를 완성한 후 API 구현 진행
4. **배치 시스템 최우선 검증**: Task 010 완료 후 반드시 실제 타이밍 테스트 수행

---

**📌 이 로드맵은 PRD `lotto.md` v1.0을 기반으로 하며, P0(Must Have) 기능을 중심으로 구성되었습니다.**
**P1/P2 기능은 Phase 5 완료 후 별도 요청 시 추가합니다.**
**PRD 섹션 11의 AI 개발 주의사항을 항상 준수하여 구현합니다.**
