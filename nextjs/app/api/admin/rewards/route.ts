import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

// GET /api/admin/rewards — 관리자 리워드 목록 조회 (전체 + 필터)
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // unclaimed | claimed | processing | paid
  const projectId = searchParams.get("project_id");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const from = (page - 1) * limit;

  const supabase = createAdminSupabaseClient();

  // 관리자 소유 프로젝트 ID 목록
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("admin_id", user.id);

  const projectIds = (projects ?? []).map((p) => p.id);

  if (projectIds.length === 0) {
    return successResponse({ items: [], total: 0, page, limit });
  }

  let query = supabase
    .from("winning_results")
    .select(
      `
      id,
      match_count,
      prize_amount,
      prize_label,
      claim_status,
      claimed_at,
      claim_info_encrypted,
      project_id,
      projects (name),
      draw_rounds (round_number, drawn_at),
      entries (selected_numbers, entry_type),
      participants (user_id, display_name)
    `,
      { count: "exact" }
    )
    .in("project_id", projectIds)
    .order("claimed_at", { ascending: false, nullsFirst: false })
    .range(from, from + limit - 1);

  if (status) query = query.eq("claim_status", status);
  if (projectId) query = query.eq("project_id", projectId);

  const { data, error, count } = await query;
  if (error) return serverErrorResponse(error);

  return successResponse({ items: data ?? [], total: count ?? 0, page, limit });
}
