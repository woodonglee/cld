"use client";

// 참여 이력 페이지 — 회차별 Accordion + 실 API 연동
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NumberBall } from "@/components/lotto/NumberBall";

interface EntryItem {
  id: string;
  selected_numbers: number[];
  entry_type: string;
  created_at: string;
  draw_rounds: {
    id: string;
    round_number: number;
    status: string;
    winning_numbers: number[] | null;
    drawn_at: string | null;
  } | null;
  winning_results: {
    id: string;
    match_count: number;
    prize_amount: number;
    prize_label: string | null;
    reward_status: string;
  } | null;
}

function HistoryContent({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const userid = searchParams.get("userid");

  const [items, setItems] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = useCallback(async (p = 1, append = false) => {
    if (!userid) {
      setError("userid 파라미터가 필요합니다.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/event/${projectId}/entries?user_id=${userid}&page=${p}&limit=20`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "이력을 불러올 수 없습니다.");
        return;
      }
      const { items: newItems, total } = json.data;
      setItems((prev) => (append ? [...prev, ...newItems] : newItems));
      setHasMore(p * 20 < total);
      setPage(p);
      setError(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [projectId, userid]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchHistory(page + 1, true);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-7 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => { setLoading(true); fetchHistory(1); }}>다시 시도</Button>
        <Button variant="outline" asChild>
          <Link href={`/event/${projectId}${userid ? `?userid=${userid}` : ""}`}>메인으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/event/${projectId}${userid ? `?userid=${userid}` : ""}`}>← 메인</Link>
        </Button>
        <h1 className="text-xl font-bold">참여 이력</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 참여 이력이 없습니다.</p>
          <Button className="mt-4" asChild>
            <Link href={`/event/${projectId}/play${userid ? `?userid=${userid}` : ""}`}>
              번호 선택하러 가기
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <Accordion type="single" collapsible className="space-y-2">
            {items.map((item) => {
              const round = item.draw_rounds;
              const win = item.winning_results;
              const isPending = !round || round.status !== "completed";

              return (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left flex-wrap">
                      <span className="font-semibold">
                        {round ? `${round.round_number}회차` : "회차 정보 없음"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("ko-KR")}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.entry_type === "free" ? "무료" : "광고"}
                      </Badge>
                      {isPending ? (
                        <Badge variant="secondary">추첨 대기</Badge>
                      ) : win ? (
                        <Badge variant="default">{win.match_count}개 일치</Badge>
                      ) : (
                        <Badge variant="secondary">낙첨</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">내 번호</p>
                      <div className="flex flex-wrap gap-1">
                        {item.selected_numbers.map((n) => (
                          <NumberBall
                            key={n}
                            number={n}
                            size="sm"
                            isSelected={!round?.winning_numbers?.includes(n)}
                            isWinning={round?.winning_numbers?.includes(n) ?? false}
                          />
                        ))}
                      </div>
                    </div>
                    {round?.winning_numbers && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">당첨 번호</p>
                        <div className="flex flex-wrap gap-1">
                          {round.winning_numbers.map((n) => (
                            <NumberBall key={n} number={n} size="sm" isWinning />
                          ))}
                        </div>
                      </div>
                    )}
                    {win && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-600">
                          {win.match_count}개 일치 🎉 {win.prize_label ?? `${win.prize_amount.toLocaleString()}원`}
                        </p>
                        {win.reward_status === "unclaimed" && userid && (
                          <Button size="sm" asChild>
                            <Link href={`/event/${projectId}/claim/${win.id}?userid=${userid}`}>
                              수령하기
                            </Link>
                          </Button>
                        )}
                        {win.reward_status !== "unclaimed" && (
                          <Badge variant="outline">
                            {win.reward_status === "paid" ? "지급완료" : "처리중"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {hasMore && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "불러오는 중..." : "더 보기"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default function EventHistoryPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  return (
    <Suspense fallback={<div className="p-4 text-center text-muted-foreground">불러오는 중...</div>}>
      <HistoryContent projectId={projectId} />
    </Suspense>
  );
}
