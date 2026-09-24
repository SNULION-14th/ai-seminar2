#!/usr/bin/env node
// GitHub MCP 서버 (커스텀 구현)
// - 공개 저장소의 열려 있는 Pull Request 목록을 조회하는 도구 하나만 제공하는
//   최소한의 MCP 서버입니다. GitHub REST API를 그대로 감싸서 MCP 프로토콜로 노출합니다.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "github-pr-reader-mcp",
  version: "1.0.0",
});

server.registerTool(
  "list_open_pull_requests",
  {
    title: "List open pull requests",
    description:
      "GitHub 공개 저장소에 열려 있는 Pull Request 목록을 최신 생성순으로 가져옵니다.",
    inputSchema: {
      owner: z.string().describe("저장소 소유자 (예: SNULION-14th)"),
      repo: z.string().describe("저장소 이름 (예: ai-seminar2)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(30)
        .default(5)
        .describe("가져올 최대 개수"),
    },
  },
  async ({ owner, repo, limit }) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&sort=created&direction=desc&per_page=${limit}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "week3-hw-mcp-digest-bot",
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        content: [
          { type: "text", text: `GitHub API 호출 실패 (${res.status}): ${text}` },
        ],
        isError: true,
      };
    }

    const prs = await res.json();
    const summary = prs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      author: pr.user?.login ?? "unknown",
      url: pr.html_url,
      createdAt: pr.created_at,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { owner, repo, count: summary.length, pullRequests: summary },
            null,
            2,
          ),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
