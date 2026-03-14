// 회차 상세 — 당첨번호 + 당첨자 목록
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NumberBall } from "@/components/lotto/NumberBall";
import {
  createDummyDrawnRound,
  createDummyEntry,
  createDummyParticipant,
  createDummyWinningResult,
} from "@/lib/dummy-data";

// 더미 당첨자 데이터 생성
function createDummyWinners(roundId: string, projectId: string) {
  return Array.from({ length: 5 }, (_, i) => {
    const participant = createDummyParticipant(projectId, {
      display_name: `참여자${i + 1}`,
    });
    const entry = createDummyEntry(projectId, roundId, participant.id);
    const matchCount = [6, 5, 4, 3, 3][i];
    const prizeAmount = [1000000, 100000, 10000, 1000, 1000][i];
    const result = createDummyWinningResult(entry.id, roundId, participant.id, {
      match_count: matchCount,
      prize_amount: prizeAmount,
    });
    return { participant, entry, result };
  });
}

export default async function AdminRoundDetailPage({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>;
}) {
  const { id, roundId: _roundId } = await params;
  const round = createDummyDrawnRound(id, 3);
  const winners = createDummyWinners(round.id, id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/projects/${id}`}>← 프로젝트</Link>
        </Button>
        <h1 className="text-2xl font-bold">{round.round_number}회차 상세</h1>
      </div>

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

          {/* 당첨 번호 */}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>참여자</TableHead>
                <TableHead>선택 번호</TableHead>
                <TableHead>일치 수</TableHead>
                <TableHead>상금</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.map(({ participant, entry, result }) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">
                    {participant.display_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entry.selected_numbers.map((n) => (
                        <NumberBall
                          key={n}
                          number={n}
                          size="sm"
                          isWinning={round.winning_numbers?.includes(n)}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{result.match_count}개</TableCell>
                  <TableCell>{result.prize_amount.toLocaleString()}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
