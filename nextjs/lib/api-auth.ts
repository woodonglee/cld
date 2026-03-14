import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// API Route에서 관리자 인증 검증 헬퍼 (SSR 쿠키 패턴)
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Route Handler에서는 쿠키 쓰기 불필요
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return user;
}

// 미인증 시 401 응답 반환
export function unauthorizedResponse() {
  return NextResponse.json({ data: null, error: "인증이 필요합니다." }, { status: 401 });
}

// 잘못된 요청 400 응답
export function badRequestResponse(message: string) {
  return NextResponse.json({ data: null, error: message }, { status: 400 });
}

// 성공 응답
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

// 서버 에러 500 응답
export function serverErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
  return NextResponse.json({ data: null, error: message }, { status: 500 });
}
