"use client";

// 회차 상세 — 실 API 연동 (통계 카드 + 당첨자 목록 + 참여 상세 Sheet)
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NumberBall } from "@/components/lotto/NumberBall";

interface RoundDetail {
  id: string;
  round_number: number;
  scheduled_at: string;
  drawn_at: string | null;
  winning_numbers: number[] | null;
  status: string;
}

interface Winner {
  id: string;
  match_count: number;
  prize_amount: number;
  prize_label: string | null;
  claim_status: string;
  entries: {
    id: string;
    selected_numbers: number[];
    entry_type: string;
    submitted_at: string;
    participants: {
      id: string;
      user_id: string;
      display_name: string;
    };
  };
}

interface RoundStats {
  total_entries: number;
  unique_participants: number;
  total_winners: number;
  unclaimed_count: number;
}

interface EntryItem {
  id: string;
  submitted_at: string;
  entry_type: string;
  selected_numbers: number[];
  participants: {
    id: string;
    user_id: string;
    display_name: string;
  };
  winning_results: Array<{
    match_count: number;
    prize_amount: number;
    prize_label: string | null;
    claim_status: string;
  }>;
}

export default function AdminRoundDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const roundId = params.roundId as string;

  const [round, setRound] = useState<RoundDetail | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [stats, setStats] = useState<RoundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sheet 상태
  const [sheetOpen, setSheetOpen] = useState(false);
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [entriesPage, setEntriesPage] = useState(1);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [roundRes, statsRes] = await Promise.all([
        fetch(`/api/admin/projects/${id}/rounds/${roundId}`),
        fetch(`/api/admin/projects/${id}/rounds/${roundId}/stats`),
      ]);

      if (!roundRes.ok) {
        const json = await roundRes.json();
        setError(json.error ?? "회차를 찾을 수 없습니다.");
        return;
      }

      const [roundJson, statsJson] = await Promise.all([
        roundRes.json(),
        statsRes.json(),
      ]);

      setRound(roundJson.data?.round ?? null);
      setWinners(roundJson.data?.winners ?? []);
      if (statsRes.ok) setStats(statsJson.data);
      setError(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, roundId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchEntries = useCallback(
    async (page: number) => {
      setEntriesLoading(true);
      try {
        const res = await fetch(
          `/api/admin/projects/${id}/rounds/${roundId}/entries?page=${page}&limit=50`
        );
        const json = await res.json();
        if (res.ok) {
          setEntries(json.data?.items ?? []);
          setEntriesTotal(json.data?.total ?? 0);
          setEntriesPage(page);
        }
      } catch {
        // 조용히 처리
      } finally {
        setEntriesLoading(false);
      }
    },
    [id, roundId]
  );

  const handleOpenSheet = () => {
    setSheetOpen(true);
    fetchEntries(1);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-4">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-destructive">{error ?? "회차를 찾을 수 없습니다."}</p>
        <Button onClick={() => { setLoading(true); fetchAll(); }}>다시 시도</Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/projects/${id}`}>프로젝트로</Link>
        </Button>
      </div>
    );
  }

  const totalPages = Math.ceil(entriesTotal / 50);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/projects/${id}`}>← 프로젝트</Link>
          </Button>
          <h1 className="text-2xl font-bold">{round.round_number}회차 상세</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleOpenSheet}>
          상세 보기
        </Button>
      </div>

      {/* 통계 카드 4개 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">총 참여 횟수</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_entries.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">고유 참여자</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.unique_participants.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">당첨자 수</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_winners.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">미수령 상금</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-500">{stats.unclaimed_count}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 회차 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>회차 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">추첨 예정일</span>
            <span>{new Date(round.scheduled_at).toLocaleString("ko-KR")}</span>
            <span className="text-muted-foreground">추첨 완료일</span>
            <span>
              {round.drawn_at
                ? new Date(round.drawn_at).toLocaleString("ko-KR")
                : "-"}
            </span>
          </div>
          {round.winning_numbers && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">당첨 번호</p>
              <div className="flex flex-wrap gap-2">
                {round.winning_numbers.map((n) => (
                  <NumberBall key={n} number={n} size="lg" isWinning />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 당첨자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>당첨자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {winners.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">당첨자가 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>참여자</TableHead>
                  <TableHead>선택 번호</TableHead>
                  <TableHead>일치 수</TableHead>
                  <TableHead>상금</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map((winner) => (
                  <TableRow key={winner.id}>
                    <TableCell className="font-medium">
                      {winner.entries?.participants?.display_name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {winner.entries?.selected_numbers?.map((n) => (
                          <NumberBall
                            key={n}
                            number={n}
                            size="sm"
                            isWinning={round.winning_numbers?.includes(n)}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{winner.match_count}개</TableCell>
                    <TableCell>{winner.prize_amount.toLocaleString()}원</TableCell>
                    <TableCell>
                      <Badge
                        variant={winner.claim_status === "claimed" ? "default" : "secondary"}
                      >
                        {winner.claim_status === "claimed" ? "수령" : "미수령"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 참여 상세 Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{round.round_number}회차 참여 상세</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {entriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  총 {entriesTotal.toLocaleString()}건
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>참여자명</TableHead>
                      <TableHead>사용자 ID</TableHead>
                      <TableHead>선택 번호</TableHead>
                      <TableHead>당첨</TableHead>
                      <TableHead>일치</TableHead>
                      <TableHead>상금</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => {
                      const winResult = entry.winning_results?.[0];
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {entry.participants?.display_name ?? "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-24 truncate">
                            {entry.participants?.user_id ?? "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {entry.selected_numbers?.map((n) => (
                                <NumberBall
                                  key={n}
                                  number={n}
                                  size="sm"
                                  isWinning={round.winning_numbers?.includes(n)}
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {winResult ? (
                              <Badge variant="default">
                                {winResult.prize_label ?? "당첨"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>{winResult?.match_count ?? "-"}</TableCell>
                          <TableCell>
                            {winResult
                              ? `${winResult.prize_amount.toLocaleString()}원`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={entriesPage <= 1}
                      onClick={() => fetchEntries(entriesPage - 1)}
                    >
                      이전
                    </Button>
                    <span className="text-sm self-center">
                      {entriesPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={entriesPage >= totalPages}
                      onClick={() => fetchEntries(entriesPage + 1)}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
