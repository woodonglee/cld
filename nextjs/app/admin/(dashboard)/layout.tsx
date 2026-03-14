import { AdminSidebar } from "@/components/layout/admin/AdminSidebar";

// 관리자 대시보드 레이아웃 — 사이드바 + 메인 콘텐츠 영역
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  );
}
