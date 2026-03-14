"use client";

// 결과 확인 페이지 — 최신 당첨번호 + 본인 선택번호 비교
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { NumberBall } from "@/components/lotto/NumberBall";

interface WinningResult {
  id: string;
  match_count: number;
  prize_amount: number;
  prize_label: string | null;
  claim_status: string;
  entries: { selected_numbers: number[]; entry_type: string } | null;
}

interface RoundData {
  id: string;
  round_number: number;
  winning_numbers: number[];
  drawn_at: string;
}

interface ResultsData {
  round: RoundData;
  winners: unknown[];
  my_result: WinningResult | null;
}

function ResultsContent({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const userid = searchParams.get("userid");

  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const url = `/api/event/${projectId}/rounds/latest${userid ? `?user_id=${userid}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "결과를 불러올 수 없습니다.");
        return;
      }
      setData(json.data);
      setError(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [projectId, userid]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Card><CardContent className="pt-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
        <Card><CardContent className="pt-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => { setLoading(true); fetchResults(); }}>다시 시도</Button>
        <Button variant="outline" asChild>
          <Link href={`/event/${projectId}${userid ? `?userid=${userid}` : ""}`}>메인으로</Link>
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { round, my_result } = data;
  const myNumbers = my_result?.entries?.selected_numbers ?? [];
  const matchCount = my_result?.match_count ?? 0;
  const isWinner = !!my_result;
  const canClaim = isWinner && my_result.claim_status === "unclaimed";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/event/${projectId}${userid ? `?userid=${userid}` : ""}`}>← 메인</Link>
        </Button>
        <h1 className="text-xl font-bold">결과 확인</h1>
      </div>

      {/* 당첨 여부 배너 */}
      {userid && (
        <div
          className={`rounded-lg p-4 text-center font-bold text-lg ${
            isWinner
              ? "bg-green-500/20 text-green-700 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isWinner
            ? `🎉 ${matchCount}개 일치! ${my_result.prize_label ?? "당첨"}되었습니다!`
            : "아쉽게도 낙첨되었습니다."}
        </div>
      )}

      {/* 최신 당첨 번호 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{round.round_number}회차 당첨 번호</CardTitle>
            <Badge variant="outline" className="text-xs">
              {new Date(round.drawn_at).toLocaleString("ko-KR")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center">
            {round.winning_numbers.map((n) => (
              <NumberBall key={n} number={n} size="lg" isWinning />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 내 선택 번호 (참여한 경우만) */}
      {myNumbers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">내 선택 번호</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {myNumbers.map((n) => (
                <NumberBall
                  key={n}
                  number={n}
                  size="lg"
                  isSelected={!round.winning_numbers.includes(n)}
                  isWinning={round.winning_numbers.includes(n)}
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">{matchCount}개 일치</p>
          </CardContent>
        </Card>
      )}

      {/* 당첨 + 미청구 시 보상 수령 버튼 */}
      {canClaim && userid && (
        <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
          <Link href={`/event/${projectId}/claim/${my_result.id}?userid=${userid}`}>
            🎁 보상 수령하기 ({my_result.prize_label ?? `${my_result.prize_amount.toLocaleString()}원`})
          </Link>
        </Button>
      )}

      {/* 이미 청구됨 */}
      {isWinner && !canClaim && (
        <div className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
          {my_result.claim_status === "paid"
            ? "✅ 보상이 지급 완료되었습니다."
            : "보상 청구가 처리 중입니다."}
        </div>
      )}

      <Button variant="outline" className="w-full" asChild>
        <Link href={`/event/${projectId}/history${userid ? `?userid=${userid}` : ""}`}>
          전체 참여 이력 보기
        </Link>
      </Button>
    </div>
  );
}

export default function EventResultsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  return (
    <Suspense fallback={<div className="p-4 text-center text-muted-foreground">불러오는 중...</div>}>
      <ResultsContent projectId={projectId} />
    </Suspense>
  );
}
