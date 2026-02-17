import Link from "next/link";
import { Separator } from "@/components/ui/separator";

// 3컬럼 푸터 + 저작권 표시
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* 3컬럼 그리드 */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* 브랜드 컬럼 */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">
              <span className="text-primary">Starter</span>
              <span className="text-muted-foreground">Kit</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              모던 웹 개발을 위한 범용 스타터킷. Next.js + shadcn/ui + Tailwind CSS.
            </p>
          </div>

          {/* 링크 컬럼 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">링크</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  홈
                </Link>
              </li>
              <li>
                <Link href="#features" className="transition-colors hover:text-foreground">
                  기능
                </Link>
              </li>
              <li>
                <Link href="#cta" className="transition-colors hover:text-foreground">
                  시작하기
                </Link>
              </li>
            </ul>
          </div>

          {/* 리소스 컬럼 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">리소스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Next.js 문서
                </a>
              </li>
              <li>
                <a
                  href="https://ui.shadcn.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  shadcn/ui
                </a>
              </li>
              <li>
                <a
                  href="https://tailwindcss.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Tailwind CSS
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* 저작권 */}
        <p className="text-center text-sm text-muted-foreground">
          © {currentYear} StarterKit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
