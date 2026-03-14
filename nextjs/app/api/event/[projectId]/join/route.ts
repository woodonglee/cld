import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  badRequestResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";
import { NextResponse } from "next/server";

const joinSchema = z.object({
  user_id: z.string().min(1, "user_id는 필수입니다."),
  display_name: z
    .string()
    .min(2, "사용자명은 2자 이상이어야 합니다.")
    .max(20, "사용자명은 20자 이하여야 합니다.")
    .regex(/^[가-힣a-zA-Z0-9]+$/, "사용자명은 한글, 영문, 숫자만 사용 가능합니다."),
});

// POST /api/event/[projectId]/join — 참여자 가입 (upsert)
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

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse(parsed.error.issues[0].message);
  }

  const supabase = await createServerSupabaseClient();

  // 프로젝트 활성 상태 확인
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, status")
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

  // 참여자 upsert (같은 project_id + user_id면 display_name 업데이트)
  const { data, error } = await supabase
    .from("participants")
    .upsert(
      {
        project_id: projectId,
        user_id: parsed.data.user_id,
        display_name: parsed.data.display_name,
      },
      { onConflict: "project_id,user_id" }
    )
    .select()
    .single();

  if (error) return serverErrorResponse(error);

  return successResponse(data, 201);
}
