"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CountdownProps } from "@/types/components";

// 남은 시간을 시:분:초로 계산
function getRemainingSeconds(targetDate: string): number {
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

function formatTime(totalSeconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

// 추첨까지 남은 시간 카운트다운 — 1분 이하 경고색, 0초 onComplete 콜백
export function Countdown({ targetDate, onComplete }: CountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getRemainingSeconds(targetDate);
      setRemaining(next);

      if (next <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const { h, m, s } = formatTime(remaining);
  const isWarning = remaining <= 60 && remaining > 0;
  const isDone = remaining === 0;

  return (
    <span
      className={cn(
        "font-mono font-bold tabular-nums transition-colors duration-300",
        isWarning && "text-destructive",
        isDone && "text-muted-foreground"
      )}
    >
      {h}:{m}:{s}
    </span>
  );
}
