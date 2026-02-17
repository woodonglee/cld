import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// 히어로 섹션 — 배지 + 헤드라인 + 서브타이틀 + CTA 버튼
export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center py-24 md:py-36 text-center px-4">
      {/* 배경 그라디언트 블러 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* 배지 */}
      <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-sm">
        <Sparkles className="h-3.5 w-3.5" />
        모던 웹 스타터킷 v1.0
      </Badge>

      {/* 헤드라인 */}
      <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl max-w-4xl">
        빠르게 시작하는{" "}
        <span className="text-primary">모던 웹</span> 개발
      </h1>

      {/* 서브타이틀 */}
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
        Next.js 16 + shadcn/ui + Tailwind CSS v4로 구성된 범용 스타터킷.
        다크모드, 반응형 레이아웃, 접근성까지 한 번에 시작하세요.
      </p>

      {/* CTA 버튼 */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="gap-2" asChild>
          <Link href="#features">
            기능 살펴보기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub에서 보기
          </a>
        </Button>
      </div>
    </section>
  );
}
