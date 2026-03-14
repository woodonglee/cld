"use client";

// 보상 관리 — 상태별 탭 + 테이블 (실 API 연동)
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type ClaimStatus = "unclaimed" | "claimed" | "processing" | "paid";

interface RewardItem {
  id: string;
  prize_amount: number;
  prize_label: string | null;
  claim_status: ClaimStatus;
  claimed_at: string | null;
  projects: { name: string } | null;
  participants: { display_name: string } | null;
  draw_rounds: { round_number: number } | null;
}

const statusLabel: Record<ClaimStatus, string> = {
  unclaimed: "미청구",
  claimed: "청구됨",
  processing: "처리중",
  paid: "지급완료",
};

const statusVariant: Record<ClaimStatus, "default" | "secondary" | "destructive" | "outline"> = {
  unclaimed: "destructive",
  claimed: "secondary",
  processing: "default",
  paid: "outline",
};

function RewardTable({
  items,
  onMarkProcessing,
  onMarkPaid,
}: {
  items: RewardItem[];
  onMarkProcessing: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>프로젝트</TableHead>
          <TableHead>참여자</TableHead>
          <TableHead>상금</TableHead>
          <TableHead>회차</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>청구일</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              해당 보상이 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          items.map((reward) => (
            <TableRow key={reward.id}>
              <TableCell>{reward.projects?.name ?? "-"}</TableCell>
              <TableCell className="font-medium">
                {reward.participants?.display_name ?? "-"}
              </TableCell>
              <TableCell>
                {reward.prize_label ?? `${reward.prize_amount.toLocaleString()}원`}
              </TableCell>
              <TableCell>
                {reward.draw_rounds ? `${reward.draw_rounds.round_number}회차` : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[reward.claim_status]}>
                  {statusLabel[reward.claim_status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {reward.claimed_at
                  ? new Date(reward.claimed_at).toLocaleDateString("ko-KR")
                  : "-"}
              </TableCell>
              <TableCell>
                {reward.claim_status === "claimed" && (
                  <Button variant="outline" size="sm" onClick={() => onMarkProcessing(reward.id)}>
                    처리 시작
                  </Button>
                )}
                {reward.claim_status === "processing" && (
                  <Button variant="outline" size="sm" onClick={() => onMarkPaid(reward.id)}>
                    지급 완료
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | ClaimStatus>("all");

  const fetchRewards = useCallback(async (status?: ClaimStatus) => {
    try {
      const url = status
        ? `/api/admin/rewards?status=${status}&limit=50`
        : "/api/admin/rewards?limit=50";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "데이터를 불러올 수 없습니다.");
        return;
      }
      setRewards(json.data?.items ?? []);
      setTotal(json.data?.total ?? 0);
      setError(null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards(activeTab === "all" ? undefined : activeTab);
  }, [fetchRewards, activeTab]);

  const handleStatusChange = async (id: string, status: "processing" | "paid") => {
    try {
      const res = await fetch(`/api/admin/rewards/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "상태 변경에 실패했습니다.");
        return;
      }
      toast.success(status === "paid" ? "지급 완료 처리되었습니다." : "처리 시작으로 변경되었습니다.");
      fetchRewards(activeTab === "all" ? undefined : activeTab);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    }
  };

  const filterByStatus = (status: ClaimStatus | "all") =>
    status === "all" ? rewards : rewards.filter((r) => r.claim_status === status);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-96" />
        <Card>
          <CardContent className="pt-4">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => { setLoading(true); fetchRewards(); }}>다시 시도</Button>
      </div>
    );
  }

  const claimedCount = rewards.filter((r) => r.claim_status === "claimed").length;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">보상 관리</h1>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as typeof activeTab);
          setLoading(true);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">전체 ({total})</TabsTrigger>
          <TabsTrigger value="claimed">
            청구됨 {claimedCount > 0 && <span className="ml-1 text-amber-500">({claimedCount})</span>}
          </TabsTrigger>
          <TabsTrigger value="processing">처리중</TabsTrigger>
          <TabsTrigger value="paid">지급완료</TabsTrigger>
          <TabsTrigger value="unclaimed">미청구</TabsTrigger>
        </TabsList>

        {(["all", "claimed", "processing", "paid", "unclaimed"] as const).map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            <Card>
              <CardContent className="pt-4">
                <RewardTable
                  items={filterByStatus(status)}
                  onMarkProcessing={(id) => handleStatusChange(id, "processing")}
                  onMarkPaid={(id) => handleStatusChange(id, "paid")}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
