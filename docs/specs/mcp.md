# MCP 활용 계획

> Status: **Approved** (2026-09-24) · 마일스톤: 셋업 (등록), M1-M3 (상시 사용), M1 이후 (Calendar 데모)
> 과제 조건: MCP 2개 이상 사용, **Figma MCP와 GitHub MCP는 개수에서 제외**

## 1. 요약

| # | MCP | 쓰는 곳 | 역할 | 사용하는 에이전트 |
| --- | --- | --- | --- | --- |
| 1 | **Context7** (`@upstash/context7-mcp`) | 개발 | 라이브러리 최신 문서 조회 (React 19, Vite 8, react-router v7, zustand, react-leaflet 등) | 모든 구현 에이전트 |
| 2 | **Playwright MCP** (`@playwright/mcp`) | 개발 | 실제 브라우저로 화면을 띄워 수용 기준 검증, 모바일 뷰포트 스크린샷, 인터랙션 확인 | qa |
| 3 | **Google Calendar MCP** (claude.ai 커넥터, 연결됨) | 데모 | 계획 결과(DayPlan)를 Claude가 읽고 실제 캘린더에 일정을 만드는 시연 | Lead |

1과 2만으로도 과제 조건(2개 이상)을 채우고, 3은 데모로 추가한다. 자체 MCP 서버는 만들지 않는다.

## 2. 개발 MCP 등록

팀원과 평가자가 같은 환경을 재현할 수 있도록 **프로젝트 스코프 `.mcp.json`** 에 등록하고 커밋한다. 에이전트 팀이 시작할 때 이미 MCP가 연결되어 있어야 하므로, M0보다 먼저 팀 셋업 단계에서 등록한다(완료).

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": [
        "-y", "@playwright/mcp@latest",
        "--viewport-size", "390x844",
        "--isolated",
        "--output-dir", "docs/verification"
      ]
    }
  }
}
```

- `--viewport-size 390x844`: 기준 모바일 뷰포트 (`@playwright/mcp --help`로 형식 확인함)
- `--isolated`: 브라우저 프로필을 메모리에만 두어 매번 깨끗한 localStorage에서 검증한다
- `--output-dir docs/verification`: 이름을 지정하지 않은 스크린샷이 증빙 폴더에 저장된다

## 3. 사용 규칙 (CLAUDE.md에서 참조)

### Context7

- `src/`에서 **처음 쓰는 라이브러리 API**나 **메이저 버전이 바뀐 API**(React 19, react-router v7, Vite 8, react-leaflet)를 쓰기 전에 Context7으로 문서를 조회한다.
- 조회한 내용이 스펙 결정에 영향을 주면 해당 스펙의 결정 로그에 근거를 남긴다.

### Playwright MCP

- 기능 하나를 구현하면 해당 스펙의 **수용 기준 체크리스트를 Playwright MCP로 검증**한 뒤 `[x]`로 체크한다.
- 뷰포트 390×844 기준으로 스크린샷을 찍어 `docs/verification/<spec>-<id>.png`에 저장한다(과제 증빙). 예: `feature-track-TRK-10.png`
- 트래킹 검증은 GPS 대신 시뮬레이션 모드(`?sim=1`, TRK-10)로 한다.
- 디자인 인터랙션(DS-01부터 DS-06)은 스크롤/드래그/클릭 전후 스크린샷을 비교한다.
- 브라우저 세션이 하나뿐이므로 **Playwright MCP는 qa 에이전트만 사용**한다. 다른 에이전트는 qa에게 검증을 요청한다([agent-team.md](agent-team.md) §4).

### Google Calendar MCP (데모)

- M1(계획) 완료 후 Lead가 진행한다.
- 시나리오: 앱에서 계획 생성 → "계획 JSON 복사"(PLAN-10) → Claude에게 "이 일정 내 캘린더에 넣어줘" → Calendar MCP가 일자별 종일 이벤트를 만든다(제목: `[강따라 633] DAY n 출발→도착`, 설명: 거리·상승고도·숙박 거점).
- 이벤트를 만들기 전에 대상 캘린더와 이벤트 목록을 사용자에게 보여 주고 확인받는다. 데모가 끝나면 사용자가 원할 때 삭제한다.
- 앱 자체의 `.ics` 내보내기(PLAN-08)와 별개이며, MCP 활용 사례로 쓴다.

## 4. 증빙 (과제 제출용)

- `.mcp.json` (커밋)
- `docs/verification/` 스크린샷 (Playwright MCP)
- 각 스펙 결정 로그에 남긴 Context7 조회 근거
- `docs/verification/calendar-demo.md`: Calendar MCP 데모 기록(요청 프롬프트, 생성된 이벤트 목록, 캡처)

## 5. 수용 기준

- [ ] `.mcp.json`이 커밋되어 있고 `claude mcp list`에서 context7, playwright가 Connected로 나온다
- [ ] Playwright MCP로 `npm run dev` 화면을 390×844로 캡처할 수 있다
- [ ] Calendar MCP로 계획 일수만큼 이벤트가 생성되고 `calendar-demo.md`에 기록되어 있다

## 6. 결정 로그

| 날짜 | 결정 |
| --- | --- |
| 2026-09-24 | 필수 MCP: Context7, Playwright. 데모 MCP: Google Calendar |
| 2026-09-24 | 자체 MCP 서버(`gangttara-mcp`)는 만들지 않는다 |
