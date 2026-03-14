import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  badRequestResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

// 프로젝트 생성 Zod 스키마
const createProjectSchema = z
  .object({
    name: z.string().min(1, "프로젝트 이름은 필수입니다."),
    number_min: z.number().int().min(1),
    number_max: z.number().int().min(2),
    pick_count: z.number().int().min(1),
    draw_interval_minutes: z
      .number()
      .int()
      .min(1440, "추첨 주기는 최소 1일(1440분)입니다.")
      .max(10080, "추첨 주기는 최대 10080분(1주)입니다."),
    draw_start_at: z.string().datetime({ offset: true }).or(z.string().min(1)),
    free_chances_per_period: z.number().int().min(0),
    free_chance_period_minutes: z.number().int().min(1),
    ad_chances_per_period: z.number().int().min(0),
    ad_chance_period_minutes: z.number().int().min(1),
    reward_policies: z
      .array(
        z.object({
          match_count: z.number().int().min(1),
          prize_amount: z.number().int().min(0),
          prize_label: z.string().optional(),
        })
      )
      .min(1, "리워드 정책은 최소 1개 필요합니다."),
  })
  .refine((d) => d.number_max > d.number_min, {
    message: "number_max는 number_min보다 커야 합니다.",
  })
  .refine((d) => d.pick_count <= d.number_max - d.number_min + 1, {
    message: "pick_count가 번호 범위를 초과합니다.",
  });

// GET /api/admin/projects — 프로젝트 목록 조회
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from("projects")
    .select("*, reward_policies(*)")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return serverErrorResponse(error);

  return successResponse(data);
}

// POST /api/admin/projects — 프로젝트 생성
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("잘못된 요청 형식입니다.");
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse(parsed.error.issues[0].message);
  }

  const { reward_policies, ...projectData } = parsed.data;
  const supabase = createAdminSupabaseClient();

  // 프로젝트 INSERT
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({ ...projectData, admin_id: user.id })
    .select()
    .single();

  if (projectError) return serverErrorResponse(projectError);

  // 리워드 정책 INSERT (첫 회차 생성 전에 해야 트리거 통과)
  const { error: policyError } = await supabase.from("reward_policies").insert(
    reward_policies.map((p) => ({ ...p, project_id: project.id }))
  );

  if (policyError) return serverErrorResponse(policyError);

  // 첫 추첨 회차 생성
  const { error: roundError } = await supabase.from("draw_rounds").insert({
    project_id: project.id,
    round_number: 1,
    scheduled_at: project.draw_start_at,
  });

  if (roundError) return serverErrorResponse(roundError);

  // 생성된 프로젝트 + 정책 반환
  const { data: full, error: fetchError } = await supabase
    .from("projects")
    .select("*, reward_policies(*)")
    .eq("id", project.id)
    .single();

  if (fetchError) return serverErrorResponse(fetchError);

  return successResponse(full, 201);
}
