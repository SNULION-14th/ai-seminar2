# NBA Game Night Log — 작업 라우터

`CODEX.md`는 프로젝트의 진입점이다. 상세 기획과 도메인별 규칙을 이 파일에 복제하지 않는다. 작업을 시작할 때 아래 공통 규칙을 확인한 뒤, 요청에 맞는 문서만 읽고 수정한다.

## 핵심 규칙

- 실제 NBA 경기·선수 데이터와 개인 관람 기억을 연결하는 **개인 시즌 아카이브**라는 제품 목적을 유지한다.
- MVP는 React 19, TypeScript, Vite 및 브라우저 `localStorage` 안에서 완결한다. 외부 백엔드·인증·DB는 범위 밖이다.
- 사용자 기록과 사진을 우선 보호한다. 사진은 개인 기록용이며, 텍스트만으로도 기록을 저장할 수 있어야 한다.
- 타입, 저장, 통계, UI 표현의 책임을 섞지 않는다. 구현 세부 규칙은 아키텍처·도메인 문서를 따른다.
- 기능 변경 후 `npm run lint`와 `npm run build`를 실행한다.

## 문서 색인

| 작업 유형 | 먼저 읽을 문서 | 다루는 내용 |
| --- | --- | --- |
| 제품 목적, 문제, MVP 범위, 차별화, 성공 기준 | [`docs/planning/service-plan.md`](docs/planning/service-plan.md) | 서비스 기획과 제품 의사결정 기준 |
| 사용자 흐름, 화면 구성, CTA, 시각 방향 | [`docs/planning/ux-and-screens.md`](docs/planning/ux-and-screens.md) | UX 원칙과 화면별 요구 사항 |
| 일기 필드, 결과·승률 계산, 사진·티켓 정책 | [`docs/rules/domain-rules.md`](docs/rules/domain-rules.md) | 도메인 모델과 데이터 규칙 |
| React 구조, 상태 흐름, 저장·이미지 처리, 접근성 | [`docs/rules/project-architecture.md`](docs/rules/project-architecture.md) | 구현 아키텍처와 검증 기준 |
| NBA/Figma/GitHub MCP 사용 및 PR 작성 | [`docs/rules/mcp-rules.md`](docs/rules/mcp-rules.md) | MCP 연결 원칙과 제출 규칙 |

## 빠른 라우팅

- 화면을 만들거나 고칠 때: `ux-and-screens.md` → `project-architecture.md` → 관련 도메인 규칙
- 관람 일기·사진·통계를 바꿀 때: `domain-rules.md` → `project-architecture.md` → `ux-and-screens.md`
- NBA 데이터 또는 MCP를 연결할 때: `mcp-rules.md` → `project-architecture.md` → `domain-rules.md`
- 제품 범위나 기능 우선순위를 정할 때: `service-plan.md` → `ux-and-screens.md`
- PR을 준비할 때: `mcp-rules.md`와 변경한 영역의 규칙 문서
