import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";
import { NextResponse } from "next/server";

// GET /api/admin/projects/[id] — 프로젝트 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*, reward_policies(*)")
    .eq("id", id)
    .eq("admin_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { data: null, error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    return serverErrorResponse(error);
  }

  return successResponse(data);
}
