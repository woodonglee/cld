-- 002_rls_policies.sql
-- Row Level Security 정책 설정

-- RLS 활성화
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_policies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_rounds      ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chance_usage     ENABLE ROW LEVEL SECURITY;

-- ─── projects ─────────────────────────────────────────────
-- 모든 사용자: 활성 프로젝트 조회 가능
CREATE POLICY "projects_select_all"
  ON projects FOR SELECT
  USING (true);

-- 관리자: 프로젝트 생성
CREATE POLICY "projects_insert_admin"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- 관리자: 본인 프로젝트 상태 변경 (정책 필드는 트리거로 차단)
CREATE POLICY "projects_update_admin"
  ON projects FOR UPDATE
  USING (auth.uid() = admin_id);

-- ─── reward_policies ──────────────────────────────────────
CREATE POLICY "reward_policies_select_all"
  ON reward_policies FOR SELECT
  USING (true);

CREATE POLICY "reward_policies_insert_admin"
  ON reward_policies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND admin_id = auth.uid()
    )
  );

-- ─── draw_rounds ──────────────────────────────────────────
CREATE POLICY "draw_rounds_select_all"
  ON draw_rounds FOR SELECT
  USING (true);

-- 서비스 롤(admin client)만 INSERT/UPDATE 가능 (배치 추첨)
CREATE POLICY "draw_rounds_service_only"
  ON draw_rounds FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── participants ─────────────────────────────────────────
-- 본인 참여자 정보 조회
CREATE POLICY "participants_select_own"
  ON participants FOR SELECT
  USING (true);

-- 가입 시 INSERT (user_id는 앱에서 관리)
CREATE POLICY "participants_insert_anon"
  ON participants FOR INSERT
  WITH CHECK (true);

-- ─── entries ──────────────────────────────────────────────
CREATE POLICY "entries_select_all"
  ON entries FOR SELECT
  USING (true);

CREATE POLICY "entries_insert_anon"
  ON entries FOR INSERT
  WITH CHECK (true);

-- ─── winning_results ──────────────────────────────────────
CREATE POLICY "winning_results_select_all"
  ON winning_results FOR SELECT
  USING (true);

CREATE POLICY "winning_results_service_only"
  ON winning_results FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "winning_results_update_claimed"
  ON winning_results FOR UPDATE
  USING (true);

-- ─── reward_claims ────────────────────────────────────────
-- 관리자와 서비스 롤만 조회 가능
CREATE POLICY "reward_claims_select_admin"
  ON reward_claims FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM winning_results wr
      JOIN entries e ON e.id = wr.entry_id
      JOIN projects p ON p.id = e.project_id
      WHERE wr.id = winning_result_id AND p.admin_id = auth.uid()
    )
  );

CREATE POLICY "reward_claims_insert_anon"
  ON reward_claims FOR INSERT
  WITH CHECK (true);

-- ─── chance_usage ─────────────────────────────────────────
CREATE POLICY "chance_usage_select_all"
  ON chance_usage FOR SELECT
  USING (true);

CREATE POLICY "chance_usage_insert_anon"
  ON chance_usage FOR INSERT
  WITH CHECK (true);
