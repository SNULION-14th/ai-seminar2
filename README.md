# 맞는 시간

Google Calendar의 빈 시간과 GitHub 작업 맥락을 한 화면에서 확인해 팀 미팅 시간을 정하는 일정 조율 서비스입니다.

## 주요 기능

- 팀원 전원이 가능한 시간대 3개를 우선 추천
- 선택한 시간으로 일정 생성 확인 흐름 제공
- 연결된 GitHub 레포의 이슈·PR 작업 맥락 표시
- 캘린더 상세 내용은 노출하지 않는 free/busy 중심 UX

## 실행

```bash
npm install
npm run dev
```

## MCP 연결

두 MCP를 사용합니다.

| MCP | 용도 |
| --- | --- |
| Google Calendar | 빈 시간 조회 및 일정 생성 |
| GitHub | 연결 레포의 이슈·PR 맥락 조회 |

`.agents/mcp_config.example.json`을 참고해 로컬 전용 `.agents/mcp_config.json`을 만드세요. 실제 OAuth Client Secret과 GitHub PAT은 절대 커밋하지 않습니다.

Google Calendar는 API 키가 아닌 OAuth 2.0이 필요합니다. Antigravity에서 `agy`를 실행한 뒤 `/mcp` 메뉴에서 `calendar`를 인증하세요.

## 웹앱 실제 연동

`vite.config.ts`의 로컬 API는 GitHub의 열린 작업을 조회하고, Google Calendar OAuth 완료 후 free/busy 조회와 일정 생성을 처리합니다. `.env.local.example`을 복사해 `.env.local`로 만들고 값을 입력하세요. 이 파일은 Git에서 제외됩니다.

Google OAuth 클라이언트에는 다음 리디렉션 URI를 등록해야 합니다.

```text
http://localhost:5174/api/calendar/callback
```

개발 서버를 켠 뒤 화면의 **Calendar 연결** 버튼을 누르면 Google 권한 승인 화면으로 이동합니다. API 키는 개인 일정 읽기·생성에 사용하지 않습니다.

```text
이번 주 참여자 전원이 가능한 30분을 찾아줘.
화요일 14:00–14:30으로 팀 싱크 미팅을 만들어줘.
```

## 과제 MCP 적용 내용

- Google Calendar MCP: `list_events`/`suggest_time`으로 후보 시간을 계산하고 `create_event`로 확정 일정을 생성합니다.
- GitHub MCP: 작업 중인 이슈·PR을 조회해 일정 조율 화면의 미팅 맥락으로 제공합니다.

> 현재 UI는 OAuth 연결 전에도 화면 흐름을 확인할 수 있도록 예시 데이터로 동작합니다. 실제 계정 데이터는 MCP OAuth 인증 후에만 불러와야 합니다.
