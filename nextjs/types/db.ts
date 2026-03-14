// PRD 섹션 5.4 데이터 모델 기반 DB 엔티티 타입 정의

// 프로젝트 상태
export type ProjectStatus = "active" | "paused" | "ended";

// 추첨 회차 상태
export type DrawRoundStatus = "pending" | "completed";

// 참여 유형 (무료 / 광고)
export type EntryType = "free" | "ad";

// 보상 지급 상태
export type RewardStatus = "unclaimed" | "claimed" | "processing" | "paid";

// 이벤트 프로젝트
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  // 규칙 설정 (생성 후 변경 불가)
  number_min: number;
  number_max: number;
  pick_count: number;
  // 운영 주기
  draw_interval_minutes: number;
  draw_start_at: string; // ISO 8601 timestamptz
  // 참여 기회 정책
  free_chances_per_period: number;
  free_chance_period_minutes: number;
  ad_chances_per_period: number;
  ad_chance_period_minutes: number;
  admin_id: string;
  created_at: string;
}

// 리워드 정책 (맞힌 개수 → 당첨금 매핑)
export interface RewardPolicy {
  id: string;
  project_id: string;
  match_count: number;
  prize_amount: number;
  prize_label: string | null;
  created_at: string;
}

// 추첨 회차
export interface DrawRound {
  id: string;
  project_id: string;
  round_number: number;
  scheduled_at: string;
  drawn_at: string | null;
  winning_numbers: number[] | null; // PRD: integer[] → number[]
  status: DrawRoundStatus;
  created_at: string;
}

// 이벤트 참여자
export interface Participant {
  id: string;
  project_id: string;
  user_id: string; // 외부 시스템 userid
  display_name: string;
  created_at: string;
}

// 참여 기록 (사용자가 뽑은 번호)
export interface Entry {
  id: string;
  project_id: string;
  round_id: string;
  participant_id: string;
  selected_numbers: number[]; // PRD: integer[] → number[]
  entry_type: EntryType;
  submitted_at: string;
  created_at: string;
}

// 당첨 결과
export interface WinningResult {
  id: string;
  entry_id: string;
  project_id: string;
  round_id: string;
  participant_id: string;
  match_count: number;
  prize_amount: number;
  prize_label: string | null;
  claim_status: RewardStatus;
  claim_info_encrypted: string | null;
  claimed_at: string | null;
  created_at: string;
}

// 보상 수령 정보 (암호화 저장)
export interface RewardClaim {
  id: string;
  winning_result_id: string;
  recipient_name: string;
  contact: string;
  bank_name: string;
  account_number: string;
  created_at: string;
}

// 참여 기회 사용 기록
export interface ChanceUsage {
  id: string;
  participant_id: string;
  project_id: string;
  chance_type: EntryType;
  used_at: string;
}
