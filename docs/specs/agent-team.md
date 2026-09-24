# 에이전트 팀 (A2A) 운영 스펙

> Status: **Approved** (2026-09-24) · 관련: [cross-country-tour.md](cross-country-tour.md), [mcp.md](mcp.md)

## 1. 방식

- Claude Code **Agent Teams**(실험 기능)를 쓴다. `.claude/settings.json`의 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`로 켠다.
- 공유 작업 목록 도구(`TaskCreate`/`TaskGet`/`TaskList`/`TaskUpdate`)는 일부 구형 모델에서만 기본으로 켜진다. 다른 모델(예: Opus 5.5)에서는 `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`이 있어야 한다(settings.json에 설정함). 이 도구가 없으면 §6 `TaskCompleted` 품질 게이트도 동작하지 않는다.
- **Lead** = 사용자가 실행한 메인 세션. 팀원을 띄우고, 공유 작업 목록을 관리하고, 스펙을 지킨다. 기능 코드는 직접 쓰지 않는다.
- **팀원** = `.claude/agents/*.md`에 정의한 에이전트 타입으로 띄운다.
- 팀원끼리는 Lead를 거치지 않고 `SendMessage`로 **직접** 대화한다(A2A). 작업 상태는 공유 작업 목록(`TaskCreate`/`TaskUpdate`/`TaskList`)으로 맞춘다.
- 모든 팀원은 **같은 작업 트리**에서 일한다. 충돌은 §3의 파일 담당 범위로 막는다. worktree는 쓰지 않는다.

## 2. 팀 구성과 단계

| 단계 | 팀원 (에이전트 타입) | 모델 | 맡는 스펙 |
| --- | --- | --- | --- |
| 1 | `foundation` | opus | M0: [architecture.md](architecture.md), [domain-data.md](domain-data.md), 디자인 토큰 |
| 2 | `ui-kit` | opus | [design-system.md](design-system.md) DS-01부터 DS-06, 홈 화면 |
| 2 | `plan` | sonnet | [feature-plan.md](feature-plan.md) PLAN-* |
| 2 | `track` | sonnet | [feature-track.md](feature-track.md) TRK-* |
| 2 | `share` | sonnet | [feature-share.md](feature-share.md) SHR-* |
| 2 | `qa` | sonnet | 모든 스펙의 수용 기준 검증 (Playwright MCP) |
| 3 | Lead | - | Calendar MCP 데모, 통합 확인, A2A 로그 정리, Status 갱신 |

- 1단계는 foundation 혼자 작업한다. 공통 기반(타입, 스토어, 라우트)이 없으면 2단계가 서로 충돌하기 때문이다.
- 2단계 팀원은 5명이다(공식 권장 규모 3-5명).
- 모델은 팀원을 띄울 때 Lead가 프롬프트로 바꿀 수 있다.

## 3. 파일 담당 범위

담당자만 파일을 수정한다. 다른 사람 파일이 바뀌어야 하면 담당자에게 `[NEED]` 메시지를 보낸다.

| 경로 | 담당 | 비고 |
| --- | --- | --- |
| `package.json`, `index.html`, 설정 파일(vite, ts, eslint) | foundation → 2단계부터 Lead | 의존성 추가는 [architecture.md](architecture.md) 갱신이 먼저다 |
| `src/main.tsx`, `src/App.tsx`(라우트, 탭 바) | foundation → 2단계부터 Lead | foundation이 모든 라우트를 `features/*/index.tsx`에 연결해 두므로 2단계에서는 고칠 일이 거의 없다 |
| `src/styles/tokens.css`, `global.css` | foundation → 2단계부터 ui-kit | |
| `src/data/**` | foundation → 2단계부터 Lead | 초안 데이터 |
| `src/domain/types.ts`, `geo.ts`, `progress.ts` | foundation → 2단계부터 Lead | **계약 파일**. 변경은 `[SPEC-Q]`로 Lead에게 요청한다 |
| `src/domain/itinerary.ts` (+test) | plan | |
| `src/domain/tracking.ts` (+test) | track | GPS 점 필터링·샘플링 |
| `src/domain/share-codec.ts` (+test) | share | |
| `src/store/plan.ts` | plan | foundation이 골격을 만든다 |
| `src/store/ride.ts`, `src/store/stamps.ts` | track | foundation이 골격을 만든다 |
| `src/components/**`, `src/features/home/**` | ui-kit | 공용 컴포넌트 |
| `src/features/plan/**` | plan | |
| `src/features/track/**` | track | |
| `src/features/share/**` | share | 기록 화면(`#/journal`) + 공유 페이지(`#/s/:payload`) |
| `docs/specs/*.md` 본문 | Lead | |
| `docs/specs/*.md` 수용 기준 체크박스 | qa | `[ ]` → `[x]`만 바꾼다 |
| `docs/verification/**` | qa (Calendar 데모 기록은 Lead) | |

- 팀원은 **git commit을 하지 않는다**. 스테이징 영역을 공유하기 때문이다. 커밋은 Lead가 사용자 확인을 받고 마일스톤 단위로 한다.

## 4. A2A 메시지 규약

### 형식

```text
[태그] 요구사항 ID
요약: 한 줄
상세: 파일 경로, 공개 API(시그니처/props), 재현 절차 등
```

- 코드를 통째로 붙이지 않는다. 파일 경로와 시그니처만 쓴다.
- 받은 쪽은 `[NEED]`, `[READY-FOR-QA]`, `[QA-FAIL]`에 반드시 답한다.

### 태그

| 태그 | 보내는 쪽 → 받는 쪽 | 언제 |
| --- | --- | --- |
| `[CONTRACT]` | 제공자 → 사용하는 쪽 | 공용 컴포넌트 props, 스토어 selector/action이 확정되거나 바뀌었을 때 |
| `[NEED]` | 요청자 → 담당자 | 남의 파일에 기능이 필요할 때 (예: plan → ui-kit "RidgeProfile에 일자 경계선 prop 필요") |
| `[READY-FOR-QA]` | 구현자 → qa | 요구사항 구현과 단위 테스트를 마쳤을 때. 확인 URL과 데이터 준비 방법을 적는다 |
| `[QA-PASS]` / `[QA-FAIL]` | qa → 구현자 | 검증 결과. FAIL이면 실패한 수용 기준, 재현 절차, 스크린샷 경로를 적는다 |
| `[BLOCKED]` | 누구든 → 원인 담당자 (해결 안 되면 Lead) | 다른 사람 코드 때문에 빌드/테스트가 깨지거나 진행이 막힐 때 |
| `[SPEC-Q]` | 누구든 → Lead | 스펙 해석이 애매하거나, 계약 파일·스펙 변경이 필요할 때 |

### 예상되는 주요 대화

| 흐름 | 내용 |
| --- | --- |
| ui-kit → plan, share | `[CONTRACT]` RidgeProfile props (DS-02 → PLAN-04, SHR-01) |
| ui-kit → plan | `[CONTRACT]` PebbleHandle 드래그 이벤트 (DS-06 → PLAN-05) |
| ui-kit → track, share | `[CONTRACT]` Stamp, WaveProgress (DS-03, DS-04 → TRK-06, SHR-01) |
| plan → track | `[CONTRACT]` 오늘의 DayPlan selector (PLAN-09 → TRK-07) |
| track → share | `[CONTRACT]` Ride/Stamp 스토어 selector (TRK-11 → SHR-01) |
| 구현자 ↔ qa | `[READY-FOR-QA]` → `[QA-FAIL]` → 수정 → `[READY-FOR-QA]` → `[QA-PASS]` |

제공자가 아직 끝내지 않았으면 사용하는 쪽은 임시 컴포넌트로 먼저 진행하고, `[CONTRACT]`를 받으면 교체한다.

## 5. 공유 작업 목록

Lead가 팀 시작 시 아래 작업을 `TaskCreate`로 만들고 의존관계를 건다.

| ID | 작업 | 담당 | 선행 작업 |
| --- | --- | --- | --- |
| F1 | 의존성 설치, 템플릿 제거, `index.html`(ko), 라우트 5개 + 탭 바 + 빈 페이지, vitest와 `npm run test` | foundation | - |
| F2 | `tokens.css`, `global.css`, 웹폰트 (DS §2) | foundation | F1 |
| F3 | `src/data`: 구간, 인증센터(초안), 경로 polyline | foundation | F1 |
| F4 | `src/domain`: types, geo(haversine, snapToRoute, nextCenter), progress + 테스트 | foundation | F3 |
| F5 | `src/store` 골격(plan, ride, stamps, activeRide) + persist/version | foundation | F4 |
| U1-U6 | DS-01부터 DS-06 컴포넌트 (U1은 홈 화면 포함) | ui-kit | F2, F5 |
| P1 | `itinerary.ts` + 테스트 (PLAN-02) | plan | F5 |
| P2 | 계획 화면 (PLAN-01, 03, 04, 09) | plan | P1 |
| P3 | 경계 드래그 (PLAN-05) | plan | P2, U6 |
| P4 | 부분 계획, 체크리스트, .ics, JSON 복사 (PLAN-06, 07, 08, 10) | plan | P2 |
| T1 | `tracking.ts` + 시뮬레이터 (TRK-02, TRK-10) | track | F5 |
| T2 | 트래킹 화면, 상태 머신, 지도 (TRK-01, 03, 04, 08, 11, 12, 13) | track | T1 |
| T3 | 도장 (TRK-06) | track | T2, U3 |
| T4 | 경로 이탈, 계획 연동, 화면 켜짐 유지 (TRK-05, 07, 09) | track | T2, P1 |
| S1 | `share-codec.ts` + 테스트 (SHR-04) | share | F5 |
| S2 | 기록 화면 (SHR-01) | share | F5 |
| S3 | 공유 카드 (SHR-02, 03, 06, 07) | share | S2 |
| S4 | 공유 페이지 (SHR-05) | share | S1 |
| S5 | 완주 연출, 백업 (SHR-08, 09) | share | S2, T3 |
| Q1 | design-system 수용 기준 검증 | qa | U1-U6 |
| Q2 | feature-plan 수용 기준 검증 | qa | P1-P4 |
| Q3 | feature-track 수용 기준 검증 | qa | T1-T4 |
| Q4 | feature-share 수용 기준 검증 | qa | S1-S5 |
| Q5 | 전체 흐름 E2E (계획 → 시뮬레이션 트래킹 → 공유, 새로고침 포함) | qa | Q1-Q4 |
| L1 | Google Calendar MCP 데모 → `docs/verification/calendar-demo.md` | Lead | Q2 |
| L2 | A2A 로그 정리 → `docs/verification/a2a-log.md`, 스펙 Status를 `Implemented`로 갱신 | Lead | Q5 |

## 6. 품질 게이트

- `TaskCompleted` 훅(`.claude/hooks/task-completed-gate.sh`)이 작업을 완료로 표시할 때마다 `npm run build`, `npm run lint`, `npm run test`를 돌린다. 실패하면 exit 2로 완료를 막고, 에러를 팀원에게 돌려준다.
- 실패 원인이 다른 팀원 담당 파일이면 그 담당자에게 `[BLOCKED]`를 보낸다.
- 구현 팀원은 qa의 `[QA-PASS]`를 받은 뒤에 기능 작업을 완료로 표시한다. 단위 테스트만으로 검증이 끝나는 작업(P1, T1, S1 등)은 예외다.

## 7. 실행 절차

1. **터미널**에서 프로젝트 루트로 이동해 `claude`를 실행한다. 설정 변경을 적용하려면 새 세션이어야 한다. VSCode 확장에서 이 기능이 되는지는 확인되지 않았다.
2. 프로젝트 MCP(context7, playwright) 승인 프롬프트가 뜨면 승인한다. `/mcp`로 연결 상태를 확인한다.
3. Lead에게 1단계를 지시한다.

   ```text
   docs/specs/agent-team.md대로 에이전트 팀을 시작해줘.
   §5의 작업 목록을 공유 작업 목록에 선행관계와 함께 만들고,
   1단계로 foundation 에이전트 타입 팀원 1명을 띄워 F1-F5를 맡겨줘.
   ```

4. F1-F5가 끝나면 2단계를 지시한다.

   ```text
   2단계 팀원 5명을 ui-kit, plan, track, share, qa 에이전트 타입으로 띄우고
   §5의 담당 작업을 배정해줘. 팀원끼리는 §4 규약대로 직접 메시지를 주고받게 해줘.
   ```

5. Q2가 끝나면 L1(Calendar 데모), Q5가 끝나면 L2(로그 정리)를 Lead가 진행한다. **L2는 팀을 정리(cleanup)하기 전에** 한다. 팀 메일박스(`~/.claude/teams/<팀이름>/inboxes/`)가 증빙 원본이다.

## 8. 수용 기준

- [x] 2단계에서 팀원 5명이 동시에 작업했다
- [x] `docs/verification/a2a-log.md`에 `[CONTRACT]`, `[READY-FOR-QA]`, `[QA-FAIL]` 또는 `[QA-PASS]` 메시지가 각각 1건 이상 기록되어 있다
- [ ] 기능 스펙 4개(design-system, feature-plan, feature-track, feature-share)의 Status가 `Implemented`이다
- [x] 최종 상태에서 `npm run build`, `npm run lint`, `npm run test`가 통과한다

## 9. 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 실험 기능이라 `/resume`으로 in-process 팀원이 복구되지 않는다 | 마일스톤마다 Lead가 사용자 확인 후 커밋한다. 세션이 끊기면 남은 작업만 다시 배정한다 |
| 팀원이 작업 완료 표시를 빠뜨려 뒤 작업이 막힌다 | Lead가 주기적으로 `TaskList`를 확인하고 해당 팀원에게 확인을 요청한다 |
| 토큰 비용이 팀원 수에 비례해서 늘어난다 | 구현 팀원은 sonnet으로 시작한다. 1단계는 foundation 1명만 띄운다 |
| 여러 팀원이 동시에 고친 코드 때문에 빌드가 깨진다 | §3 담당 범위를 지키고, §6 게이트에서 막힌 경우 `[BLOCKED]`로 담당자에게 알린다 |
| Playwright 브라우저 세션이 하나뿐이다 | Playwright MCP는 qa만 사용한다 |
| 게이트가 작업 트리 전체를 검사해서, 한 팀원의 lint 에러가 모든 팀원의 완료 표시를 막는다 | 팀원은 자기 파일을 저장한 채 다른 작업으로 넘어가기 전에 `npm run lint` 0건을 유지한다. 원인이 남의 파일이면 `[BLOCKED]`를 보내고 기다린다 |
