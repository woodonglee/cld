"use client";

// 보상 수령 폼 — 이름/연락처/은행명/계좌번호 + 실 API 연동
import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const claimSchema = z.object({
  name: z.string().min(2, "이름을 입력해주세요.").max(50),
  contact: z
    .string()
    .regex(/^01[0-9]-\d{3,4}-\d{4}$/, "올바른 연락처 형식을 입력하세요. (예: 010-1234-5678)"),
  bank_name: z.string().min(2, "은행명을 입력해주세요.").max(30),
  account_number: z
    .string()
    .regex(/^\d{10,14}$/, "올바른 계좌번호를 입력하세요. (숫자 10~14자리)"),
});

type ClaimForm = z.infer<typeof claimSchema>;

interface RewardInfo {
  prize_amount: number;
  prize_label: string | null;
  claim_status: string;
  match_count: number;
}

function ClaimContent({
  projectId,
  resultId,
}: {
  projectId: string;
  resultId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userid = searchParams.get("userid");

  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClaimForm>({ resolver: zodResolver(claimSchema) });

  const fetchReward = useCallback(async () => {
    if (!userid) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/event/${projectId}/rewards?user_id=${userid}`
      );
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        const match = json.data.find((r: { id: string }) => r.id === resultId);
        if (match) setRewardInfo(match);
      }
    } catch {
      // 조회 실패 시 폼만 보여줌
    } finally {
      setLoading(false);
    }
  }, [projectId, resultId, userid]);

  useEffect(() => {
    fetchReward();
  }, [fetchReward]);

  const onSubmit = async (values: ClaimForm) => {
    if (!userid) {
      toast.error("userid 파라미터가 없습니다.");
      return;
    }
    try {
      const res = await fetch(
        `/api/event/${projectId}/rewards/${resultId}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userid, ...values }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "보상 수령 신청에 실패했습니다.");
        return;
      }
      setSubmitted(true);
      toast.success("보상 수령 정보가 제출되었습니다. 검토 후 연락드리겠습니다.");
    } catch {
      toast.error("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Card>
          <CardContent className="pt-4 space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="text-5xl">🎉</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">신청 완료!</h2>
          <p className="text-muted-foreground text-sm">
            보상 수령 정보가 성공적으로 제출되었습니다.
            <br />
            검토 후 등록하신 계좌로 입금해드립니다.
          </p>
        </div>
        <Button asChild>
          <Link href={`/event/${projectId}${userid ? `?userid=${userid}` : ""}`}>
            메인으로 돌아가기
          </Link>
        </Button>
      </div>
    );
  }

  // 이미 청구됨
  if (rewardInfo && rewardInfo.claim_status !== "unclaimed") {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="text-4xl">✅</div>
        <p className="font-semibold">
          {rewardInfo.claim_status === "paid"
            ? "이미 지급 완료된 보상입니다."
            : "보상 청구가 처리 중입니다."}
        </p>
        <Button variant="outline" asChild>
          <Link href={`/event/${projectId}${userid ? `?userid=${userid}` : ""}`}>
            메인으로
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/event/${projectId}/results${userid ? `?userid=${userid}` : ""}`}>
            ← 결과
          </Link>
        </Button>
        <h1 className="text-xl font-bold">보상 수령</h1>
      </div>

      {rewardInfo && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p className="font-bold text-green-700 dark:text-green-400">
            {rewardInfo.prize_label ?? `${rewardInfo.prize_amount.toLocaleString()}원`}
          </p>
          <p className="text-sm text-muted-foreground">{rewardInfo.match_count}개 일치 당첨</p>
        </div>
      )}

      <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        입력하신 정보는 암호화되어 안전하게 보관됩니다.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">수령인 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">이름</Label>
              <Input id="name" placeholder="홍길동" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="contact">연락처</Label>
              <Input id="contact" placeholder="010-1234-5678" {...register("contact")} />
              {errors.contact && (
                <p className="text-sm text-destructive">{errors.contact.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="bank_name">은행명</Label>
              <Input id="bank_name" placeholder="카카오뱅크" {...register("bank_name")} />
              {errors.bank_name && (
                <p className="text-sm text-destructive">{errors.bank_name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="account_number">계좌번호</Label>
              <Input
                id="account_number"
                placeholder="3333012345678"
                {...register("account_number")}
              />
              {errors.account_number && (
                <p className="text-sm text-destructive">{errors.account_number.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "제출 중..." : "보상 수령 신청"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventClaimPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const resultId = params.resultId as string;
  return (
    <Suspense fallback={<div className="p-4 text-center text-muted-foreground">불러오는 중...</div>}>
      <ClaimContent projectId={projectId} resultId={resultId} />
    </Suspense>
  );
}
