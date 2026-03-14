-- 001_initial_schema.sql
-- 가변 로또 이벤트 플랫폼 초기 스키마
-- PRD 섹션 5.4 데이터 모델 기준

-- pgcrypto 확장 활성화 (보상 정보 암호화용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── projects ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'paused', 'ended')),

  -- 규칙 설정 (생성 후 변경 불가 — 트리거로 보호)
  number_min                INTEGER NOT NULL,
  number_max                INTEGER NOT NULL,
  pick_count                INTEGER NOT NULL,

  -- 운영 주기 (60분~10080분)
  draw_interval_minutes     INTEGER NOT NULL
                              CHECK (draw_interval_minutes BETWEEN 60 AND 10080),
  draw_start_at             TIMESTAMPTZ NOT NULL,

  -- 참여 기회 정책
  free_chances_per_period   INTEGER NOT NULL DEFAULT 1,
  free_chance_period_minutes INTEGER NOT NULL DEFAULT 60,
  ad_chances_per_period     INTEGER NOT NULL DEFAULT 2,
  ad_chance_period_minutes  INTEGER NOT NULL DEFAULT 60,

  admin_id                  UUID NOT NULL REFERENCES auth.users(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_number_range CHECK (number_max > number_min),
  CONSTRAINT valid_pick_count   CHECK (pick_count <= (number_max - number_min + 1))
);

-- ─── reward_policies ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  match_count INTEGER NOT NULL,
  prize_amount INTEGER NOT NULL,
  prize_label TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (project_id, match_count)
);

-- ─── draw_rounds ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draw_rounds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  round_number   INTEGER NOT NULL,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  drawn_at       TIMESTAMPTZ,
  winning_numbers INTEGER[],
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'drawn')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (project_id, round_number)
);

-- ─── participants ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (project_id, user_id)
);

-- ─── entries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id),
  round_id         UUID NOT NULL REFERENCES draw_rounds(id),
  participant_id   UUID NOT NULL REFERENCES participants(id),
  selected_numbers INTEGER[] NOT NULL,
  entry_type       TEXT NOT NULL DEFAULT 'free'
                     CHECK (entry_type IN ('free', 'ad')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── winning_results ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS winning_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id        UUID NOT NULL REFERENCES entries(id) UNIQUE,
  round_id        UUID NOT NULL REFERENCES draw_rounds(id),
  participant_id  UUID NOT NULL REFERENCES participants(id),
  match_count     INTEGER NOT NULL,
  prize_amount    INTEGER NOT NULL,
  reward_status   TEXT NOT NULL DEFAULT 'unclaimed'
                    CHECK (reward_status IN ('unclaimed', 'claimed', 'processing', 'paid')),
  claimed_at      TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── reward_claims (암호화 저장) ───────────────────────────
CREATE TABLE IF NOT EXISTS reward_claims (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winning_result_id UUID NOT NULL REFERENCES winning_results(id) UNIQUE,
  -- pgp_sym_encrypt(value, key) 로 암호화 저장
  recipient_name    TEXT NOT NULL,
  contact           TEXT NOT NULL,
  bank_name         TEXT NOT NULL,
  account_number    TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── chance_usage ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chance_usage (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  project_id     UUID NOT NULL REFERENCES projects(id),
  chance_type    TEXT NOT NULL CHECK (chance_type IN ('free', 'ad')),
  used_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 인덱스 (PRD 5.4 주요 인덱스) ────────────────────────
CREATE INDEX IF NOT EXISTS idx_entries_round_participant
  ON entries (round_id, participant_id);

CREATE INDEX IF NOT EXISTS idx_entries_participant_created
  ON entries (participant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_draw_rounds_project_status_scheduled
  ON draw_rounds (project_id, status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_winning_results_round
  ON winning_results (round_id);

CREATE INDEX IF NOT EXISTS idx_chance_usage_participant_project_type_used
  ON chance_usage (participant_id, project_id, chance_type, used_at);

CREATE INDEX IF NOT EXISTS idx_participants_project_user
  ON participants (project_id, user_id);

-- ─── 트리거: projects 정책 필드 변경 방지 ─────────────────
CREATE OR REPLACE FUNCTION prevent_project_policy_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    NEW.number_min             != OLD.number_min OR
    NEW.number_max             != OLD.number_max OR
    NEW.pick_count             != OLD.pick_count OR
    NEW.draw_interval_minutes  != OLD.draw_interval_minutes OR
    NEW.draw_start_at          != OLD.draw_start_at OR
    NEW.free_chances_per_period  != OLD.free_chances_per_period OR
    NEW.free_chance_period_minutes != OLD.free_chance_period_minutes OR
    NEW.ad_chances_per_period  != OLD.ad_chances_per_period OR
    NEW.ad_chance_period_minutes != OLD.ad_chance_period_minutes
  ) THEN
    RAISE EXCEPTION '프로젝트 생성 후 정책 필드는 변경할 수 없습니다.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_project_policy_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION prevent_project_policy_update();

-- ─── 트리거: reward_policies 추첨 후 변경 방지 ────────────
CREATE OR REPLACE FUNCTION prevent_reward_policy_change_after_draw()
RETURNS TRIGGER AS $$
DECLARE
  round_count INTEGER;
  pid UUID;
BEGIN
  pid := CASE TG_OP WHEN 'DELETE' THEN OLD.project_id ELSE NEW.project_id END;
  SELECT COUNT(*) INTO round_count FROM draw_rounds WHERE project_id = pid;
  IF round_count > 0 THEN
    RAISE EXCEPTION '추첨이 시작된 프로젝트의 리워드 정책은 변경할 수 없습니다.';
  END IF;
  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_reward_policy_change
  BEFORE INSERT OR UPDATE OR DELETE ON reward_policies
  FOR EACH ROW
  EXECUTE FUNCTION prevent_reward_policy_change_after_draw();
