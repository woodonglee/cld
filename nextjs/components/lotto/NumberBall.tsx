"use client";

import { cn } from "@/lib/utils";
import type { NumberBallProps, NumberBallSize } from "@/types/components";

// 크기별 Tailwind 클래스 매핑 (PRD: sm=24px, md=36px, lg=48px)
const sizeClasses: Record<NumberBallSize, string> = {
  sm: "w-6 h-6 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

// 번호 공 컴포넌트 — 당첨 시 성공 색상 + 바운스 애니메이션
export function NumberBall({
  number,
  size = "md",
  isWinning = false,
  isSelected = false,
}: NumberBallProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold select-none transition-all duration-200",
        sizeClasses[size],
        // 당첨 번호: 초록색 + 바운스
        isWinning && "bg-green-500 text-white animate-bounce",
        // 선택된 번호: primary 색상 + 확대
        isSelected && !isWinning && "bg-primary text-primary-foreground scale-110",
        // 기본 상태
        !isWinning && !isSelected && "bg-muted text-muted-foreground"
      )}
    >
      {number}
    </span>
  );
}
