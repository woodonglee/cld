"use client";

import { cn } from "@/lib/utils";
import type { NumberGridProps } from "@/types/components";
import { NumberBall } from "./NumberBall";

// 번호 선택 그리드 — pickCount 충족 시 미선택 번호 흐리게 처리
export function NumberGrid({
  min,
  max,
  pickCount,
  selected,
  onSelect,
  disabled = false,
}: NumberGridProps) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  const isFull = selected.length >= pickCount;

  return (
    <div className="grid grid-cols-5 md:grid-cols-7 gap-2">
      {numbers.map((num) => {
        const isSelected = selected.includes(num);
        // pickCount 충족 시 미선택 번호는 흐리게
        const isMuted = isFull && !isSelected;
        const isDisabled = disabled || (isFull && !isSelected);

        return (
          <button
            key={num}
            type="button"
            disabled={isDisabled}
            onClick={() => !disabled && onSelect(num)}
            className={cn(
              "flex items-center justify-center rounded-full transition-all duration-200",
              "w-10 h-10 text-sm font-bold",
              isSelected
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-muted text-muted-foreground",
              isMuted && "opacity-30",
              !isDisabled && "hover:opacity-80 active:scale-95 cursor-pointer",
              isDisabled && !isSelected && "cursor-not-allowed"
            )}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}
