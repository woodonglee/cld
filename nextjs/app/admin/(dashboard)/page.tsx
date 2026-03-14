"use client";

// 관리자 대시보드 — 통계 카드 + 프로젝트 목록 (실 API 연동)
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
import type { Project } from "@/types";

const statusBadge: Record<Project["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "운영중", variant: "default" },
  paused: { label: "일시중단", variant: "secondary" },
  ended: { label: "종료", variant: "destructive" },
};

interface ProjectWithPolicies extends Project {
  reward_policies: unknown[];
}

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<ProjectWithPolicies[]>([]);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, rewardRes] = await Promise.all([
        fetch("/api/admin/projects"),
        fetch("/api/admin/rewards?status=claimed&limit=1"),
      ]);

      if (!projRes.ok) {
        const json = await projRes.json();
        setError(json.error ?? "데이터를 불러올 수 없습니다.");
        return;
      }

      const projJson = await projRes.json();
      setProjects(projJson.data ?? []);

      if (rewardRes.ok) {
        const rewardJson = await rewardRes.json();
        setUnclaimedCount(rewardJson.data?.total ?? 0);
      }
      setError(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: string, status: "paused" | "ended") => {
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
      toast.success(`프로젝트 상태가 변경되었습니다.`);
      fetchData();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    }
  };

  const activeCount = projects.filter((p) => p.status === "active").length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="pt-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="pt-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => { setLoading(true); fetchData(); }}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Button asChild>
          <Link href="/admin/projects/new">+ 프로젝트 생성</Link>
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">총 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">활성 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">대기 보상</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-500">{unclaimedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* 프로젝트 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>프로젝트가 없습니다.</p>
              <Button className="mt-4" asChild>
                <Link href="/admin/projects/new">첫 프로젝트 생성하기</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>번호 범위</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const badge = statusBadge[project.status];
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {project.number_min}~{project.number_max} ({project.pick_count}개)
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(project.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/projects/${project.id}`}>상세</Link>
                          </Button>
                          {project.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(project.id, "paused")}
                            >
                              중단
                            </Button>
                          )}
                          {project.status === "paused" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleStatusChange(project.id, "ended")}
                            >
                              종료
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
