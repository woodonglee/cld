import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { CTA } from "@/components/sections/CTA";

// 랜딩 페이지 — Hero → Features → CTA 순서로 섹션 조합
export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <CTA />
    </>
  );
}
