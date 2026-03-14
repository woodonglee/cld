import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  badRequestResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";
import { NextResponse } from "next/server";

// GET /api/event/[projectId]/chances?userid=xxx — 남은 참여 기회 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const userid = searchParams.get("user_id");

  if (!userid) return badRequestResponse("user_id 파라미터가 필요합니다.");

  const supabase = await createServerSupabaseClient();

  // 프로젝트 기회 정책 조회
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "free_chances_per_period, free_chance_period_minutes, ad_chances_per_period, ad_chance_period_minutes"
    )
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { data: null, error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 참여자 조회
  const { data: participant } = await supabase
    .from("participants")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userid)
    .single();

  if (!participant) {
    return NextResponse.json(
      { data: null, error: "참여자를 찾을 수 없습니다. 먼저 가입해주세요." },
      { status: 404 }
    );
  }

  const now = new Date();

  // 무료 기회: 기간 내 사용 횟수 계산
  const freePeriodStart = new Date(
    now.getTime() - project.free_chance_period_minutes * 60 * 1000
  );
  const { count: freeUsed, error: freeError } = await supabase
    .from("chance_usage")
    .select("*", { count: "exact", head: true })
    .eq("participant_id", participant.id)
    .eq("project_id", projectId)
    .eq("chance_type", "free")
    .gte("used_at", freePeriodStart.toISOString());

  if (freeError) return serverErrorResponse(freeError);

  // 광고 기회: 기간 내 사용 횟수 계산
  const adPeriodStart = new Date(
    now.getTime() - project.ad_chance_period_minutes * 60 * 1000
  );
  const { count: adUsed, error: adError } = await supabase
    .from("chance_usage")
    .select("*", { count: "exact", head: true })
    .eq("participant_id", participant.id)
    .eq("project_id", projectId)
    .eq("chance_type", "ad")
    .gte("used_at", adPeriodStart.toISOString());

  if (adError) return serverErrorResponse(adError);

  const freeRemaining = Math.max(
    0,
    project.free_chances_per_period - (freeUsed ?? 0)
  );
  const adRemaining = Math.max(
    0,
    project.ad_chances_per_period - (adUsed ?? 0)
  );

  // 다음 충전 시각 계산 (가장 오래된 사용 기록 기준)
  const calcNextAt = async (chanceType: "free" | "ad", periodMinutes: number) => {
    const { data: oldest } = await supabase
      .from("chance_usage")
      .select("used_at")
      .eq("participant_id", participant.id)
      .eq("project_id", projectId)
      .eq("chance_type", chanceType)
      .order("used_at", { ascending: true })
      .limit(1)
      .single();

    if (!oldest) return null;
    return new Date(
      new Date(oldest.used_at).getTime() + periodMinutes * 60 * 1000
    ).toISOString();
  };

  const [nextFreeAt, nextAdAt] = await Promise.all([
    freeRemaining === 0
      ? calcNextAt("free", project.free_chance_period_minutes)
      : Promise.resolve(null),
    adRemaining === 0
      ? calcNextAt("ad", project.ad_chance_period_minutes)
      : Promise.resolve(null),
  ]);

  return successResponse({
    free_remaining: freeRemaining,
    ad_remaining: adRemaining,
    next_free_at: nextFreeAt,
    next_ad_at: nextAdAt,
  });
}
