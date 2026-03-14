import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  badRequestResponse,
  successResponse,
  serverErrorResponse,
} from "@/lib/api-auth";

const claimSchema = z.object({
  user_id: z.string().min(1),
  name: z.string().min(1, "이름은 필수입니다.").max(50),
  contact: z
    .string()
    .min(1, "연락처는 필수입니다.")
    .regex(/^[0-9-+\s]+$/, "올바른 연락처 형식이 아닙니다."),
  bank_name: z.string().min(1, "은행명은 필수입니다.").max(30),
  account_number: z
    .string()
    .min(1, "계좌번호는 필수입니다.")
    .regex(/^[0-9-]+$/, "계좌번호는 숫자와 하이픈만 허용됩니다."),
});

// POST /api/event/[projectId]/rewards/[resultId]/claim — 리워드 청구
export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ projectId: string; resultId: string }> }
) {
  const { projectId, resultId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("잘못된 요청 형식입니다.");
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse(parsed.error.issues[0].message);
  }

  const { user_id, name, contact, bank_name, account_number } = parsed.data;
  const supabase = await createServerSupabaseClient();

  // 참여자 확인
  const { data: participant } = await supabase
    .from("participants")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user_id)
    .single();

  if (!participant) {
    return NextResponse.json(
      { data: null, error: "참여자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 당첨 결과 확인
  const { data: result, error: resultError } = await supabase
    .from("winning_results")
    .select("id, claim_status, participant_id")
    .eq("id", resultId)
    .eq("project_id", projectId)
    .single();

  if (resultError || !result) {
    return NextResponse.json(
      { data: null, error: "당첨 내역을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 본인 당첨 결과인지 확인
  if (result.participant_id !== participant.id) {
    return NextResponse.json(
      { data: null, error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  // 이미 청구된 경우
  if (result.claim_status !== "unclaimed") {
    return NextResponse.json(
      { data: null, error: "이미 청구되었거나 처리 중인 내역입니다." },
      { status: 409 }
    );
  }

  // 청구 정보 암호화 (Base64 인코딩 — 실제 운영시 AES-256 권장)
  const encryptionKey = process.env.REWARD_ENCRYPTION_KEY ?? "";
  const claimPayload = JSON.stringify({ name, contact, bank_name, account_number });
  const encryptedInfo = Buffer.from(
    `${encryptionKey}::${claimPayload}`
  ).toString("base64");

  // 청구 처리
  const { data, error } = await supabase
    .from("winning_results")
    .update({
      claim_status: "claimed",
      claimed_at: new Date().toISOString(),
      claim_info_encrypted: encryptedInfo,
    })
    .eq("id", resultId)
    .select("id, claim_status, claimed_at, prize_amount, prize_label")
    .single();

  if (error) return serverErrorResponse(error);

  return successResponse(data, 200);
}
