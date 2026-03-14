"use client";

// 이벤트 메인/가입 페이지 — userid 없으면 가입 폼, 있으면 이벤트 메인
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/lotto/Countdown";
import { NumberBall } from "@/components/lotto/NumberBall";

const joinSchema = z.object({
  display_name: z
    .string()
    .min(2, "2자 이상 입력해주세요.")
    .max(20, "20자 이하로 입력해주세요.")
    .regex(/^[가-힣a-zA-Z0-9]+$/, "한글, 영문, 숫자만 사용 가능합니다."),
});

type JoinForm = z.infer<typeof joinSchema>;

interface ProjectData {
  id: string;
  name: string;
  status: string;
  pick_count: number;
  number_min: number;
  number_max: number;
  current_round?: { id: string; round_number: number; scheduled_at: string; status: string } | null;
  latest_drawn_round?: { id: string; round_number: number; winning_numbers: number[]; drawn_at: string } | null;
  participant?: { id: string; display_name: string } | null;
}

interface ChancesData {
  free_remaining: number;
  ad_remaining: number;
  next_free_at?: string | null;
  next_ad_at?: string | null;
}

function EventPageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center space-y-2 py-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      <Card><CardContent className="pt-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
      <Card><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

function EventPageContent({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userid = searchParams.get("userid");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [chances, setChances] = useState<ChancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newResultBanner, setNewResultBanner] = useState(false);
  const [adWatching, setAdWatching] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinForm>({ resolver: zodResolver(joinSchema) });

  const fetchProject = useCallback(async () => {
    try {
      const url = `/api/event/${projectId}${userid ? `?user_id=${userid}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "프로젝트를 불러올 수 없습니다.");
        return;
      }
      setProject(json.data);
      setError(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [projectId, userid]);

  const fetchChances = useCallback(async () => {
    if (!userid) return;
    try {
      const res = await fetch(`/api/event/${projectId}/chances?user_id=${userid}`);
      const json = await res.json();
      if (res.ok) setChances(json.data);
    } catch {
      // 기회 조회 실패는 조용히 처리
    }
  }, [projectId, userid]);

  useEffect(() => {
    fetchProject();
    fetchChances();
  }, [fetchProject, fetchChances]);

  // 카운트다운 완료 시 결과 폴링 (최대 30초, 2초 간격)
  const handleCountdownComplete = useCallback(() => {
    setNewResultBanner(false);
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/event/${projectId}/rounds/latest?user_id=${userid ?? ""}`);
        const json = await res.json();
        if (res.ok && json.data?.round?.status === "completed") {
          clearInterval(poll);
          await fetchProject();
          await fetchChances();
          setNewResultBanner(true);
          toast.success("추첨이 완료되었습니다! 결과를 확인하세요.");
        }
      } catch {
        // 폴링 오류 무시
      }
      if (attempts >= 15) clearInterval(poll);
    }, 2000);
  }, [projectId, userid, fetchProject, fetchChances]);

  // 광고 시청 Mock
  const handleWatchAd = () => {
    if (adWatching) return;
    setAdWatching(true);
    setAdCountdown(3);
    const timer = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAdWatching(false);
          fetchChances();
          toast.success("광고 시청 완료! 참여 기회가 충전되었습니다.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onJoin = async (values: JoinForm) => {
    if (!userid) {
      toast.error("userid 파라미터가 없습니다.");
      return;
    }
    try {
      const res = await fetch(`/api/event/${projectId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userid, display_name: values.display_name }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "가입에 실패했습니다.");
        return;
      }
      toast.success(`${values.display_name}님, 환영합니다!`);
      router.refresh();
      await fetchProject();
      await fetchChances();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    }
  };

  if (loading) return <EventPageSkeleton />;

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => { setLoading(true); fetchProject(); }}>다시 시도</Button>
      </div>
    );
  }

  if (!project) return null;

  // 종료된 이벤트
  if (project.status === "ended") {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-8 space-y-2">
          <Badge variant="destructive">종료된 이벤트</Badge>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground text-sm">이 이벤트는 종료되었습니다.</p>
        </div>
        {project.latest_drawn_round && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">최종 {project.latest_drawn_round.round_number}회차 당첨 번호</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {project.latest_drawn_round.winning_numbers.map((n) => (
                  <NumberBall key={n} number={n} size="sm" isWinning />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {userid && (
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/event/${projectId}/history?userid=${userid}`}>참여 이력 보기</Link>
          </Button>
        )}
      </div>
    );
  }

  // 비활성화된 이벤트
  if (project.status === "paused") {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Badge variant="secondary">일시 중단</Badge>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground text-sm">이벤트가 일시 중단되었습니다. 잠시 후 다시 확인해주세요.</p>
      </div>
    );
  }

  // userid 없음 → 가입 폼
  if (!userid) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground text-sm">참여하려면 사용자명을 입력하세요.</p>
        </div>
        <Card className="w-full">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onJoin)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="display_name">사용자명</Label>
                <Input id="display_name" placeholder="홍길동" {...register("display_name")} />
                {errors.display_name && (
                  <p className="text-sm text-destructive">{errors.display_name.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "처리중..." : "참여하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center">
          URL에 userid 파라미터를 포함해야 참여할 수 있습니다.
        </p>
      </div>
    );
  }

  // userid 있고 미가입 → 가입 안내
  if (!project.participant) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground text-sm">사용자명을 입력하고 참여하세요.</p>
        </div>
        <Card className="w-full">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onJoin)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="display_name">사용자명</Label>
                <Input id="display_name" placeholder="홍길동" {...register("display_name")} />
                {errors.display_name && (
                  <p className="text-sm text-destructive">{errors.display_name.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "처리중..." : "참여하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 이벤트 메인 화면
  return (
    <div className="p-4 space-y-4">
      {/* 새 결과 배너 */}
      {newResultBanner && (
        <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center text-sm font-medium">
          🎉 새로운 추첨 결과가 나왔습니다!{" "}
          <Link href={`/event/${projectId}/results?userid=${userid}`} className="underline">
            결과 확인
          </Link>
        </div>
      )}

      <div className="text-center space-y-1 py-2">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground text-sm">
          안녕하세요, <span className="font-medium text-foreground">{project.participant.display_name}</span>님!
        </p>
      </div>

      {/* 다음 추첨 카운트다운 */}
      {project.current_round && (
        <Card>
          <CardContent className="pt-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">다음 추첨까지</p>
            <div className="text-3xl font-bold">
              <Countdown
                targetDate={project.current_round.scheduled_at}
                onComplete={handleCountdownComplete}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {project.current_round.round_number}회차 •{" "}
              {new Date(project.current_round.scheduled_at).toLocaleString("ko-KR")} 예정
            </p>
          </CardContent>
        </Card>
      )}

      {/* 남은 참여 기회 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-primary">
                {chances?.free_remaining ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground">무료 기회</p>
              {chances?.next_free_at && (chances.free_remaining ?? 0) === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  다음 충전:{" "}
                  {new Date(chances.next_free_at).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold">{chances?.ad_remaining ?? "-"}</p>
              <p className="text-xs text-muted-foreground">광고 기회</p>
              {(chances?.ad_remaining ?? 0) === 0 ? (
                <button
                  onClick={handleWatchAd}
                  disabled={adWatching}
                  className="text-xs text-primary underline mt-1 disabled:opacity-50"
                >
                  {adWatching ? `광고 시청 중... (${adCountdown}s)` : "광고 보고 충전"}
                </button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 번호 선택 CTA */}
      <Button
        className="w-full h-14 text-lg"
        disabled={(chances?.free_remaining ?? 0) === 0 && (chances?.ad_remaining ?? 0) === 0}
        asChild
      >
        <Link href={`/event/${projectId}/play?userid=${userid}`}>번호 선택하기</Link>
      </Button>

      {/* 참여 기회 모두 소진 안내 */}
      {chances && chances.free_remaining === 0 && chances.ad_remaining === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          참여 기회가 소진되었습니다. 다음 충전 시간을 기다려주세요.
        </p>
      )}

      {/* 최근 당첨 번호 요약 */}
      {project.latest_drawn_round && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {project.latest_drawn_round.round_number}회차 당첨 번호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {project.latest_drawn_round.winning_numbers.map((n) => (
                <NumberBall key={n} number={n} size="sm" isWinning />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 하단 링크 */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link href={`/event/${projectId}/history?userid=${userid}`}>참여 이력</Link>
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link href={`/event/${projectId}/results?userid=${userid}`}>결과 확인</Link>
        </Button>
      </div>
    </div>
  );
}

export default function EventMainPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  return (
    <Suspense fallback={<div className="p-4 text-center text-muted-foreground">불러오는 중...</div>}>
      <EventPageContent projectId={projectId} />
    </Suspense>
  );
}
