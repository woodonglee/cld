// API 요청/응답 타입 정의

import type { EntryType, ProjectStatus, RewardStatus } from "./db";
import type { Project, RewardPolicy, DrawRound, Participant, Entry, WinningResult } from "./db";

// 공통 API 응답 래퍼
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// 페이지네이션
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Admin API ───────────────────────────────────────────

// 프로젝트 생성 요청
export interface CreateProjectRequest {
  name: string;
  number_min: number;
  number_max: number;
  pick_count: number;
  draw_interval_minutes: number;
  draw_start_at: string;
  free_chances_per_period: number;
  free_chance_period_minutes: number;
  ad_chances_per_period: number;
  ad_chance_period_minutes: number;
  reward_policies: Array<{
    match_count: number;
    prize_amount: number;
    prize_label?: string;
  }>;
}

// 프로젝트 상태 변경 요청
export interface UpdateProjectStatusRequest {
  status: "paused" | "ended";
}

// 프로젝트 상세 응답 (reward_policies 포함)
export interface ProjectDetailResponse extends Project {
  reward_policies: RewardPolicy[];
}

// 프로젝트 통계 응답
export interface ProjectStatsResponse {
  total_participants: number;
  total_entries: number;
  current_round_number: number;
  total_prize_paid: number;
  entries_per_round: Array<{ round_number: number; entry_count: number }>;
}

// 보상 지급 상태 변경 요청
export interface UpdateRewardStatusRequest {
  status: "processing" | "paid";
}

// 보상 목록 조회 응답
export interface RewardListItem {
  id: string;
  round_number: number;
  participant_display_name: string;
  match_count: number;
  prize_amount: number;
  claim_status: RewardStatus;
  claimed_at: string | null;
  paid_at: string | null;
}

// ─── User API ────────────────────────────────────────────

// 참여자 가입 요청
export interface JoinEventRequest {
  user_id: string;
  display_name: string;
}

// 번호 제출 요청
export interface SubmitEntryRequest {
  user_id: string;
  selected_numbers: number[];
  entry_type: EntryType;
}

// 남은 참여 기회 응답
export interface ChancesResponse {
  free_remaining: number;
  ad_remaining: number;
  next_free_at: string | null;
  next_ad_at: string | null;
}

// 보상 수령 정보 제출 요청
export interface ClaimRewardRequest {
  recipient_name: string;
  contact: string;
  bank_name: string;
  account_number: string;
}

// 이벤트 메인 페이지 응답
export interface EventMainResponse {
  project: Project;
  reward_policies: RewardPolicy[];
  current_round: DrawRound | null;
  latest_drawn_round: DrawRound | null;
  participant: Participant | null;
}

// 참여 이력 항목
export interface EntryHistoryItem extends Entry {
  round_number: number;
  scheduled_at: string;
  winning_numbers: number[] | null;
  match_count?: number;
  prize_amount?: number;
  claim_status?: RewardStatus;
}

// 최신 추첨 결과 응답
export interface LatestRoundResponse {
  round: DrawRound;
  my_entries: Array<{
    entry: Entry;
    match_count?: number;
    prize_amount?: number;
    claim_status?: RewardStatus;
    winning_result_id?: string;
  }>;
}
