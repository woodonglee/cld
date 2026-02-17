---
description: 변경사항을 분석하여 한국어 git 커밋을 생성합니다
argument-hint: [커밋 메시지 힌트 (선택)]
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
---

## Context

- 현재 상태: !`git status`
- 변경 내용 (staged + unstaged): !`git diff HEAD`
- 최근 커밋 스타일: !`git log --oneline -5`

## 작업

위 변경사항을 분석하여 git 커밋을 생성하세요.

**커밋 메시지 규칙:**
- 반드시 **한국어**로 작성
- 첫 줄: 변경 요약 (50자 이내, 명령형)
- 변경이 복잡하면 빈 줄 후 상세 설명 추가
- 마지막 줄: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

**인자 활용:** `$ARGUMENTS`가 있으면 커밋 메시지의 힌트로 활용합니다.

**주의 사항:**
- `.env`, 시크릿 파일은 절대 포함하지 않음
- 논리적으로 관련된 파일만 선별하여 `git add`
- HEREDOC 방식으로 커밋 메시지 작성

**HEREDOC 형식:**
```
git commit -m "$(cat <<'EOF'
커밋 메시지 첫 줄

상세 설명 (필요시)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

커밋 완료 후 `git status`로 결과를 확인합니다.
