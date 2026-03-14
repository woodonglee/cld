import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  badRequestResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

const statusSchema = z.object({
  status: z.enum(["paused", "ended"]),
});

// PATCH /api/admin/projects/[id]/status — 프로젝트 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("잘못된 요청 형식입니다.");
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse(parsed.error.issues[0].message);
  }

  const supabase = createAdminSupabaseClient();

  // 현재 상태 확인
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("status")
    .eq("id", id)
    .eq("admin_id", user.id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json(
      { data: null, error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 종료된 프로젝트는 재활성화 불가
  if (project.status === "ended") {
    return badRequestResponse("종료된 프로젝트의 상태는 변경할 수 없습니다.");
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select()
    .single();

  if (error) return serverErrorResponse(error);

  return successResponse(data);
}
