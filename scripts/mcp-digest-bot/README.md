# PR 다이제스트 봇 (GitHub MCP + Discord MCP)

두 개의 서로 다른 MCP(Model Context Protocol) 서버를 직접 만들어 연결하고,
하나의 클라이언트(오케스트레이터)가 두 서버를 함께 사용해서
"GitHub 저장소의 최근 열린 PR 목록을 Discord 채널로 요약 알림"을 보내는 간단한 서비스입니다.

## 구성

| 파일 | 역할 |
| --- | --- |
| `github-mcp-server.mjs` | GitHub 공개 REST API로 특정 저장소의 열린 PR 목록을 조회하는 MCP 서버. `list_open_pull_requests({ owner, repo, limit })` 툴 하나를 제공합니다. |
| `discord-mcp-server.mjs` | Discord 웹훅으로 메시지를 전송하는 MCP 서버. `send_message({ content })` 툴 하나를 제공합니다. `DISCORD_WEBHOOK_URL` 환경변수가 없으면 실제 전송 대신 `last-digest.json`에 결과를 기록하는 dry-run 모드로 동작합니다. |
| `run-digest.mjs` | 클라이언트 역할을 하는 오케스트레이터. `StdioClientTransport`로 위 두 MCP 서버를 자식 프로세스로 각각 띄우고 연결한 뒤, GitHub MCP 서버의 툴로 PR 목록을 가져와 메시지를 구성하고 Discord MCP 서버의 툴로 전송을 요청합니다. |

## MCP를 사용한 목적

- **GitHub MCP 서버**: 외부 데이터 소스(GitHub PR 목록)를 표준화된 MCP 툴 인터페이스로 감싸서, 클라이언트가 GitHub API의 세부 구현을 몰라도 `list_open_pull_requests` 툴 하나만 호출하면 되도록 하기 위함입니다.
- **Discord MCP 서버**: 알림 전송(Discord 웹훅)이라는 별도의 관심사를 또 다른 MCP 서버로 분리해서, 오케스트레이터가 "PR을 조회하는 방법"과 "메시지를 보내는 방법"을 서로 독립적으로 조합할 수 있도록 하기 위함입니다. 두 서버가 완전히 독립적이므로 Discord 서버만 Slack 서버로 교체해도 오케스트레이터 로직은 거의 그대로 재사용할 수 있습니다.

## 실행 방법

```bash
# 기본값 (SNULION-14th/ai-seminar2, 최근 5건) 으로 dry-run 실행
npm run digest

# 저장소/개수 직접 지정
DIGEST_OWNER=SNULION-14th DIGEST_REPO=ai-seminar2 DIGEST_LIMIT=3 npm run digest

# 실제 Discord 채널로 전송하고 싶다면 웹훅 URL을 지정
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... npm run digest
```

이번 과제 제출에서는 실제 Discord 웹훅 URL 없이 **dry-run 모드**로만 실행했습니다.
`DISCORD_WEBHOOK_URL`이 없을 때는 실제 네트워크 요청 대신
`scripts/mcp-digest-bot/last-digest.json` 파일에 전송될 메시지를 기록합니다
(이 파일은 실행할 때마다 새로 생성되므로 `.gitignore`에 포함되어 있습니다).

## 동작 확인 예시

```
[0/3] MCP 서버 두 개(GitHub, Discord)에 연결합니다...
[1/3] GitHub MCP 서버로 SNULION-14th/ai-seminar2의 열린 PR을 조회합니다...
[2/3] PR 5건을 가져왔습니다. 메시지를 구성합니다...
[3/3] Discord MCP 서버로 메시지 전송을 요청합니다...

--- 결과 ---
DISCORD_WEBHOOK_URL이 설정되지 않아 dry-run으로 동작했습니다. last-digest.json에 기록했습니다.

--- 전송한 메시지 미리보기 ---
📋 **SNULION-14th/ai-seminar2** 열린 PR 5건

#12 week3-hw-jw — @imwo05
https://github.com/SNULION-14th/ai-seminar2/pull/12
...
```
