import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// 행동 유도(CTA) 섹션
export function CTA() {
  return (
    <section id="cta" className="py-20 md:py-28 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground md:px-16">
          {/* 배경 장식 */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          </div>

          {/* 텍스트 */}
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            지금 바로 시작하세요
          </h2>
          <p className="mt-4 text-lg opacity-80 max-w-xl mx-auto">
            이 스타터킷을 클론하고 5분 안에 프로젝트를 시작하세요.
            설정은 저희가 다 해뒀습니다.
          </p>

          {/* CTA 버튼 */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2"
              asChild
            >
              <Link href="#features">
                기능 다시 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub 클론하기
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
