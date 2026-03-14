"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Gift, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/admin/(auth)/login/actions";

// 사이드바 네비게이션 항목 정의
const navItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "프로젝트", icon: FolderOpen, exact: false },
  { href: "/admin/rewards", label: "보상관리", icon: Gift, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  // 현재 경로와 네비게이션 항목 일치 여부 확인
  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border">
      {/* 로고 */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">Lotto</span>
          <span className="text-muted-foreground">Admin</span>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 버튼 (실제 기능은 Task 004에서 구현) */}
      <div className="px-3 py-4 border-t border-border">
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </form>
      </div>
    </aside>
  );
}
