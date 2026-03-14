// 커스텀 컴포넌트 Props 타입 정의 (PRD 섹션 7.4)

// ─── NumberGrid ───────────────────────────────────────────
// 번호 선택 그리드 컴포넌트
export interface NumberGridProps {
  // 숫자 범위
  min: number;
  max: number;
  // 선택해야 할 개수
  pickCount: number;
  // 현재 선택된 번호 배열
  selected: number[];
  // 번호 선택/해제 콜백
  onSelect: (num: number) => void;
  // 비활성화 여부 (기회 소진 시)
  disabled?: boolean;
}

// ─── NumberBall ───────────────────────────────────────────
// 번호 공 컴포넌트

export type NumberBallSize = "sm" | "md" | "lg";

export interface NumberBallProps {
  number: number;
  // 크기: sm(24px), md(36px), lg(48px)
  size?: NumberBallSize;
  // 당첨 번호 일치 시 success 색상 + 바운스 애니메이션
  isWinning?: boolean;
  // 선택된 번호 강조
  isSelected?: boolean;
}

// ─── Countdown ────────────────────────────────────────────
// 추첨까지 남은 시간 카운트다운 컴포넌트

export interface CountdownProps {
  // 목표 시각 (ISO 8601)
  targetDate: string;
  // 0초 도달 시 콜백
  onComplete?: () => void;
}
