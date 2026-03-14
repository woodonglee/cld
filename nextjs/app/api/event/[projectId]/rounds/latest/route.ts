import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { successResponse, serverErrorResponse } from "@/lib/api-auth";

// GET /api/event/[projectId]/rounds/latest — 최신 완료 회차 결과
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  const supabase = await createServerSupabaseClient();

  // 최신 완료 회차 조회
  const { data: round, error: roundError } = await supabase
    .from("draw_rounds")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("round_number", { ascending: false })
    .limit(1)
    .single();

  if (roundError || !round) {
    return NextResponse.json(
      { data: null, error: "완료된 회차가 없습니다." },
      { status: 404 }
    );
  }

  // 당첨 결과 조회
  const { data: winners, error: winnersError } = await supabase
    .from("winning_results")
    .select(
      `
      id,
      match_count,
      prize_amount,
      prize_label,
      claim_status,
      entries (
        id,
        selected_numbers,
        entry_type,
        participants (
          user_id,
          display_name
        )
      )
    `
    )
    .eq("round_id", round.id)
    .order("match_count", { ascending: false });

  if (winnersError) return serverErrorResponse(winnersError);

  // 현재 사용자의 당첨 여부 확인
  let myResult = null;
  if (userId) {
    const { data: participant } = await supabase
      .from("participants")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (participant) {
      const { data: myWin } = await supabase
        .from("winning_results")
        .select("*, entries(selected_numbers, entry_type)")
        .eq("round_id", round.id)
        .eq("participant_id", participant.id)
        .single();

      myResult = myWin ?? null;
    }
  }

  return successResponse({ round, winners: winners ?? [], my_result: myResult });
}
