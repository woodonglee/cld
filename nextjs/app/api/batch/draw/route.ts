import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Fisher-Yates shuffle로 범위 내 랜덤 번호 pick_count개 추출
function pickRandomNumbers(min: number, max: number, count: number): number[] {
  const range = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  for (let i = range.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [range[i], range[j]] = [range[j], range[i]];
  }
  return range.slice(0, count).sort((a, b) => a - b);
}

// POST /api/batch/draw — 자동 추첨 배치 실행 (Cron 전용)
export async function POST(request: NextRequest) {
  // API Key 인증
  const authHeader = request.headers.get("Authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey || apiKey !== process.env.BATCH_API_SECRET) {
    return NextResponse.json(
      { data: null, error: "인증되지 않은 요청입니다." },
      { status: 401 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const results: Array<{
    round_id: string;
    project_id: string;
    round_number: number;
    winning_numbers: number[];
    winners_count: number;
    skipped?: boolean;
    reason?: string;
  }> = [];

  // scheduled_at이 지났고 아직 pending인 회차 조회
  const { data: pendingRounds, error: roundsError } = await supabase
    .from("draw_rounds")
    .select("*, projects(id, status, number_min, number_max, pick_count, draw_interval_minutes)")
    .eq("status", "pending")
    .lte("scheduled_at", now);

  if (roundsError) {
    return NextResponse.json(
      { data: null, error: roundsError.message },
      { status: 500 }
    );
  }

  if (!pendingRounds || pendingRounds.length === 0) {
    return NextResponse.json({
      data: { processed: 0, results: [] },
      error: null,
    });
  }

  for (const round of pendingRounds) {
    const project = round.projects as {
      id: string;
      status: string;
      number_min: number;
      number_max: number;
      pick_count: number;
      draw_interval_minutes: number;
    };

    // 비활성/종료 프로젝트 건너뜀
    if (!project || project.status !== "active") {
      results.push({
        round_id: round.id,
        project_id: round.project_id,
        round_number: round.round_number,
        winning_numbers: [],
        winners_count: 0,
        skipped: true,
        reason: `프로젝트 상태: ${project?.status ?? "없음"}`,
      });
      continue;
    }

    // 당첨 번호 생성
    const winningNumbers = pickRandomNumbers(
      project.number_min,
      project.number_max,
      project.pick_count
    );

    const drawnAt = new Date().toISOString();

    // 해당 회차 entries 전체 조회
    const { data: entries } = await supabase
      .from("entries")
      .select("id, participant_id, selected_numbers")
      .eq("round_id", round.id);

    // 리워드 정책 조회
    const { data: rewardPolicies } = await supabase
      .from("reward_policies")
      .select("match_count, prize_amount, prize_label")
      .eq("project_id", project.id)
      .order("match_count", { ascending: false });

    let winnersCount = 0;

    if (entries && entries.length > 0) {
      // 당첨 판정
      const winningResults = entries
        .map((entry) => {
          const matchCount = (entry.selected_numbers as number[]).filter((n) =>
            winningNumbers.includes(n)
          ).length;

          const policy = rewardPolicies?.find(
            (p) => p.match_count === matchCount
          );

          if (!policy || policy.prize_amount === 0) return null;

          return {
            entry_id: entry.id,
            project_id: project.id,
            round_id: round.id,
            participant_id: entry.participant_id,
            match_count: matchCount,
            prize_amount: policy.prize_amount,
            prize_label: policy.prize_label ?? null,
          };
        })
        .filter(Boolean);

      if (winningResults.length > 0) {
        const { error: insertError } = await supabase
          .from("winning_results")
          .insert(winningResults);

        if (!insertError) winnersCount = winningResults.length;
      }
    }

    // draw_rounds 업데이트 (추첨 완료)
    await supabase
      .from("draw_rounds")
      .update({
        winning_numbers: winningNumbers,
        drawn_at: drawnAt,
        status: "completed",
      })
      .eq("id", round.id);

    // 다음 회차 생성
    const nextScheduledAt = new Date(
      new Date(drawnAt).getTime() +
        project.draw_interval_minutes * 60 * 1000
    ).toISOString();

    await supabase.from("draw_rounds").insert({
      project_id: project.id,
      round_number: round.round_number + 1,
      scheduled_at: nextScheduledAt,
    });

    results.push({
      round_id: round.id,
      project_id: project.id,
      round_number: round.round_number,
      winning_numbers: winningNumbers,
      winners_count: winnersCount,
    });
  }

  return NextResponse.json({
    data: { processed: results.length, results },
    error: null,
  });
}
