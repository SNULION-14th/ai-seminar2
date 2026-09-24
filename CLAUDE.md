# CLAUDE.md — 강따라 633 라우터

자전거 국토종주(인천→부산 약 633km) 라이더를 위한 **계획 · 트래킹 · 공유** 웹서비스.
이 파일은 **라우터**다. 상세 내용은 여기에 쓰지 않고 `docs/specs/`의 스펙으로 연결한다.

## 1. 개발 방식: Spec-Driven Development

1. **스펙이 먼저다.** 코드를 쓰기 전에 아래 라우팅 표에서 관련 스펙을 읽는다.
2. **Status를 확인한다.** 스펙 상단의 `Status`가 `Approved`인 것만 구현한다. `Draft`이면 구현하지 말고 사용자 리뷰를 요청한다.
3. **스펙에 없는 결정은 스펙부터 고친다.** 새 라이브러리, 새 화면, 요구사항 변경은 해당 스펙을 먼저 수정하고 사용자 확인을 받는다.
4. **수용 기준으로 끝낸다.** 구현이 끝나면 스펙의 수용 기준을 하나씩 검증하고(단위 테스트 또는 Playwright MCP) `[x]`로 체크한다. 전부 체크되면 Status를 `Implemented`로 바꾼다.
5. **요구사항 ID를 인용한다.** 커밋 메시지와 코드 주석에서 `PLAN-02`, `TRK-10`처럼 ID로 스펙을 가리킨다.

Status 흐름: `Draft` → (사용자 리뷰) → `Approved` → (구현 + 수용 기준 통과) → `Implemented`

## 2. 라우팅 표

| 이런 작업을 할 때 | 먼저 읽을 스펙 |
| --- | --- |
| 제품 방향, 범위, 마일스톤, non-goals 확인 | [docs/specs/cross-country-tour.md](docs/specs/cross-country-tour.md) |
| 색·폰트·모션·컴포넌트 스타일, 인터랙션(DS-*) | [docs/specs/design-system.md](docs/specs/design-system.md) |
| 구간·인증센터 데이터, 타입, 도메인 함수 | [docs/specs/domain-data.md](docs/specs/domain-data.md) |
| 기술 스택, 폴더 구조, 라우트, 저장소, 라이브러리 추가 | [docs/specs/architecture.md](docs/specs/architecture.md) |
| 일정 생성, 고도 프로필, 체크리스트, .ics (PLAN-*) | [docs/specs/feature-plan.md](docs/specs/feature-plan.md) |
| GPS 기록, 도장, 진행률, 시뮬레이션 모드 (TRK-*) | [docs/specs/feature-track.md](docs/specs/feature-track.md) |
| 기록 화면, 공유 카드, 공유 링크, 백업 (SHR-*) | [docs/specs/feature-share.md](docs/specs/feature-share.md) |
| MCP 사용 규칙, 검증 절차, Calendar 데모 | [docs/specs/mcp.md](docs/specs/mcp.md) |
| 에이전트 팀(A2A) 운영, 파일 담당 범위, 메시지 규약, 작업 목록 | [docs/specs/agent-team.md](docs/specs/agent-team.md) |

UI 작업은 기능 스펙과 `design-system.md`를 **함께** 읽는다.

## 3. 절대 규칙

- 색·간격·반경은 `src/styles/tokens.css` 토큰으로만 쓴다. 컴포넌트에 hex 값을 직접 쓰지 않는다.
- `src/domain/`은 React·DOM·브라우저 API를 import하지 않는다(순수 함수 + vitest).
- 서버, 로그인, 외부 DB를 추가하지 않는다(non-goal).
- 공유 URL payload는 신뢰할 수 없는 입력이다. zod로 검증하고 `innerHTML`을 쓰지 않는다.
- 모든 연속 애니메이션은 `prefers-reduced-motion`을 존중한다.
- 모바일 390×844가 기준 뷰포트다.
- 서비스는 한국어 전용이다. UI 문구는 한국어 해요체로 쓰고, 날짜·숫자는 `ko-KR` 형식을 쓴다.

## 4. MCP 사용 (상세: [mcp.md](docs/specs/mcp.md))

- **Context7**: 처음 쓰는 라이브러리 API나 메이저 버전이 바뀐 API(React 19, react-router v7, Vite 8, react-leaflet)는 쓰기 전에 문서를 조회한다.
- **Playwright MCP**: 기능을 구현하고 나면 수용 기준을 브라우저에서 검증하고 스크린샷을 `docs/verification/`에 저장한다. 트래킹은 `?sim=1` 시뮬레이션으로 검증한다. 에이전트 팀에서는 qa만 사용한다.
- **Google Calendar MCP**: M1 이후 Lead가 계획을 캘린더에 넣는 데모를 진행한다.

## 5. 에이전트 팀 (상세: [agent-team.md](docs/specs/agent-team.md))

- 기능 구현은 Agent Teams로 병렬 진행한다. 팀원 정의는 `.claude/agents/`에 있다.
- 이 세션이 Lead라면: 기능 코드를 직접 쓰지 않고 작업 배정, 스펙 관리, 커밋(사용자 확인 후)을 맡는다.
- 팀원이라면: 담당 파일만 수정하고, 다른 팀원과는 agent-team.md §4 규약으로 직접 대화한다. git commit은 하지 않는다.

## 6. 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 타입체크 + 빌드
npm run lint     # ESLint
npm run test     # vitest (M0에서 추가 예정)
```

## 7. 인덱스 유지

새 스펙 문서를 추가하거나 이름을 바꾸면 **같은 작업 안에서** 위 라우팅 표를 갱신한다.
