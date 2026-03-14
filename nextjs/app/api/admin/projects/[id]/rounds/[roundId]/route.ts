import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

// GET /api/admin/projects/[id]/rounds/[roundId] — 회차 상세 (당첨번호 + 당첨자 목록)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const { id, roundId } = await params;
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

  // 회차 조회
  const { data: round, error: roundError } = await supabase
    .from("draw_rounds")
    .select("*")
    .eq("id", roundId)
    .eq("project_id", id)
    .single();

  if (roundError || !round) {
    return NextResponse.json(
      { data: null, error: "회차를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 당첨자 목록 조회 (winning_results → entries → participants)
  const { data: winners, error: winnersError } = await supabase
    .from("winning_results")
    .select(
      `
      id,
      match_count,
      prize_amount,
      prize_label,
      claimed_at,
      claim_status,
      entries (
        id,
        selected_numbers,
        entry_type,
        submitted_at,
        participants (
          id,
          user_id,
          display_name
        )
      )
    `
    )
    .eq("round_id", roundId)
    .order("match_count", { ascending: false });

  if (winnersError) return serverErrorResponse(winnersError);

  return successResponse({ round, winners: winners ?? [] });
}
