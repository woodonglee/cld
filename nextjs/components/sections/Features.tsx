import {
  Zap,
  Palette,
  Shield,
  Layers,
  Smartphone,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 기능 카드 데이터
const features = [
  {
    icon: Zap,
    title: "빠른 성능",
    description:
      "Next.js 16 App Router와 React 19 기반. 서버 컴포넌트로 초기 로딩 속도를 극대화합니다.",
  },
  {
    icon: Palette,
    title: "다크모드",
    description:
      "next-themes로 구현된 SSR 안전 다크모드. 시스템 설정을 자동 감지합니다.",
  },
  {
    icon: Shield,
    title: "폼 유효성 검증",
    description:
      "Zod + react-hook-form + shadcn Form의 완벽한 통합. 타입 안전한 폼 처리를 제공합니다.",
  },
  {
    icon: Layers,
    title: "4레이어 아키텍처",
    description:
      "Foundation → UI → Composite → Section → Page의 명확한 컴포넌트 계층 구조를 따릅니다.",
  },
  {
    icon: Smartphone,
    title: "완전 반응형",
    description:
      "모바일 우선 설계. 모든 화면 크기에서 최적의 사용자 경험을 제공합니다.",
  },
  {
    icon: Code2,
    title: "TypeScript",
    description:
      "엄격한 TypeScript 설정으로 타입 안전성을 보장합니다. IDE 자동완성과 에러 조기 감지를 지원합니다.",
  },
];

// 기능 카드 그리드 섹션 — 6개 lucide 아이콘 + Card
export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            핵심 기능
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            프로덕션 수준의 웹 앱 개발에 필요한 모든 것이 준비되어 있습니다.
          </p>
        </div>

        {/* 6개 기능 카드 그리드 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
