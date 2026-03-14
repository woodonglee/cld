# 가변 로또 이벤트 플랫폼 (Lotto Event Engine) PRD

## 문서 정보
- **버전**: 1.0
- **작성일**: 2026-03-14
- **상태**: 초안

---

## 1. 개요 (Executive Summary)

### 1.1 제품 설명
관리자가 로또의 규칙(숫자 범위, 세트 구성, 당첨 조건, 주기 등)을 자유롭게 설정하여 독립적인 '이벤트 프로젝트'를 생성하고 운영할 수 있는 모바일 기반 웹 서비스이다. 하나의 시스템 내에서 서로 다른 규칙의 로또 이벤트를 동시에 운영할 수 있으며, 관리자 대시보드와 사용자 참여 페이지가 분리된 구조로 설계된다.

### 1.2 배경 및 동기
- 다양한 이벤트/프로모션에서 로또 형태의 참여형 게임을 손쉽게 구성할 수 있는 범용 엔진이 부재하다.
- 매번 새로운 이벤트를 위해 개별 시스템을 개발하는 것은 비효율적이다.
- 하나의 플랫폼에서 규칙만 설정하면 곧바로 이벤트를 생성하고 운영할 수 있는 재사용 가능한 엔진이 필요하다.

### 1.3 목표
- **비즈니스 목표**: 다양한 형태의 로또 이벤트를 빠르게 기획-배포할 수 있는 플랫폼 제공
- **사용자 목표**: 직관적인 모바일 UX로 이벤트에 참여하고 결과를 즉시 확인
- **기술적 목표**: 가변 규칙 엔진 설계, 자동 추첨 배치 시스템, 다중 프로젝트 동시 운영

### 1.4 성공 지표 (KPI)
- [ ] 프로젝트 생성 후 5분 이내 사용자 참여 가능 상태 도달
- [ ] 사용자 참여 페이지 First Contentful Paint 1.5초 이하 (모바일 기준)
- [ ] 자동 추첨 배치 정시 실행률 99.9%
- [ ] 동시 활성 프로젝트 100개 이상 운영 가능

---

## 2. 사용자 분석

### 2.1 타겟 사용자

| 페르소나 | 설명 | 주요 니즈 | 페인 포인트 |
|---------|------|----------|------------|
| 이벤트 관리자 | 마케팅/프로모션 담당자 | 코드 없이 로또 이벤트 생성, 실시간 통계 확인 | 매번 개발팀에 의뢰해야 하는 이벤트 개발 지연 |
| 시스템 관리자 | 플랫폼 전체 운영 담당 | 다수 프로젝트 모니터링, 배치 시스템 관리 | 서로 다른 규칙의 이벤트를 하나의 시스템에서 관리하기 어려움 |
| 이벤트 참여자 | 모바일로 이벤트에 참여하는 일반 사용자 | 간편한 참여, 즉시 결과 확인, 보상 수령 | 복잡한 가입 절차, 느린 로딩, 결과 확인 어려움 |

### 2.2 사용자 여정 (User Journey)

**관리자 여정**
1. 관리자가 Admin 페이지에 로그인한다
2. "새 프로젝트 생성" 버튼을 클릭한다
3. 숫자 범위, 세트 구성, 리워드 정책, 운영 주기, 참여 기회 정책을 설정한다
4. 설정을 검토한 뒤 프로젝트를 생성한다 (생성 후 정책 변경 불가)
5. 생성된 프로젝트의 참여 링크를 사용자에게 배포한다
6. 대시보드에서 참여 현황, 당첨 결과, 통계를 실시간 확인한다

**사용자 여정**
1. 사용자가 배포된 이벤트 링크(`?userid=xxx`)로 접속한다
2. 첫 접속 시 사용자명을 입력하여 간단히 가입한다
3. 무료 기회 또는 광고 시청으로 참여 기회를 얻는다
4. 번호를 직접 선택하거나 자동 생성 버튼으로 번호를 뽑는다
5. 추첨 시간이 되면 결과를 확인하고, 당첨 시 보상 정보를 입력한다

---

## 3. 기능 요구사항

### 3.1 핵심 기능 (Must Have - P0)

#### 기능 A-1: 관리자 로그인 및 인증
- **설명**: 관리자 전용 로그인 시스템. Supabase Auth 기반으로 이메일/비밀번호 인증을 제공한다.
- **사용자 스토리**: As an Admin, I want to securely log in to the dashboard so that I can manage lottery projects.
- **인수 조건**:
  - [ ] 이메일 + 비밀번호 로그인이 동작한다
  - [ ] 미인증 상태에서 Admin 페이지 접근 시 로그인 페이지로 리다이렉트된다
  - [ ] 세션 만료 시 재로그인을 요구한다
  - [ ] 관리자 계정은 Supabase 대시보드에서 수동으로 생성한다 (자체 회원가입 없음)

#### 기능 A-2: 로또 이벤트 프로젝트 생성
- **설명**: 관리자가 모든 규칙 변수를 설정하여 새로운 이벤트 프로젝트를 생성한다. 생성 후 정책 변경은 불가하다.
- **사용자 스토리**: As an Admin, I want to create a lottery project with custom rules so that I can launch different events quickly.
- **인수 조건**:
  - [ ] 프로젝트명을 입력할 수 있다
  - [ ] 숫자 범위(시작, 끝)를 정수로 설정할 수 있다 (예: 1~45, 1~10)
  - [ ] 세트 구성(뽑아야 할 숫자 개수)을 설정할 수 있다 (예: 6개)
  - [ ] 리워드 정책을 맞힌 개수(Case)별로 당첨금과 함께 설정할 수 있다 (예: 6개 전부 = 100만원, 5개 = 10만원, ...)
  - [ ] 운영 주기를 설정할 수 있다: 주기 단위(시간/일/주), 주기 값(최소 1시간, 최대 1주), 시작 시점(날짜+시간)
  - [ ] 무료 참여 기회를 설정할 수 있다: 시간 단위, 제공 횟수 (예: 1시간당 1회)
  - [ ] 광고 참여 기회를 설정할 수 있다: 시간 단위, 제공 횟수 (예: 1시간당 2회)
  - [ ] 설정 요약을 검토 화면에서 확인한 후 최종 생성한다
  - [ ] 숫자 범위보다 세트 구성 개수가 크면 생성이 거부된다
  - [ ] 생성 완료 시 고유 프로젝트 ID와 참여 URL이 생성된다
  - [ ] 생성 후 정책 관련 필드는 수정 API가 존재하지 않는다

#### 기능 A-3: 프로젝트 목록 및 상태 관리
- **설명**: 생성된 프로젝트 목록을 조회하고, 프로젝트를 비활성화하거나 종료할 수 있다.
- **사용자 스토리**: As an Admin, I want to view and manage all projects so that I can control their lifecycle.
- **인수 조건**:
  - [ ] 프로젝트 목록을 상태별(활성/비활성/종료) 필터로 조회할 수 있다
  - [ ] 프로젝트를 비활성화하면 사용자 접근 시 "이벤트가 일시 중단되었습니다" 메시지가 표시된다
  - [ ] 프로젝트를 종료하면 사용자 접근 시 "이벤트가 종료되었습니다" 메시지가 표시되며, 당첨 결과 조회만 가능하다
  - [ ] 종료된 프로젝트는 다시 활성화할 수 없다

#### 기능 A-4: 프로젝트 통계 및 데이터 조회
- **설명**: 프로젝트별 참여 현황, 회차별 당첨 정보, 누적 통계를 확인한다.
- **사용자 스토리**: As an Admin, I want to view project statistics so that I can monitor event performance.
- **인수 조건**:
  - [ ] 프로젝트별 총 참여자 수, 총 참여 횟수, 현재 회차 번호를 확인할 수 있다
  - [ ] 회차별 당첨 번호, 당첨자 목록(사용자명, 맞힌 개수, 당첨금)을 조회할 수 있다
  - [ ] 누적 당첨금 총액, 회차별 참여 추이 차트를 제공한다

#### 기능 A-5: 자동 추첨 배치 시스템
- **설명**: 각 프로젝트의 운영 주기에 따라 당첨 번호를 자동 생성하고, 해당 회차 참여자의 당첨 여부를 판정한다.
- **사용자 스토리**: As a System, I want to automatically draw winning numbers at scheduled intervals so that results are generated without manual intervention.
- **인수 조건**:
  - [ ] 설정된 주기(시작 시점 기준)에 정확히 추첨이 실행된다
  - [ ] 당첨 번호는 해당 프로젝트의 숫자 범위 내에서 세트 구성 개수만큼 중복 없이 무작위 생성된다
  - [ ] 해당 회차에 참여한 모든 사용자의 번호와 당첨 번호를 비교하여 맞힌 개수를 계산한다
  - [ ] 리워드 정책에 따라 당첨 Case를 판정하고 기록한다
  - [ ] 추첨 완료 후 다음 회차가 자동으로 시작된다
  - [ ] 비활성화/종료된 프로젝트는 추첨을 건너뛴다

#### 기능 U-1: 사용자 진입 및 가입
- **설명**: 이벤트 URL의 `userid` 파라미터로 사용자를 식별하고, 첫 접속 시 사용자명 입력으로 간단히 가입한다.
- **사용자 스토리**: As a User, I want to join an event with minimal friction so that I can start playing quickly.
- **인수 조건**:
  - [ ] URL 형식: `/event/{projectId}?userid={userid}` (userid는 외부 시스템에서 부여한 고유 식별자)
  - [ ] `userid` 파라미터가 없으면 안내 메시지와 함께 참여가 차단된다
  - [ ] 해당 `userid`가 프로젝트에 최초 접속이면 사용자명 입력 폼이 표시된다
  - [ ] 사용자명은 2~20자, 한글/영문/숫자만 허용한다
  - [ ] 가입 완료 후 즉시 이벤트 메인 화면으로 이동한다
  - [ ] 이미 가입된 `userid`면 곧바로 이벤트 메인 화면이 표시된다

#### 기능 U-2: 번호 뽑기 (참여)
- **설명**: 사용자가 참여 기회를 사용하여 번호를 선택한다.
- **사용자 스토리**: As a User, I want to pick lottery numbers so that I can participate in the draw.
- **인수 조건**:
  - [ ] 현재 남은 참여 기회(무료/광고)가 화면 상단에 표시된다
  - [ ] "직접 선택" 모드: 숫자 범위 내에서 세트 구성 개수만큼 숫자를 탭하여 선택한다
  - [ ] "자동 선택" 모드: 버튼 한 번으로 무작위 번호를 자동 생성한다
  - [ ] 중복 번호 선택은 불가하다
  - [ ] 세트 구성 개수가 충족되지 않으면 제출 버튼이 비활성화된다
  - [ ] 제출 시 확인 팝업이 표시되며, 확인 후 참여 기회가 1 차감된다
  - [ ] 무료 기회가 소진된 경우, "광고 보고 참여하기" 버튼이 표시된다
  - [ ] 모든 기회(무료+광고)가 소진된 경우, 다음 기회 충전까지 남은 시간이 카운트다운으로 표시된다
  - [ ] 참여한 번호는 현재 회차에 기록되며, 해당 회차 추첨 전까지 추가 참여 가능하다

#### 기능 U-3: 참여 이력 조회
- **설명**: 사용자가 자신의 참여 이력을 회차별로 조회한다.
- **사용자 스토리**: As a User, I want to view my participation history so that I can track my entries.
- **인수 조건**:
  - [ ] 회차 목록이 최신순으로 정렬되어 표시된다
  - [ ] 각 회차별로 내가 뽑은 번호 세트 목록이 표시된다
  - [ ] 추첨 완료된 회차는 당첨 번호와 비교하여 맞힌 번호가 하이라이트된다
  - [ ] 당첨된 경우 당첨 Case와 당첨금이 표시된다

#### 기능 U-4: 결과 확인 및 보상 수령
- **설명**: 추첨 결과를 확인하고, 당첨 시 보상 수령을 위한 정보를 입력한다.
- **사용자 스토리**: As a User, I want to check results and claim rewards so that I can receive my prize.
- **인수 조건**:
  - [ ] 최신 추첨 결과가 이벤트 메인 화면 상단에 표시된다
  - [ ] 당첨된 경우 축하 화면과 함께 "보상 수령" 버튼이 표시된다
  - [ ] 보상 수령 폼에서 이름, 연락처, 계좌 정보를 입력할 수 있다
  - [ ] 보상 정보 제출 후 "처리 중" 상태로 변경되며, 관리자가 확인 후 지급 처리한다
  - [ ] 보상 수령 상태(미수령/처리중/지급완료)가 이력에 표시된다

### 3.2 부가 기능 (Should Have - P1)

#### 기능 A-6: 당첨자 보상 처리
- **설명**: 관리자가 당첨자의 보상 수령 요청을 확인하고 지급 상태를 관리한다.
- **인수 조건**:
  - [ ] 보상 대기 목록을 프로젝트별/상태별로 조회할 수 있다
  - [ ] 당첨자의 보상 정보(이름, 연락처, 계좌)를 확인할 수 있다
  - [ ] 지급 상태를 "처리중" -> "지급완료"로 변경할 수 있다
  - [ ] 일괄 지급 처리 기능을 제공한다

#### 기능 U-5: 실시간 추첨 카운트다운
- **설명**: 다음 추첨까지 남은 시간을 실시간으로 표시한다.
- **인수 조건**:
  - [ ] 이벤트 메인 화면에 다음 추첨 일시와 카운트다운이 표시된다
  - [ ] 추첨 시간 도래 시 자동으로 결과를 갱신한다

#### 기능 U-6: 알림 기능
- **설명**: 추첨 결과가 발표되면 사용자에게 인앱 알림을 제공한다.
- **인수 조건**:
  - [ ] 추첨 완료 후 접속 시 새로운 결과가 있음을 배너로 알린다
  - [ ] 당첨 시 강조된 알림 화면을 표시한다

### 3.3 향후 고려 기능 (Nice to Have - P2)
- 소셜 공유 기능 (카카오톡, 링크 복사)
- 푸시 알림 (Service Worker 기반)
- 이벤트 참여 랭킹 및 리더보드
- 관리자 대시보드 실시간 갱신 (WebSocket/SSE)
- 광고 SDK 실제 연동 (Google AdMob 등)

---

## 4. 비기능적 요구사항

### 4.1 성능
- 사용자 페이지 FCP (First Contentful Paint): 모바일 3G 환경 기준 2초 이하
- 번호 제출 API 응답 시간: 500ms 이하
- 자동 추첨 배치: 설정된 시간 대비 +/- 10초 이내 실행
- 관리자 통계 페이지 로드: 3초 이하 (프로젝트당 참여 데이터 100만 건 기준)

### 4.2 보안
- **관리자 인증**: Supabase Auth (이메일/비밀번호), JWT 기반 세션 관리
- **사용자 식별**: userid 파라미터 기반 (외부 시스템 연동 전제). userid는 URL에 노출되므로 추측 불가능한 UUID 형태 권장
- **API 보안**: 관리자 API는 Supabase RLS(Row Level Security) + JWT 검증. 사용자 API는 userid + projectId 조합으로 접근 제한
- **데이터 보호**: 보상 정보(계좌, 연락처)는 DB에 암호화 저장
- **입력 검증**: 모든 API에 서버 사이드 Zod 스키마 검증 적용
- **Rate Limiting**: 번호 제출 API에 사용자당 분당 10회 제한

### 4.3 확장성
- 동시 활성 프로젝트 100개 이상 지원
- 프로젝트당 참여자 10만 명 이상 대응
- Supabase Edge Functions 또는 Vercel Cron Jobs를 활용한 배치 수평 확장
- DB 인덱스 설계를 통한 대량 참여 데이터 조회 성능 보장

### 4.4 접근성
- 모바일 터치 타겟 최소 44x44px
- 색상 대비 WCAG 2.1 AA 기준 충족
- 로또 번호 선택 시 시각적 피드백 제공 (색상 + 크기 변화)

---

## 5. 기술 요구사항

### 5.1 기술 스택
- **프론트엔드**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **UI 컴포넌트**: shadcn/ui (new-york 스타일, neutral 색상)
- **폼 관리**: react-hook-form + zod
- **토스트/알림**: sonner
- **아이콘**: lucide-react
- **백엔드/DB**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **배치 처리**: Supabase Edge Functions (Deno) + pg_cron 또는 Vercel Cron Jobs
- **배포**: Vercel
- **상태 관리**: React Server Components + 필요 시 클라이언트 상태 (useState/useReducer)

### 5.2 시스템 아키텍처

```
[사용자 브라우저 (모바일)]
    |
    v
[Next.js App (Vercel)]
    |-- /admin/*      --> Admin 대시보드 (SSR, 인증 필요)
    |-- /event/*      --> User 참여 페이지 (SSR + CSR 혼합)
    |-- /api/*        --> API Routes (Server Actions 또는 Route Handlers)
    |
    v
[Supabase]
    |-- PostgreSQL    --> 데이터 저장
    |-- Auth          --> 관리자 인증
    |-- Edge Functions --> 배치 추첨 로직
    |-- RLS           --> 행 수준 보안
    |-- Realtime      --> (P1) 결과 실시간 갱신
```

### 5.3 외부 연동

| 서비스명 | 용도 | API 방식 | 비고 |
|---------|------|---------|------|
| Supabase Auth | 관리자 인증 | REST (supabase-js) | 이메일/비밀번호 |
| Supabase Database | 데이터 저장 | REST (supabase-js) | PostgreSQL + RLS |
| Supabase Edge Functions | 배치 추첨 | HTTP Trigger + Cron | Deno 런타임 |
| 광고 SDK | 광고 시청 기회 | (P2) 추후 연동 | MVP에서는 Mock 처리 |

### 5.4 데이터 모델 (주요 엔티티)

```
-- 관리자 계정 (Supabase Auth 내장 테이블 활용)
-- auth.users 테이블 사용, 별도 테이블 불필요

-- 이벤트 프로젝트
projects {
  id: uuid (PK, default gen_random_uuid())
  name: text NOT NULL                          // 프로젝트명
  status: text NOT NULL DEFAULT 'active'       // 'active' | 'paused' | 'ended'

  -- 규칙 설정 (생성 후 변경 불가 - DB 트리거로 보호)
  number_min: integer NOT NULL                 // 숫자 범위 시작 (예: 1)
  number_max: integer NOT NULL                 // 숫자 범위 끝 (예: 45)
  pick_count: integer NOT NULL                 // 세트 구성 개수 (예: 6)

  -- 운영 주기
  draw_interval_minutes: integer NOT NULL      // 추첨 주기 (분 단위, 60~10080)
  draw_start_at: timestamptz NOT NULL          // 첫 추첨 시작 시점

  -- 참여 기회 정책
  free_chances_per_period: integer NOT NULL     // 무료 기회 횟수
  free_chance_period_minutes: integer NOT NULL  // 무료 기회 충전 주기 (분)
  ad_chances_per_period: integer NOT NULL       // 광고 기회 횟수
  ad_chance_period_minutes: integer NOT NULL    // 광고 기회 충전 주기 (분)

  admin_id: uuid NOT NULL REFERENCES auth.users(id) // 생성 관리자
  created_at: timestamptz DEFAULT now()
}

-- 리워드 정책 (프로젝트별 맞힌 개수 -> 당첨금 매핑)
reward_policies {
  id: uuid (PK, default gen_random_uuid())
  project_id: uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
  match_count: integer NOT NULL                // 맞힌 숫자 개수 (예: 6, 5, 4...)
  prize_amount: integer NOT NULL               // 당첨금 (원 단위)
  prize_label: text                            // 등수 라벨 (예: '1등', '2등')
  created_at: timestamptz DEFAULT now()

  UNIQUE(project_id, match_count)
}

-- 추첨 회차
draw_rounds {
  id: uuid (PK, default gen_random_uuid())
  project_id: uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
  round_number: integer NOT NULL               // 회차 번호 (1, 2, 3...)
  scheduled_at: timestamptz NOT NULL           // 예정 추첨 시각
  drawn_at: timestamptz                        // 실제 추첨 시각 (null이면 미추첨)
  winning_numbers: integer[] DEFAULT NULL      // 당첨 번호 배열 (추첨 후 기록)
  status: text NOT NULL DEFAULT 'pending'      // 'pending' | 'drawn'
  created_at: timestamptz DEFAULT now()

  UNIQUE(project_id, round_number)
}

-- 이벤트 참여자
participants {
  id: uuid (PK, default gen_random_uuid())
  project_id: uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
  user_id: text NOT NULL                       // 외부 시스템 userid
  display_name: text NOT NULL                  // 사용자 표시명
  created_at: timestamptz DEFAULT now()

  UNIQUE(project_id, user_id)
}

-- 참여 기록 (사용자가 뽑은 번호)
entries {
  id: uuid (PK, default gen_random_uuid())
  project_id: uuid NOT NULL REFERENCES projects(id)
  round_id: uuid NOT NULL REFERENCES draw_rounds(id)
  participant_id: uuid NOT NULL REFERENCES participants(id)
  selected_numbers: integer[] NOT NULL         // 선택한 번호 배열
  entry_type: text NOT NULL DEFAULT 'free'     // 'free' | 'ad'
  created_at: timestamptz DEFAULT now()
}

-- 당첨 결과
winning_results {
  id: uuid (PK, default gen_random_uuid())
  entry_id: uuid NOT NULL REFERENCES entries(id) UNIQUE
  round_id: uuid NOT NULL REFERENCES draw_rounds(id)
  participant_id: uuid NOT NULL REFERENCES participants(id)
  match_count: integer NOT NULL                // 맞힌 개수
  prize_amount: integer NOT NULL               // 당첨금
  reward_status: text NOT NULL DEFAULT 'unclaimed' // 'unclaimed' | 'claimed' | 'processing' | 'paid'
  claimed_at: timestamptz                      // 보상 정보 제출 시각
  paid_at: timestamptz                         // 지급 완료 시각
  created_at: timestamptz DEFAULT now()
}

-- 보상 수령 정보 (암호화 저장)
reward_claims {
  id: uuid (PK, default gen_random_uuid())
  winning_result_id: uuid NOT NULL REFERENCES winning_results(id) UNIQUE
  recipient_name: text NOT NULL                // 수령인 이름 (암호화)
  contact: text NOT NULL                       // 연락처 (암호화)
  bank_name: text NOT NULL                     // 은행명 (암호화)
  account_number: text NOT NULL                // 계좌번호 (암호화)
  created_at: timestamptz DEFAULT now()
}

-- 참여 기회 추적
chance_usage {
  id: uuid (PK, default gen_random_uuid())
  participant_id: uuid NOT NULL REFERENCES participants(id)
  project_id: uuid NOT NULL REFERENCES projects(id)
  chance_type: text NOT NULL                   // 'free' | 'ad'
  used_at: timestamptz DEFAULT now()
}
```

**주요 인덱스**:
- `entries(round_id, participant_id)` -- 회차별 참여자 조회
- `entries(participant_id, created_at DESC)` -- 사용자 이력 조회
- `draw_rounds(project_id, status, scheduled_at)` -- 배치 추첨 대상 조회
- `winning_results(round_id)` -- 회차별 당첨 결과 조회
- `chance_usage(participant_id, project_id, chance_type, used_at)` -- 기회 소진 계산

**DB 트리거 (정책 변경 방지)**:
- `projects` 테이블의 `number_min`, `number_max`, `pick_count`, `draw_interval_minutes`, `draw_start_at`, `free_chances_per_period`, `free_chance_period_minutes`, `ad_chances_per_period`, `ad_chance_period_minutes` 컬럼에 대해 UPDATE 시 에러를 발생시키는 트리거 적용
- `reward_policies` 테이블의 INSERT/UPDATE/DELETE에 대해, 해당 프로젝트에 이미 `draw_rounds`가 1개 이상 존재하면 에러를 발생시키는 트리거 적용

---

## 6. API 엔드포인트 설계 개요

### 6.1 Admin API (`/api/admin/*`)
모든 Admin API는 Supabase Auth JWT 검증 필수.

| 메서드 | 경로 | 설명 | 주요 요청 파라미터 |
|-------|------|------|------------------|
| POST | `/api/admin/projects` | 프로젝트 생성 | name, number_min, number_max, pick_count, draw_interval_minutes, draw_start_at, free/ad 기회 설정, reward_policies[] |
| GET | `/api/admin/projects` | 프로젝트 목록 조회 | ?status=active\|paused\|ended |
| GET | `/api/admin/projects/{id}` | 프로젝트 상세 조회 | - |
| PATCH | `/api/admin/projects/{id}/status` | 상태 변경 (pause/end) | status: 'paused' \| 'ended' |
| GET | `/api/admin/projects/{id}/rounds` | 회차 목록 조회 | ?page, ?limit |
| GET | `/api/admin/projects/{id}/rounds/{roundId}` | 회차 상세 (당첨 번호, 당첨자) | - |
| GET | `/api/admin/projects/{id}/stats` | 프로젝트 통계 | - |
| GET | `/api/admin/projects/{id}/participants` | 참여자 목록 | ?page, ?limit, ?search |
| GET | `/api/admin/rewards` | 보상 대기 목록 | ?status, ?project_id |
| PATCH | `/api/admin/rewards/{id}/status` | 보상 지급 상태 변경 | status: 'processing' \| 'paid' |

### 6.2 User API (`/api/event/*`)
User API는 userid + projectId 조합으로 접근 권한 확인.

| 메서드 | 경로 | 설명 | 주요 요청 파라미터 |
|-------|------|------|------------------|
| GET | `/api/event/{projectId}` | 프로젝트 정보 (규칙, 현재 회차) | ?userid |
| POST | `/api/event/{projectId}/join` | 참여자 가입 | userid, display_name |
| GET | `/api/event/{projectId}/chances` | 남은 참여 기회 조회 | ?userid |
| POST | `/api/event/{projectId}/entries` | 번호 제출 | userid, selected_numbers[], entry_type |
| GET | `/api/event/{projectId}/entries` | 참여 이력 조회 | ?userid, ?page, ?limit |
| GET | `/api/event/{projectId}/rounds/latest` | 최신 추첨 결과 | ?userid (본인 당첨 여부 포함) |
| GET | `/api/event/{projectId}/rounds/{roundId}` | 특정 회차 결과 | ?userid |
| POST | `/api/event/{projectId}/rewards/{resultId}/claim` | 보상 수령 정보 제출 | recipient_name, contact, bank_name, account_number |
| GET | `/api/event/{projectId}/rewards` | 본인 당첨/보상 현황 | ?userid |

### 6.3 Batch API (내부 전용)

| 메서드 | 경로 | 설명 | 비고 |
|-------|------|------|------|
| POST | `/api/batch/draw` | 추첨 실행 | Cron에 의해 호출, API Key 인증 |

---

## 7. UX/UI 요구사항

### 7.1 주요 화면 목록

**Admin 페이지**

| 화면명 | URL 경로 | 설명 | 주요 컴포넌트 |
|-------|---------|------|-------------|
| 로그인 | `/admin/login` | 관리자 로그인 | Input, Button |
| 대시보드 | `/admin` | 프로젝트 목록 + 요약 통계 | Card, Table, Badge |
| 프로젝트 생성 | `/admin/projects/new` | 단계별 폼 위저드 | Form, Input, Select, Stepper |
| 프로젝트 상세 | `/admin/projects/{id}` | 설정 확인 + 통계 + 회차 목록 | Tabs, Card, Chart |
| 회차 상세 | `/admin/projects/{id}/rounds/{roundId}` | 당첨 번호 + 당첨자 목록 | Table, Badge |
| 보상 관리 | `/admin/rewards` | 보상 대기/처리 목록 | Table, Badge, Dialog |

**User 페이지**

| 화면명 | URL 경로 | 설명 | 주요 컴포넌트 |
|-------|---------|------|-------------|
| 가입 | `/event/{projectId}?userid=xxx` (첫 진입) | 사용자명 입력 | Input, Button |
| 이벤트 메인 | `/event/{projectId}?userid=xxx` | 현재 회차 정보, 참여 CTA, 최신 결과 | Card, Button, Countdown |
| 번호 선택 | `/event/{projectId}/play?userid=xxx` | 번호 그리드 + 선택 UI | NumberGrid (커스텀), Button, Sheet |
| 참여 이력 | `/event/{projectId}/history?userid=xxx` | 회차별 참여 기록 | Accordion, Badge |
| 결과 확인 | `/event/{projectId}/results?userid=xxx` | 회차별 당첨 결과 | Card, NumberBall (커스텀) |
| 보상 수령 | `/event/{projectId}/claim/{resultId}?userid=xxx` | 보상 정보 입력 폼 | Form, Input, Button |

### 7.2 디자인 원칙
- **모바일 퍼스트**: 모든 화면은 모바일(360px~)에서 먼저 설계하고 데스크탑으로 확장한다
- **원핸드 UX**: 번호 선택 등 핵심 인터랙션은 한 손(엄지) 조작에 최적화한다
- **즉각적 피드백**: 번호 선택, 제출, 결과 확인 등 모든 인터랙션에 시각적/촉각적 피드백을 제공한다
- **정보 계층**: 가장 중요한 정보(남은 기회, 다음 추첨 시간, 당첨 여부)가 화면 상단에 위치한다
- **기존 디자인 시스템 준수**: shadcn/ui 컴포넌트를 기반으로 하되, 로또 번호 그리드와 번호 공(ball) 컴포넌트는 프로젝트 전용으로 제작한다

### 7.3 반응형 요구사항
- **모바일 (< 768px)**: 기본 타겟. 모든 기능 완전 지원. 번호 그리드는 5열 레이아웃
- **태블릿 (768px ~ 1024px)**: 번호 그리드 7열 확장. Admin 사이드바 표시
- **데스크탑 (> 1024px)**: Admin 대시보드 최적화. User 페이지는 max-width 480px 중앙 정렬 (모바일 체험 유지)

### 7.4 커스텀 컴포넌트 설계

#### NumberGrid (번호 선택 그리드)
- 프로젝트의 `number_min` ~ `number_max` 범위의 숫자를 그리드로 표시
- 선택된 번호는 primary 색상으로 강조 + 크기 확대 애니메이션
- 선택 완료 시(pick_count 도달) 나머지 번호는 muted 처리

#### NumberBall (번호 공)
- 원형 컴포넌트에 숫자 표시
- 당첨 번호 일치 시 색상 변경(success 컬러) + 바운스 애니메이션
- 크기 변형: sm(24px), md(36px), lg(48px)

#### Countdown (카운트다운)
- 다음 추첨까지 남은 시간을 시:분:초로 표시
- 1분 이하일 때 경고 색상으로 변경
- 0초 도달 시 결과 자동 갱신 트리거

---

## 8. 마일스톤 및 일정

| 마일스톤 | 포함 기능 | 완료 기준 |
|---------|----------|----------|
| M1: 기반 구축 | DB 스키마, Supabase 설정, 인증, 프로젝트 생성 API | Admin 로그인 후 프로젝트 생성/조회 동작 |
| M2: 사용자 참여 | 사용자 가입, 번호 선택 UI, 번호 제출 API | 사용자가 링크로 진입하여 번호를 뽑고 제출 완료 |
| M3: 추첨 엔진 | 배치 추첨, 당첨 판정, 결과 표시 | 설정 주기에 따라 자동 추첨이 실행되고 사용자가 결과 확인 |
| M4: 보상 및 통계 | 보상 수령 플로우, 관리자 통계, 보상 관리 | 당첨자가 보상 정보 제출, 관리자가 지급 처리 |
| M5: 폴리싱 | 실시간 카운트다운, 알림, UX 개선, 성능 최적화 | 모바일 FCP 2초 이하, 전체 플로우 E2E 검증 완료 |

---

## 9. 리스크 및 대응 방안

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|-------|-----------|-------|----------|
| 배치 추첨 지연/누락 | 중간 | 높음 | 추첨 실행 로그 기록 + 모니터링 알림 + 재시도 로직 구현 |
| userid 위변조로 타인 계정 참여 | 중간 | 높음 | userid를 UUID 형태로 사용 + 서버 사이드에서 userid-participant 매핑 검증 |
| 대량 참여로 인한 DB 성능 저하 | 중간 | 중간 | 적절한 인덱스 설계 + entries 테이블 파티셔닝 (프로젝트별) 고려 |
| 동시 참여 시 기회 차감 Race Condition | 높음 | 중간 | DB 트랜잭션 + SELECT FOR UPDATE 또는 Advisory Lock 적용 |
| 프로젝트 정책 변경 시도 | 낮음 | 높음 | DB 트리거로 차단 + API에 수정 엔드포인트 미구현 |
| 모바일 브라우저 호환성 이슈 | 중간 | 중간 | 주요 브라우저(Chrome, Safari, Samsung Internet) 테스트 체크리스트 |
| 광고 SDK 연동 지연 | 높음 | 낮음 | MVP에서는 Mock 광고(버튼 클릭 시 3초 대기)로 대체 |

---

## 10. 미결 사항 (Open Questions)

- [ ] userid는 어떤 외부 시스템에서 발급되는가? UUID 형태를 강제할 수 있는가?
- [ ] 광고 SDK는 어떤 플랫폼을 사용할 예정인가? (Google AdMob, Unity Ads 등)
- [ ] 당첨금의 실제 지급 프로세스는 어떻게 되는가? (계좌이체 자동화 vs 수동 처리)
- [ ] 하나의 userid가 여러 프로젝트에 참여할 수 있는가? (현재 설계: 가능)
- [ ] 프로젝트 종료 후 데이터 보존 기간 정책이 있는가?
- [ ] 보상 정보의 개인정보 보관 기간 및 삭제 정책은?
- [ ] 동일 회차에 같은 사용자가 여러 세트를 뽑는 것이 가능한가? (현재 설계: 기회 수만큼 가능)
- [ ] 관리자 계정은 단일 계정인가, 다수 관리자를 지원해야 하는가?
- [ ] 당첨금 지급 시 세금(제세공과금) 처리 관련 요구사항이 있는가?

---

## 11. AI 개발 시 주의사항

> 이 섹션은 AI(LLM)를 활용하여 이 PRD를 기반으로 개발할 경우 발생할 수 있는 오류나 오해를 방지하기 위한 가이드이다.

### 11.1 모호한 요구사항으로 인한 오해 가능성

- **"userid 파라미터로 식별"**: AI가 이것을 Supabase Auth 기반 사용자 인증으로 오해할 수 있다. userid는 URL 쿼리 파라미터로 전달되는 외부 식별자이며, Supabase Auth와는 무관하다. 사용자 측에는 로그인/세션이 없다.
- **"무료 참여 기회 충전"**: AI가 이를 크레딧 시스템이나 별도의 결제 모듈로 과설계할 수 있다. 기회 충전은 단순히 시간 기반 계산이다 (현재 시각 - 마지막 사용 시각을 기회 충전 주기로 나누어 계산).
- **"광고 시청 기회"**: MVP에서는 실제 광고 SDK를 연동하지 않는다. 버튼 클릭 후 3초 대기하는 Mock 구현으로 충분하다.
- **"생성 후 정책 변경 불가"**: API에 수정 엔드포인트를 구현하지 않는 것만으로는 부족하다. DB 트리거 수준에서 보호해야 한다.
- **"보상 정보 암호화 저장"**: Supabase의 pgcrypto 확장을 사용한 컬럼 레벨 암호화를 의미한다. 애플리케이션 레벨 암호화가 아니다.
- **"운영 주기 최소 1시간 ~ 최대 1주"**: `draw_interval_minutes` 값의 유효 범위는 60~10080이다. 이 범위 밖의 입력은 서버에서 거부해야 한다.

### 11.2 과도한 기능 추가 (Over-engineering) 위험

- **하지 말아야 할 것**: 실시간 WebSocket 기반 추첨 애니메이션, 소셜 로그인, 다국어 지원, 결제 시스템, 복잡한 역할 기반 권한 관리 (RBAC)
- **해야 할 것**: 요구사항에 명시된 기능만 정확히 구현. 의심스러우면 사용자에게 확인
- **팁**: P0(Must Have) 기능만 먼저 구현하고, P1/P2는 명시적 요청이 있을 때만 추가

### 11.3 기술 스택 임의 변경 위험

- **금지**: Prisma, Drizzle 등 별도 ORM 사용 (Supabase JS Client 사용). Redux, Zustand 등 상태관리 라이브러리 임의 추가. Socket.io 임의 추가. 별도 인증 라이브러리(NextAuth 등) 사용
- **필수 확인**: 새로운 npm 패키지 추가 시 반드시 승인 필요
- **고정 스택 목록**: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, react-hook-form, zod, sonner, lucide-react, @supabase/supabase-js

### 11.4 보안 요구사항 누락 위험

- **인증/인가**: 관리자 = Supabase Auth (JWT). 사용자 = userid 파라미터 (인증 없음, 식별만)
- **입력 검증**: 모든 API 요청 본문에 Zod 스키마 검증 적용 (서버 사이드 필수)
- **API 보안**: 관리자 API에 JWT 검증 미들웨어 적용. 사용자 API에 Rate Limiting 적용
- **하드코딩 금지**: Supabase URL, API Key, 암호화 키 등을 코드에 직접 포함하지 않는다. 환경 변수(.env.local)를 사용한다

### 11.5 데이터 모델 임의 변경 위험

- **스키마 고정**: 섹션 5.4의 데이터 모델을 반드시 준수한다
- **마이그레이션**: 스키마 변경이 필요한 경우 Supabase SQL Migration 파일로 관리한다
- **트리거 필수**: projects 테이블의 정책 필드 변경 방지 트리거를 반드시 구현한다
- **배열 타입**: PostgreSQL의 integer[] 타입을 사용한다. JSON 배열로 대체하지 않는다

### 11.6 UI/UX 임의 해석 위험

- **디자인 시스템**: shadcn/ui 컴포넌트를 우선 사용한다. 커스텀 컴포넌트는 NumberGrid, NumberBall, Countdown 3종만 제작한다
- **새 컴포넌트**: 위 3종 외의 커스텀 컴포넌트 제작 전 반드시 확인을 요청한다
- **스타일링**: `app/globals.css`의 CSS 변수와 Tailwind 유틸리티 클래스만 사용한다. 인라인 스타일이나 별도 CSS 파일을 추가하지 않는다
- **User 페이지 데스크탑**: 데스크탑에서도 max-width 480px로 중앙 정렬하여 모바일 경험을 유지한다

### 11.7 에러 처리 및 엣지 케이스 누락 위험

- **필수 처리 케이스**:
  - userid 파라미터 누락 시: 안내 메시지 표시, 참여 차단
  - 비활성화된 프로젝트 접근 시: "이벤트가 일시 중단되었습니다" 표시
  - 종료된 프로젝트 접근 시: "이벤트가 종료되었습니다" 표시 + 결과 조회만 허용
  - 참여 기회 소진 시: 다음 충전 시간 카운트다운 표시
  - 추첨 전 번호 제출 시: 정상 처리
  - 추첨 중(배치 실행 중) 번호 제출 시: 다음 회차로 자동 귀속
  - 네트워크 오류: 재시도 버튼과 함께 오류 메시지 표시
  - 빈 데이터: "아직 참여 기록이 없습니다" 등 빈 상태 표시
- **Race Condition 방지**: 기회 차감과 번호 제출을 하나의 DB 트랜잭션으로 처리

### 11.8 테스트 누락 위험

- **단위 테스트**: 기회 충전 계산 로직, 당첨 판정 로직, 숫자 검증 로직
- **통합 테스트**: 프로젝트 생성 API, 번호 제출 API, 배치 추첨 API
- **팁**: 각 기능 구현 후 해당 기능의 테스트 코드 작성을 명시적으로 요청할 것

### 11.9 PRD와 실제 구현 간 불일치 방지 체크리스트

- [ ] PRD의 인수 조건(Acceptance Criteria)을 모두 충족하는가?
- [ ] 명시된 기술 스택만 사용했는가? (새 패키지 추가 시 승인받았는가?)
- [ ] 관리자 인증(Supabase Auth)과 사용자 식별(userid 파라미터)이 정확히 분리되었는가?
- [ ] 프로젝트 정책 변경 방지 트리거가 DB에 구현되었는가?
- [ ] 보상 정보가 암호화되어 저장되는가?
- [ ] 데이터 모델이 PRD 섹션 5.4와 일치하는가?
- [ ] 모바일 퍼스트 레이아웃이 적용되었는가?
- [ ] 에러 처리가 모든 케이스에 적용되었는가?
- [ ] API Rate Limiting이 적용되었는가?

### 11.10 AI 개발 지시 시 권장 프롬프트 패턴

```
다음 PRD를 기반으로 [기능명]을 구현해주세요.

[PRD 내용 또는 lotto.md 파일 참조]

구현 시 반드시 준수해야 할 사항:
1. 명시된 기술 스택(Next.js 16, TypeScript, shadcn/ui, Supabase)만 사용
2. 새로운 라이브러리 추가 전 반드시 확인 요청
3. 데이터 모델은 PRD 섹션 5.4 그대로 사용 (integer[] 타입 유지)
4. 사용자 인증은 없음 - userid 쿼리 파라미터로만 식별
5. 관리자 인증은 Supabase Auth만 사용
6. 모든 API 입력에 Zod 서버 사이드 검증 포함
7. 에러 처리 및 로딩 상태 필수 포함
8. 모바일 퍼스트 레이아웃 (User 페이지는 데스크탑에서도 480px 중앙정렬)
9. 구현 전 접근 방식을 먼저 설명하고 확인 후 진행
```

---

## 12. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [shadcn/ui 컴포넌트 문서](https://ui.shadcn.com)
- [Supabase Edge Functions 가이드](https://supabase.com/docs/guides/functions)
- [pg_cron 문서](https://supabase.com/docs/guides/database/extensions/pg_cron)
