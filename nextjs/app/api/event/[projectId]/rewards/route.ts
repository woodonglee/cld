import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { successResponse, serverErrorResponse } from "@/lib/api-auth";

// GET /api/event/[projectId]/rewards — 사용자 당첨 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { data: null, error: "user_id가 필요합니다." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // 참여자 조회
  const { data: participant } = await supabase
    .from("participants")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (!participant) {
    return NextResponse.json(
      { data: null, error: "참여자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("winning_results")
    .select(
      `
      id,
      match_count,
      prize_amount,
      prize_label,
      claim_status,
      claimed_at,
      entries (
        selected_numbers,
        entry_type,
        submitted_at
      ),
      draw_rounds (
        round_number,
        winning_numbers,
        drawn_at
      )
    `
    )
    .eq("participant_id", participant.id)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return serverErrorResponse(error);

  return successResponse(data ?? []);
}
