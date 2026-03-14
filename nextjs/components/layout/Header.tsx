"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

// 기본 헤더 — 서비스 개발 시 네비게이션 링크를 추가하세요
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* 로고 영역 — 서비스에 맞게 수정하세요 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">My</span>
          <span className="text-muted-foreground">App</span>
        </Link>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
