-- 추첨 주기 최솟값을 1일(1440분)으로 변경
-- 기존 60~1439분 데이터가 있다면 실행 전 UPDATE 선행 필요
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_draw_interval_minutes_check;
ALTER TABLE projects ADD CONSTRAINT projects_draw_interval_minutes_check
  CHECK (draw_interval_minutes BETWEEN 1440 AND 10080);
