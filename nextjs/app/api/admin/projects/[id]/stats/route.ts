import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

// GET /api/admin/projects/[id]/stats — 프로젝트 통계
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  // 프로젝트 소유 확인
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("admin_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json(
      { data: null, error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 병렬 통계 조회
  const [
    { count: totalParticipants },
    { count: totalEntries },
    { count: totalRounds },
    { count: completedRounds },
    { count: totalWinners },
    { count: unclaimedRewards },
  ] = await Promise.all([
    supabase
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),
    supabase
      .from("entries")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),
    supabase
      .from("draw_rounds")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),
    supabase
      .from("draw_rounds")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id)
      .eq("status", "completed"),
    supabase
      .from("winning_results")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),
    supabase
      .from("winning_results")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id)
      .eq("claim_status", "unclaimed"),
  ]);

  // 총 상금 합계
  const { data: prizeData, error: prizeError } = await supabase
    .from("winning_results")
    .select("prize_amount")
    .eq("project_id", id);

  if (prizeError) return serverErrorResponse(prizeError);

  const totalPrizeAmount = (prizeData ?? []).reduce(
    (sum, r) => sum + (r.prize_amount ?? 0),
    0
  );

  return successResponse({
    total_participants: totalParticipants ?? 0,
    total_entries: totalEntries ?? 0,
    total_rounds: totalRounds ?? 0,
    completed_rounds: completedRounds ?? 0,
    total_winners: totalWinners ?? 0,
    unclaimed_rewards: unclaimedRewards ?? 0,
    total_prize_amount: totalPrizeAmount,
  });
}
