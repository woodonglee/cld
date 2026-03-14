import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next.js + TypeScript ESLint 설정
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 기본 무시 경로 설정
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
