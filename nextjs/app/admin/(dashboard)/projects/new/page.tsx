"use client";

// 프로젝트 생성 — 4단계 스텝 폼 위저드
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RewardPolicyInput {
  match_count: number;
  prize_amount: number;
  prize_label: string;
}

interface FormState {
  name: string;
  number_min: number;
  number_max: number;
  pick_count: number;
  draw_interval_minutes: number;
  draw_start_at: string;
  reward_policies: RewardPolicyInput[];
  free_chances_per_period: number;
  free_chance_period_minutes: number;
  ad_chances_per_period: number;
  ad_chance_period_minutes: number;
}

// pick_count별 기본 상금 테이블 (rank 순)
const PRIZE_TABLE = [1000000, 100000, 10000, 1000, 500, 100];

function generateDefaultPolicies(pickCount: number): RewardPolicyInput[] {
  return Array.from({ length: pickCount }, (_, i) => ({
    match_count: pickCount - i,
    prize_amount: PRIZE_TABLE[i] ?? 100,
    prize_label: `${i + 1}등`,
  }));
}

const defaultForm: FormState = {
  name: "",
  number_min: 1,
  number_max: 45,
  pick_count: 6,
  draw_interval_minutes: 10080,
  draw_start_at: "",
  reward_policies: generateDefaultPolicies(6),
  free_chances_per_period: 1,
  free_chance_period_minutes: 60,
  ad_chances_per_period: 2,
  ad_chance_period_minutes: 60,
};

const STEPS = ["기본 설정", "리워드 정책", "참여 기회", "검토 확인"];

export default function AdminProjectNewPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isPoliciesAtDefault, setIsPoliciesAtDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addPolicy = () => {
    setIsPoliciesAtDefault(false);
    set("reward_policies", [
      ...form.reward_policies,
      { match_count: 0, prize_amount: 0, prize_label: "" },
    ]);
  };

  const removePolicy = (idx: number) => {
    setIsPoliciesAtDefault(false);
    set("reward_policies", form.reward_policies.filter((_, i) => i !== idx));
  };

  const updatePolicy = (
    idx: number,
    field: keyof RewardPolicyInput,
    value: string | number
  ) => {
    setIsPoliciesAtDefault(false);
    set(
      "reward_policies",
      form.reward_policies.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  // pick_count 변경 시 기본 정책 자동 갱신 (수동 수정하지 않은 경우만)
  useEffect(() => {
    if (isPoliciesAtDefault) {
      setForm((prev) => ({
        ...prev,
        reward_policies: generateDefaultPolicies(prev.pick_count),
      }));
    }
  }, [form.pick_count, isPoliciesAtDefault]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const draw_start_at = form.draw_start_at
        ? new Date(form.draw_start_at).toISOString()
        : new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const payload = {
        ...form,
        draw_start_at,
        reward_policies: form.reward_policies.map((p) => ({
          ...p,
          prize_label: p.prize_label || undefined,
        })),
      };

      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "프로젝트 생성에 실패했습니다.");
        return;
      }
      toast.success("프로젝트가 생성되었습니다.");
      router.push("/admin");
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">프로젝트 생성</h1>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                i <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline whitespace-nowrap ${
                i === step ? "font-semibold" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: 기본 설정 */}
          {step === 0 && (
            <>
              <div className="space-y-1">
                <Label>프로젝트 이름</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="주간 로또 이벤트"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>최솟값</Label>
                  <Input
                    type="number"
                    value={form.number_min}
                    onChange={(e) => set("number_min", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>최댓값</Label>
                  <Input
                    type="number"
                    value={form.number_max}
                    onChange={(e) => set("number_max", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>선택 개수</Label>
                  <Input
                    type="number"
                    value={form.pick_count}
                    onChange={(e) => set("pick_count", Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>추첨 주기 (일, 1~7일)</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={form.draw_interval_minutes / 1440}
                  onChange={(e) =>
                    set("draw_interval_minutes", Number(e.target.value) * 1440)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>첫 추첨 시작일시</Label>
                <Input
                  type="datetime-local"
                  value={form.draw_start_at}
                  onChange={(e) => set("draw_start_at", e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 2: 리워드 정책 */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground px-1">
                <span>일치 개수</span>
                <span>상금 (원)</span>
                <span>등수 라벨</span>
                <span />
              </div>
              {form.reward_policies.map((policy, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                  <Input
                    type="number"
                    value={policy.match_count}
                    onChange={(e) =>
                      updatePolicy(idx, "match_count", Number(e.target.value))
                    }
                  />
                  <Input
                    type="number"
                    value={policy.prize_amount}
                    onChange={(e) =>
                      updatePolicy(idx, "prize_amount", Number(e.target.value))
                    }
                  />
                  <Input
                    value={policy.prize_label}
                    onChange={(e) =>
                      updatePolicy(idx, "prize_label", e.target.value)
                    }
                    placeholder="1등"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePolicy(idx)}
                    className="text-destructive"
                  >
                    삭제
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addPolicy}>
                  + 행 추가
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPoliciesAtDefault(true)}
                >
                  초기화
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: 참여 기회 */}
          {step === 2 && (
            <>
              <p className="text-sm font-medium">무료 참여 기회</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>기간당 횟수</Label>
                  <Input
                    type="number"
                    value={form.free_chances_per_period}
                    onChange={(e) =>
                      set("free_chances_per_period", Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>기간 (분)</Label>
                  <Input
                    type="number"
                    value={form.free_chance_period_minutes}
                    onChange={(e) =>
                      set("free_chance_period_minutes", Number(e.target.value))
                    }
                  />
                </div>
              </div>
              <p className="text-sm font-medium mt-2">광고 시청 추가 기회</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>기간당 횟수</Label>
                  <Input
                    type="number"
                    value={form.ad_chances_per_period}
                    onChange={(e) =>
                      set("ad_chances_per_period", Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>기간 (분)</Label>
                  <Input
                    type="number"
                    value={form.ad_chance_period_minutes}
                    onChange={(e) =>
                      set("ad_chance_period_minutes", Number(e.target.value))
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 4: 검토 확인 */}
          {step === 3 && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-muted-foreground">프로젝트 이름</span>
                <span className="font-medium">{form.name || "-"}</span>
                <span className="text-muted-foreground">번호 범위</span>
                <span className="font-medium">
                  {form.number_min}~{form.number_max}, {form.pick_count}개 선택
                </span>
                <span className="text-muted-foreground">추첨 주기</span>
                <span className="font-medium">{form.draw_interval_minutes / 1440}일</span>
                <span className="text-muted-foreground">무료 기회</span>
                <span className="font-medium">
                  {form.free_chance_period_minutes}분마다 {form.free_chances_per_period}회
                </span>
                <span className="text-muted-foreground">광고 기회</span>
                <span className="font-medium">
                  {form.ad_chance_period_minutes}분마다 {form.ad_chances_per_period}회
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-muted-foreground">
                  리워드 정책 ({form.reward_policies.length}개)
                </p>
                {form.reward_policies.map((p, i) => (
                  <div key={i} className="flex gap-4">
                    <span>{p.prize_label || `${p.match_count}개 일치`}</span>
                    <span className="font-medium">
                      {p.prize_amount.toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          이전
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>다음</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "생성 중..." : "프로젝트 생성"}
          </Button>
        )}
      </div>
    </div>
  );
}
