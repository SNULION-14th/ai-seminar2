#!/usr/bin/env bash
# TaskCompleted 품질 게이트 (docs/specs/agent-team.md §6)
# build/lint/test 중 하나라도 실패하면 exit 2로 작업 완료를 막고, 에러를 에이전트에게 돌려준다.
set -uo pipefail

cat > /dev/null # 훅 입력(stdin)은 쓰지 않는다
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

run() {
  local name="$1"
  shift
  local out
  if ! out=$("$@" 2>&1); then
    {
      echo "품질 게이트 실패: $name"
      echo "$out" | tail -40
      echo
      echo "고친 뒤에 작업을 완료로 표시하세요."
      echo "실패 원인이 다른 에이전트 담당 파일이면 담당자에게 [BLOCKED] 메시지를 보내세요 (docs/specs/agent-team.md §3, §4)."
    } >&2
    exit 2
  fi
}

run "npm run build" npm run build
run "npm run lint" npm run lint
if node -e "process.exit(require('./package.json').scripts?.test ? 0 : 1)"; then
  run "npm run test" npm run test -- --run
fi
exit 0
