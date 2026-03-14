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
  status: z.enum(["processing", "paid"]),
});

// PATCH /api/admin/rewards/[id]/status — 리워드 상태 변경 (processing → paid)
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

  // 관리자 소유 프로젝트의 리워드인지 확인
  const { data: result } = await supabase
    .from("winning_results")
    .select("id, claim_status, project_id, projects(admin_id)")
    .eq("id", id)
    .single();

  if (!result) {
    return NextResponse.json(
      { data: null, error: "리워드 내역을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 소유권 확인
  const project = result.projects as unknown as { admin_id: string } | null;
  if (!project || project.admin_id !== user.id) {
    return NextResponse.json(
      { data: null, error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  // 청구 상태 확인 (unclaimed 상태에서는 변경 불가)
  if (result.claim_status === "unclaimed") {
    return badRequestResponse("청구되지 않은 리워드는 상태를 변경할 수 없습니다.");
  }

  if (result.claim_status === "paid") {
    return badRequestResponse("이미 지급 완료된 리워드입니다.");
  }

  const { data, error } = await supabase
    .from("winning_results")
    .update({ claim_status: parsed.data.status })
    .eq("id", id)
    .select("id, claim_status, prize_amount, prize_label, claimed_at")
    .single();

  if (error) return serverErrorResponse(error);

  return successResponse(data);
}
