import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  badRequestResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

// GET /api/event/[projectId]/entries — 참여 이력 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const from = (page - 1) * limit;

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

  const { data, error, count } = await supabase
    .from("entries")
    .select(
      `
      id,
      selected_numbers,
      entry_type,
      created_at,
      draw_rounds (
        id,
        round_number,
        status,
        winning_numbers,
        drawn_at
      ),
      winning_results (
        id,
        match_count,
        prize_amount,
        reward_status
      )
    `,
      { count: "exact" }
    )
    .eq("participant_id", participant.id)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) return serverErrorResponse(error);

  return successResponse({
    items: data,
    total: count ?? 0,
    page,
    limit,
  });
}

const entrySchema = z.object({
  user_id: z.string().min(1),
  selected_numbers: z.array(z.number().int()).min(1),
  entry_type: z.enum(["free", "ad"]),
});

// POST /api/event/[projectId]/entries — 번호 제출
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("잘못된 요청 형식입니다.");
  }

  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse(parsed.error.issues[0].message);
  }

  const { user_id, selected_numbers, entry_type } = parsed.data;
  const supabase = await createServerSupabaseClient();

  // 프로젝트 및 정책 조회
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, status, pick_count, number_min, number_max, free_chances_per_period, free_chance_period_minutes, ad_chances_per_period, ad_chance_period_minutes"
    )
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { data: null, error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (project.status === "ended") {
    return NextResponse.json(
      { data: null, error: "종료된 이벤트입니다." },
      { status: 403 }
    );
  }

  // 번호 유효성 검증
  if (selected_numbers.length !== project.pick_count) {
    return badRequestResponse(
      `${project.pick_count}개의 번호를 선택해야 합니다.`
    );
  }

  const invalidNum = selected_numbers.find(
    (n) => n < project.number_min || n > project.number_max
  );
  if (invalidNum !== undefined) {
    return badRequestResponse(
      `번호는 ${project.number_min}~${project.number_max} 범위여야 합니다.`
    );
  }

  if (new Set(selected_numbers).size !== selected_numbers.length) {
    return badRequestResponse("중복된 번호가 있습니다.");
  }

  // 참여자 조회
  const { data: participant, error: partError } = await supabase
    .from("participants")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user_id)
    .single();

  if (partError || !participant) {
    return NextResponse.json(
      { data: null, error: "먼저 이벤트에 참여(가입)해주세요." },
      { status: 403 }
    );
  }

  // Rate Limiting: 1분 내 10회 초과 검증
  const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("chance_usage")
    .select("*", { count: "exact", head: true })
    .eq("participant_id", participant.id)
    .eq("project_id", projectId)
    .gte("used_at", oneMinAgo);

  if ((recentCount ?? 0) >= 10) {
    return NextResponse.json(
      { data: null, error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 기회 잔여 확인
  const periodMinutes =
    entry_type === "free"
      ? project.free_chance_period_minutes
      : project.ad_chance_period_minutes;
  const maxChances =
    entry_type === "free"
      ? project.free_chances_per_period
      : project.ad_chances_per_period;

  const periodStart = new Date(
    Date.now() - periodMinutes * 60 * 1000
  ).toISOString();

  const { count: usedCount } = await supabase
    .from("chance_usage")
    .select("*", { count: "exact", head: true })
    .eq("participant_id", participant.id)
    .eq("project_id", projectId)
    .eq("chance_type", entry_type)
    .gte("used_at", periodStart);

  if ((usedCount ?? 0) >= maxChances) {
    return NextResponse.json(
      { data: null, error: "참여 기회가 소진되었습니다." },
      { status: 403 }
    );
  }

  // 현재 pending 회차 조회 (추첨 중이면 다음 회차로 귀속)
  const { data: round, error: roundError } = await supabase
    .from("draw_rounds")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  if (roundError || !round) {
    return NextResponse.json(
      { data: null, error: "현재 진행 중인 회차가 없습니다." },
      { status: 409 }
    );
  }

  // 기회 차감 먼저 INSERT (Race Condition 방지)
  const { error: usageError } = await supabase.from("chance_usage").insert({
    participant_id: participant.id,
    project_id: projectId,
    chance_type: entry_type,
  });

  if (usageError) return serverErrorResponse(usageError);

  // 번호 제출 INSERT
  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .insert({
      project_id: projectId,
      round_id: round.id,
      participant_id: participant.id,
      selected_numbers,
      entry_type,
    })
    .select()
    .single();

  if (entryError) return serverErrorResponse(entryError);

  return successResponse(entry, 201);
}
