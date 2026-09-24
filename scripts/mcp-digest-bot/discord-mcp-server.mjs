#!/usr/bin/env node
// Discord MCP 서버 (커스텀 구현)
// - Discord 웹훅으로 메시지를 보내는 도구 하나를 제공하는 최소한의 MCP 서버입니다.
// - DISCORD_WEBHOOK_URL 환경변수가 설정되어 있지 않으면 실제 전송 대신
//   dry-run 모드로 동작하며, 결과를 last-digest.json 파일에 기록합니다.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIGEST_LOG_PATH = path.join(__dirname, "last-digest.json");

const server = new McpServer({
  name: "discord-notifier-mcp",
  version: "1.0.0",
});

server.registerTool(
  "send_message",
  {
    title: "Send a Discord message",
    description:
      "Discord 채널로 메시지를 보냅니다. DISCORD_WEBHOOK_URL 환경변수가 없으면 " +
      "dry-run 모드로 동작하며, 실제 전송 대신 last-digest.json에 기록합니다.",
    inputSchema: {
      content: z.string().describe("전송할 메시지 본문 (Discord 마크다운)"),
    },
  },
  async ({ content }) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const record = {
      sentAt: new Date().toISOString(),
      content,
      mode: webhookUrl ? "live" : "dry-run",
    };

    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const text = await res.text();
        return {
          content: [
            { type: "text", text: `Discord 전송 실패 (${res.status}): ${text}` },
          ],
          isError: true,
        };
      }
    }

    await writeFile(DIGEST_LOG_PATH, JSON.stringify(record, null, 2), "utf-8");

    return {
      content: [
        {
          type: "text",
          text: webhookUrl
            ? "Discord 채널로 메시지를 전송했습니다."
            : "DISCORD_WEBHOOK_URL이 설정되지 않아 dry-run으로 동작했습니다. " +
              "last-digest.json에 기록했습니다.",
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
