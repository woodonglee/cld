import { createClient } from "@supabase/supabase-js";

// 서비스 롤 키 사용 admin 클라이언트
// RLS 우회 — 배치 추첨, 서버 전용 관리 작업에만 사용
// 클라이언트 컴포넌트에서 절대 사용 금지
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
