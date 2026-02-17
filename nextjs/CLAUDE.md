# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 및 커뮤니케이션 규칙
- **기본 응답 언어**: 한국어
- **코드 주석**: 한국어로 작성
- **커밋 메시지**: 한국어로 작성
- **문서화**: 한국어로 작성
- **변수명/함수명**: 영어 (코드 표준 준수)

## 주요 명령어

```bash
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행

npx shadcn add <component-name>   # shadcn/ui 컴포넌트 추가
```

## 프로젝트 구조

```
app/                      # Next.js App Router
├── layout.tsx            # 루트 레이아웃 (ThemeProvider, Header, Footer, Toaster 포함)
├── page.tsx              # 랜딩 페이지 (Hero → Features → CTA)
└── globals.css           # Tailwind v4 CSS-first 설정 및 CSS 변수 토큰
components/
├── ui/                   # shadcn/ui 기본 컴포넌트 (직접 수정 가능)
├── layout/               # Header, Footer, ThemeToggle
├── providers/            # ThemeProvider (next-themes 래퍼)
└── sections/             # 페이지 섹션 컴포넌트 (Hero, Features, CTA)
lib/
└── utils.ts              # cn() 유틸리티 (clsx + tailwind-merge)
```

## 아키텍처 핵심 사항

### 경로 별칭
`@/*`는 이 디렉토리(`nextjs/`) 루트를 가리킵니다.
예: `@/components/ui/button`, `@/lib/utils`

### Tailwind CSS v4 — CSS-first 설정
`tailwind.config.js` 파일이 **없습니다**. 모든 테마 토큰은 `app/globals.css`의 `@theme inline` 블록에서 CSS 변수로 정의됩니다. 테마를 수정할 때는 이 파일을 편집하세요.

### 다크 모드
`next-themes` + Tailwind의 `class` 전략을 사용합니다. `<html>` 태그에 `.dark` 클래스가 토글됩니다. `ThemeProvider`는 `app/layout.tsx`에서 최상위에 래핑되어 있습니다.

### shadcn/ui 설정
- 스타일: `new-york`
- 아이콘: `lucide-react`
- 컬러: CSS 변수 방식 (`cssVariables: true`)
- 베이스 색상: `neutral`
- `components/ui/` 파일은 직접 수정 가능 (shadcn/ui는 소유권 이전 방식)

### 주요 의존성
- **폼**: `react-hook-form` + `zod` (resolver 포함)
- **토스트**: `sonner` (`<Toaster />`가 루트 레이아웃에 포함)
- **백엔드**: `@supabase/supabase-js` (설정 대기 중)
- **애니메이션**: `tw-animate-css`
