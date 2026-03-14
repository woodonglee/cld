-- 003_schema_fixes.sql
-- API 코드와 스키마 불일치 수정

-- ─── 1. draw_rounds.status: 'drawn' → 'completed' ─────────
-- CHECK 제약 재생성을 위해 기존 제약 삭제 후 재추가
ALTER TABLE draw_rounds DROP CONSTRAINT IF EXISTS draw_rounds_status_check;
ALTER TABLE draw_rounds ADD CONSTRAINT draw_rounds_status_check
  CHECK (status IN ('pending', 'completed'));

-- 기존 데이터 마이그레이션
UPDATE draw_rounds SET status = 'completed' WHERE status = 'drawn';

-- ─── 2. entries: submitted_at 컬럼 추가 ───────────────────
ALTER TABLE entries ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- 기존 데이터 created_at 값으로 채우기
UPDATE entries SET submitted_at = created_at WHERE submitted_at = now() AND created_at < now();

-- ─── 3. winning_results: 컬럼 추가 및 이름 변경 ───────────

-- project_id 추가 (배치 추첨/통계 조회에 필요)
ALTER TABLE winning_results ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- 기존 데이터에 project_id 채우기 (round를 통해)
UPDATE winning_results wr
SET project_id = dr.project_id
FROM draw_rounds dr
WHERE wr.round_id = dr.id
  AND wr.project_id IS NULL;

-- project_id NOT NULL 제약 추가 (데이터 마이그레이션 후)
ALTER TABLE winning_results ALTER COLUMN project_id SET NOT NULL;

-- prize_label 추가
ALTER TABLE winning_results ADD COLUMN IF NOT EXISTS prize_label TEXT;

-- claim_status 추가 (reward_status 대체)
ALTER TABLE winning_results ADD COLUMN IF NOT EXISTS claim_status TEXT
  CHECK (claim_status IN ('unclaimed', 'claimed', 'processing', 'paid'))
  DEFAULT 'unclaimed';

-- 기존 reward_status 데이터 마이그레이션
UPDATE winning_results SET claim_status = reward_status WHERE claim_status = 'unclaimed';

-- claim_info_encrypted 추가 (보상 청구 정보 암호화 저장)
ALTER TABLE winning_results ADD COLUMN IF NOT EXISTS claim_info_encrypted TEXT;

-- ─── 4. winning_results 인덱스 추가 ──────────────────────
CREATE INDEX IF NOT EXISTS idx_winning_results_project
  ON winning_results (project_id);

CREATE INDEX IF NOT EXISTS idx_winning_results_participant
  ON winning_results (participant_id);

CREATE INDEX IF NOT EXISTS idx_winning_results_claim_status
  ON winning_results (project_id, claim_status);

-- ─── 5. entries 인덱스 추가 ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_entries_project_participant
  ON entries (project_id, participant_id);

-- ─── 6. draw_rounds 인덱스 추가 ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_draw_rounds_project_pending
  ON draw_rounds (project_id, scheduled_at)
  WHERE status = 'pending';
