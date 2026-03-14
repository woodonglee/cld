// 더미 데이터 팩토리 — Phase 2 UI 개발 시 활용

import type {
  Project,
  RewardPolicy,
  DrawRound,
  Participant,
  Entry,
  WinningResult,
} from "@/types";

// UUID 형태 더미 ID 생성
const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

// 현재 시각 기준 ISO 문자열
const now = () => new Date().toISOString();
const future = (minutes: number) =>
  new Date(Date.now() + minutes * 60 * 1000).toISOString();

// ─── Project ──────────────────────────────────────────────

export function createDummyProject(
  overrides: Partial<Project> = {}
): Project {
  return {
    id: uid("proj"),
    name: "주간 로또 이벤트",
    status: "active",
    number_min: 1,
    number_max: 45,
    pick_count: 6,
    draw_interval_minutes: 10080, // 1주
    draw_start_at: future(60),
    free_chances_per_period: 1,
    free_chance_period_minutes: 60,
    ad_chances_per_period: 2,
    ad_chance_period_minutes: 60,
    admin_id: uid("admin"),
    created_at: now(),
    ...overrides,
  };
}

// ─── RewardPolicy ─────────────────────────────────────────

export function createDummyRewardPolicies(
  projectId: string
): RewardPolicy[] {
  return [
    { id: uid("rp"), project_id: projectId, match_count: 6, prize_amount: 1000000, prize_label: "1등", created_at: now() },
    { id: uid("rp"), project_id: projectId, match_count: 5, prize_amount: 100000, prize_label: "2등", created_at: now() },
    { id: uid("rp"), project_id: projectId, match_count: 4, prize_amount: 10000, prize_label: "3등", created_at: now() },
    { id: uid("rp"), project_id: projectId, match_count: 3, prize_amount: 1000, prize_label: "4등", created_at: now() },
  ];
}

// ─── DrawRound ────────────────────────────────────────────

export function createDummyRound(
  projectId: string,
  overrides: Partial<DrawRound> = {}
): DrawRound {
  return {
    id: uid("round"),
    project_id: projectId,
    round_number: 1,
    scheduled_at: future(60),
    drawn_at: null,
    winning_numbers: null,
    status: "pending",
    created_at: now(),
    ...overrides,
  };
}

// 추첨 완료된 회차 더미
export function createDummyDrawnRound(
  projectId: string,
  roundNumber: number = 1
): DrawRound {
  return createDummyRound(projectId, {
    round_number: roundNumber,
    scheduled_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    drawn_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
    winning_numbers: [3, 12, 21, 33, 40, 45],
    status: "completed",
  });
}

// ─── Participant ──────────────────────────────────────────

export function createDummyParticipant(
  projectId: string,
  overrides: Partial<Participant> = {}
): Participant {
  return {
    id: uid("part"),
    project_id: projectId,
    user_id: uid("user"),
    display_name: "테스트유저",
    created_at: now(),
    ...overrides,
  };
}

// ─── Entry ────────────────────────────────────────────────

export function createDummyEntry(
  projectId: string,
  roundId: string,
  participantId: string,
  overrides: Partial<Entry> = {}
): Entry {
  return {
    id: uid("entry"),
    project_id: projectId,
    round_id: roundId,
    participant_id: participantId,
    selected_numbers: [3, 12, 21, 33, 40, 44],
    entry_type: "free",
    submitted_at: now(),
    created_at: now(),
    ...overrides,
  };
}

// ─── WinningResult ────────────────────────────────────────

export function createDummyWinningResult(
  entryId: string,
  roundId: string,
  participantId: string,
  overrides: Partial<WinningResult> = {}
): WinningResult {
  return {
    id: uid("wr"),
    entry_id: entryId,
    project_id: uid("proj"),
    round_id: roundId,
    participant_id: participantId,
    match_count: 5,
    prize_amount: 100000,
    prize_label: null,
    claim_status: "unclaimed",
    claim_info_encrypted: null,
    claimed_at: null,
    created_at: now(),
    ...overrides,
  };
}

// ─── 복합 더미 데이터 세트 ─────────────────────────────────

// 관리자 대시보드용 더미 프로젝트 목록
export function createDummyProjectList(): Project[] {
  return [
    createDummyProject({ name: "주간 로또 #1", status: "active" }),
    createDummyProject({ name: "이벤트 미니 로또", status: "active", number_min: 1, number_max: 10, pick_count: 3 }),
    createDummyProject({ name: "지난 이벤트", status: "ended" }),
  ];
}
