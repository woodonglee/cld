import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

// GET /api/admin/projects/[id]/rounds — 회차 목록 (페이지네이션)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const from = (page - 1) * limit;

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

  const { data, error, count } = await supabase
    .from("draw_rounds")
    .select("*", { count: "exact" })
    .eq("project_id", id)
    .order("round_number", { ascending: false })
    .range(from, from + limit - 1);

  if (error) return serverErrorResponse(error);

  return successResponse({
    items: data,
    total: count ?? 0,
    page,
    limit,
  });
}
