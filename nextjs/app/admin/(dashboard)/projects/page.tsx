import { redirect } from "next/navigation";

// /admin/projects는 대시보드로 리다이렉트 (목록은 대시보드에서 관리)
export default function AdminProjectsPage() {
  redirect("/admin");
}
