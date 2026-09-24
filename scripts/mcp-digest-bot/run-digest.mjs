#!/usr/bin/env node
// PR 다이제스트 봇: GitHub MCP 서버 + Discord MCP 서버를 함께 연결해서
// "GitHub 저장소의 최근 열린 PR 목록을 Discord 채널로 요약 알림"을 보내는 서비스입니다.
//
// 사용법:
//   node scripts/mcp-digest-bot/run-digest.mjs
//   DIGEST_OWNER=SNULION-14th DIGEST_REPO=ai-seminar2 DIGEST_LIMIT=5 node scripts/mcp-digest-bot/run-digest.mjs
//   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... node scripts/mcp-digest-bot/run-digest.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OWNER = process.env.DIGEST_OWNER || "SNULION-14th";
const REPO = process.env.DIGEST_REPO || "ai-seminar2";
const LIMIT = Number(process.env.DIGEST_LIMIT || 5);

async function connectServer(scriptPath, name) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [scriptPath],
    // 자식 프로세스(MCP 서버)에서도 fetch가 프록시 환경변수를 사용하도록 전달합니다.
    // (Node 내장 fetch는 기본적으로 HTTPS_PROXY 등을 무시하기 때문에 필요합니다.)
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
  });
  const client = new Client({ name: `${name}-client`, version: "1.0.0" });
  await client.connect(transport);
  return client;
}

async function main() {
  console.log(`[0/3] MCP 서버 두 개(GitHub, Discord)에 연결합니다...`);
  const githubClient = await connectServer(
    path.join(__dirname, "github-mcp-server.mjs"),
    "github",
  );
  const discordClient = await connectServer(
    path.join(__dirname, "discord-mcp-server.mjs"),
    "discord",
  );

  console.log(
    `[1/3] GitHub MCP 서버로 ${OWNER}/${REPO}의 열린 PR을 조회합니다...`,
  );
  const prResult = await githubClient.callTool({
    name: "list_open_pull_requests",
    arguments: { owner: OWNER, repo: REPO, limit: LIMIT },
  });

  if (prResult.isError) {
    console.error("PR 조회 실패:", prResult.content[0]?.text);
    await githubClient.close();
    await discordClient.close();
    process.exit(1);
  }

  const payload = JSON.parse(prResult.content[0].text);
  console.log(`[2/3] PR ${payload.count}건을 가져왔습니다. 메시지를 구성합니다...`);

  const lines = payload.pullRequests.map(
    (pr) => `#${pr.number} ${pr.title} — @${pr.author}\n${pr.url}`,
  );
  const messageBody =
    payload.count === 0
      ? `📭 **${OWNER}/${REPO}** 저장소에 열려 있는 PR이 없습니다.`
      : `📋 **${OWNER}/${REPO}** 열린 PR ${payload.count}건\n\n${lines.join("\n\n")}`;

  console.log(`[3/3] Discord MCP 서버로 메시지 전송을 요청합니다...`);
  const sendResult = await discordClient.callTool({
    name: "send_message",
    arguments: { content: messageBody },
  });

  console.log("\n--- 결과 ---");
  console.log(sendResult.content[0]?.text);
  console.log("\n--- 전송한 메시지 미리보기 ---");
  console.log(messageBody);

  await githubClient.close();
  await discordClient.close();
}

main().catch((err) => {
  console.error("다이제스트 봇 실행 중 오류:", err);
  process.exit(1);
});
