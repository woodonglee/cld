import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  badRequestResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";
import { NextResponse } from "next/server";

// GET /api/event/[projectId]?userid=xxx — 이벤트 정보 + 현재 회차 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const userid = searchParams.get("user_id");

  if (!userid) return badRequestResponse("user_id 파라미터가 필요합니다.");

  const supabase = await createServerSupabaseClient();

  // 프로젝트 조회
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*, reward_policies(*)")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { data: null, error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 현재 pending 회차 조회
  const { data: currentRound } = await supabase
    .from("draw_rounds")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  // 최근 완료된 회차 조회
  const { data: latestDrawnRound } = await supabase
    .from("draw_rounds")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("drawn_at", { ascending: false })
    .limit(1)
    .single();

  // 참여자 조회
  const { data: participant } = await supabase
    .from("participants")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userid)
    .single();

  return successResponse({
    project,
    current_round: currentRound ?? null,
    latest_drawn_round: latestDrawnRound ?? null,
    participant: participant ?? null,
  });
}
