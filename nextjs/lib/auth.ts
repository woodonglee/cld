import { createServerSupabaseClient } from "@/lib/supabase/server";

// 현재 로그인된 관리자 세션 반환
// 세션이 없으면 null 반환
export async function getAdminSession() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session;
}

// 관리자 인증 여부 확인
export async function isAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}
