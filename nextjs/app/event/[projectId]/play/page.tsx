"use client";

// 번호 선택 페이지 — NumberGrid + 자동선택 + 제출 Dialog
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { NumberGrid } from "@/components/lotto/NumberGrid";
import { NumberBall } from "@/components/lotto/NumberBall";

interface ProjectInfo {
  id: string;
  name: string;
  status: string;
  pick_count: number;
  number_min: number;
  number_max: number;
}

function PlayPageContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userid = searchParams.get("userid") ?? "";
  const entryType = (searchParams.get("type") as "free" | "ad") ?? "free";

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/event/${projectId}?user_id=${userid}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "프로젝트를 불러올 수 없습니다.");
        return;
      }
      setProject(json.data?.project ?? json.data);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="p-4 space-y-5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="flex gap-2"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-destructive">{error ?? "데이터를 불러올 수 없습니다."}</p>
        <Button onClick={() => { setLoading(true); setError(null); fetchProject(); }}>
          다시 시도
        </Button>
        <Button variant="outline" onClick={() => router.back()}>뒤로 가기</Button>
      </div>
    );
  }

  if (project.status !== "active") {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Badge variant="secondary">참여 불가</Badge>
        <p className="text-muted-foreground text-sm">현재 번호를 제출할 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.back()}>뒤로 가기</Button>
      </div>
    );
  }

  const isFull = selected.length >= project.pick_count;

  const handleSelect = (num: number) => {
    setSelected((prev) =>
      prev.includes(num)
        ? prev.filter((n) => n !== num)
        : prev.length < project.pick_count
        ? [...prev, num]
        : prev
    );
  };

  const handleAutoSelect = () => {
    const range = Array.from(
      { length: project.number_max - project.number_min + 1 },
      (_, i) => i + project.number_min
    );
    const shuffled = range.sort(() => Math.random() - 0.5);
    setSelected(shuffled.slice(0, project.pick_count));
  };

  const handleSubmit = async () => {
    if (!userid) {
      toast.error("userid가 없습니다. URL을 확인해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/event/${projectId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userid,
          selected_numbers: selected,
          entry_type: entryType,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "번호 제출에 실패했습니다.");
        setDialogOpen(false);
        return;
      }
      toast.success("번호가 제출되었습니다!");
      setDialogOpen(false);
      router.push(`/event/${projectId}?userid=${userid}`);
    } catch {
      toast.error("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">번호 선택</h1>
        <span className="text-sm text-muted-foreground">
          {selected.length} / {project.pick_count}개
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {project.number_min}~{project.number_max} 중 {project.pick_count}개를 선택하세요.
      </p>

      <NumberGrid
        min={project.number_min}
        max={project.number_max}
        pickCount={project.pick_count}
        selected={selected}
        onSelect={handleSelect}
      />

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={handleAutoSelect}>
          자동 선택
        </Button>
        <Button className="flex-1" disabled={!isFull} onClick={() => setDialogOpen(true)}>
          제출하기
        </Button>
      </div>

      {/* 제출 확인 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>번호 제출 확인</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              아래 번호로 제출하시겠습니까?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[...selected]
                .sort((a, b) => a - b)
                .map((n) => (
                  <NumberBall key={n} number={n} size="md" isSelected />
                ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              유형: {entryType === "free" ? "무료" : "광고"}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "제출 중..." : "확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EventPlayPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  return (
    <Suspense fallback={<div className="p-4 text-center text-muted-foreground">불러오는 중...</div>}>
      <PlayPageContent projectId={projectId} />
    </Suspense>
  );
}
