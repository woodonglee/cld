"use client";

// 프로젝트 상세 — 설정 정보 + 회차 목록 + 통계 탭 (실 API 연동)
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NumberBall } from "@/components/lotto/NumberBall";
import type { Project } from "@/types";

interface RewardPolicy {
  id: string;
  match_count: number;
  prize_amount: number;
  prize_label: string | null;
}

interface ProjectDetail extends Project {
  reward_policies: RewardPolicy[];
}

interface Round {
  id: string;
  round_number: number;
  scheduled_at: string;
  status: string;
  winning_numbers: number[] | null;
  drawn_at: string | null;
}

interface Stats {
  total_participants: number;
  total_entries: number;
  completed_rounds: number;
  total_winners: number;
  unclaimed_rewards: number;
  total_prize_amount: number;
}

const statusBadge: Record<Project["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "운영중", variant: "default" },
  paused: { label: "일시중단", variant: "secondary" },
  ended: { label: "종료", variant: "destructive" },
};

export default function AdminProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testUserId, setTestUserId] = useState("");

  useEffect(() => {
    setTestUserId(crypto.randomUUID());
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [projRes, roundsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/projects/${id}`),
        fetch(`/api/admin/projects/${id}/rounds?limit=20`),
        fetch(`/api/admin/projects/${id}/stats`),
      ]);

      if (!projRes.ok) {
        const json = await projRes.json();
        setError(json.error ?? "프로젝트를 찾을 수 없습니다.");
        return;
      }

      const [projJson, roundsJson, statsJson] = await Promise.all([
        projRes.json(),
        roundsRes.json(),
        statsRes.json(),
      ]);

      setProject(projJson.data);
      if (roundsRes.ok) setRounds(roundsJson.data?.items ?? []);
      if (statsRes.ok) setStats(statsJson.data);
      setError(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleStatusChange = async (status: "paused" | "ended") => {
    try {
      const res = await fetch(`/api/admin/projects/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "상태 변경에 실패했습니다.");
        return;
      }
      toast.success("프로젝트 상태가 변경되었습니다.");
      fetchAll();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Card><CardContent className="pt-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-destructive">{error ?? "프로젝트를 찾을 수 없습니다."}</p>
        <Button onClick={() => { setLoading(true); fetchAll(); }}>다시 시도</Button>
        <Button variant="outline" asChild><Link href="/admin">목록으로</Link></Button>
      </div>
    );
  }

  const badge = statusBadge[project.status];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">← 목록</Link>
          </Button>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <div className="flex gap-2">
          {project.status === "active" && (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange("paused")}>
              일시 중단
            </Button>
          )}
          {project.status !== "ended" && (
            <Button variant="destructive" size="sm" onClick={() => handleStatusChange("ended")}>
              종료
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">설정</TabsTrigger>
          <TabsTrigger value="rounds">회차 목록</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
        </TabsList>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>프로젝트 설정</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">번호 범위</span>
                <span>{project.number_min}~{project.number_max}</span>
                <span className="text-muted-foreground">선택 개수</span>
                <span>{project.pick_count}개</span>
                <span className="text-muted-foreground">추첨 주기</span>
                <span>
                  {project.draw_interval_minutes % 1440 === 0
                    ? `${project.draw_interval_minutes / 1440}일`
                    : project.draw_interval_minutes % 60 === 0
                    ? `${project.draw_interval_minutes / 60}시간`
                    : `${project.draw_interval_minutes}분`}
                </span>
                <span className="text-muted-foreground">무료 기회</span>
                <span>{project.free_chance_period_minutes}분마다 {project.free_chances_per_period}회</span>
                <span className="text-muted-foreground">광고 기회</span>
                <span>{project.ad_chance_period_minutes}분마다 {project.ad_chances_per_period}회</span>
                <span className="text-muted-foreground">추첨 시작일</span>
                <span>{new Date(project.draw_start_at).toLocaleString("ko-KR")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>리워드 정책</CardTitle></CardHeader>
            <CardContent>
              {project.reward_policies.length === 0 ? (
                <p className="text-muted-foreground text-sm">리워드 정책이 없습니다.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>일치 개수</TableHead>
                      <TableHead>등수</TableHead>
                      <TableHead>상금</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.reward_policies.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.match_count}개</TableCell>
                        <TableCell>{p.prize_label ?? "-"}</TableCell>
                        <TableCell>{p.prize_amount.toLocaleString()}원</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>이용자 테스트 접속</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm">테스트 사용자 ID</Label>
                <Input
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTestUserId(crypto.randomUUID())}
                >
                  새 ID 생성
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.open(`/event/${id}?userid=${testUserId}`, "_blank")}
                  disabled={!testUserId}
                >
                  이용자로 접속
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 회차 목록 탭 */}
        <TabsContent value="rounds" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {rounds.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">회차 정보가 없습니다.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>회차</TableHead>
                      <TableHead>예정일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>당첨 번호</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rounds.map((round) => (
                      <TableRow key={round.id}>
                        <TableCell>{round.round_number}회차</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(round.scheduled_at).toLocaleString("ko-KR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={round.status === "completed" ? "default" : "secondary"}>
                            {round.status === "completed" ? "추첨완료" : "대기중"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {round.winning_numbers ? (
                            <div className="flex gap-1">
                              {round.winning_numbers.map((n) => (
                                <NumberBall key={n} number={n} size="sm" isWinning />
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {round.status === "completed" && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/projects/${id}/rounds/${round.id}`}>상세</Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 통계 탭 */}
        <TabsContent value="stats" className="mt-4">
          {stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">총 참여자</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.total_participants.toLocaleString()}</p>
                </CardContent>
              </Card>
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
                  <CardTitle className="text-sm text-muted-foreground">누적 당첨금</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.total_prize_amount.toLocaleString()}원</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">완료 회차</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.completed_rounds}</p>
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
                  <CardTitle className="text-sm text-muted-foreground">미청구 보상</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-500">{stats.unclaimed_rewards}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="pt-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
