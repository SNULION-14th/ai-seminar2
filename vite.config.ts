import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

type OAuthToken = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
};

function json(
  response: {
    statusCode: number;
    setHeader: (key: string, value: string) => void;
    end: (body: string) => void;
  },
  status: number,
  body: unknown,
) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

function calendarApiPlugin(env: Record<string, string>): Plugin {
  const projectRoot = process.cwd();
  const tokenPath = resolve(projectRoot, ".calendar-token.json");
  const origin = env.APP_ORIGIN || "http://localhost:";
  const redirectUri = `${origin}/api/calendar/callback`;
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const githubToken = env.GITHUB_TOKEN;

  const getToken = (): OAuthToken | null =>
    existsSync(tokenPath)
      ? (JSON.parse(readFileSync(tokenPath, "utf8")) as OAuthToken)
      : null;
  const saveToken = (token: OAuthToken) =>
    writeFileSync(tokenPath, JSON.stringify(token, null, 2), { mode: 0o600 });

  async function accessToken() {
    const token = getToken();
    if (!token) throw new Error("Google Calendar가 아직 연결되지 않았습니다.");
    if (token.expires_at > Date.now() + 60_000) return token.access_token;
    if (!token.refresh_token || !clientId || !clientSecret)
      throw new Error("Google Calendar 인증을 다시 진행해 주세요.");
    const refreshed = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: token.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    if (!refreshed.ok)
      throw new Error("Google Calendar 토큰을 갱신하지 못했습니다.");
    const data = (await refreshed.json()) as {
      access_token: string;
      expires_in: number;
    };
    saveToken({
      ...token,
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
    });
    return data.access_token;
  }

  return {
    name: "calendar-and-github-api",
    configureServer(server) {
      server.middlewares.use("/api", async (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", origin);
        try {
          if (requestUrl.pathname === "/integrations/status") {
            return json(response, 200, {
              calendar: Boolean(getToken()),
              googleConfigured: Boolean(clientId && clientSecret),
              github: true,
            });
          }

          if (requestUrl.pathname === "/calendar/auth") {
            if (!clientId || !clientSecret)
              return json(response, 400, {
                message:
                  ".env.local에 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 입력해 주세요.",
              });
            const state = randomBytes(16).toString("hex");
            response.setHeader(
              "Set-Cookie",
              `calendar_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
            );
            const authorize = new URL(
              "https://accounts.google.com/o/oauth2/v2/auth",
            );
            authorize.search = new URLSearchParams({
              client_id: clientId,
              redirect_uri: redirectUri,
              response_type: "code",
              access_type: "offline",
              prompt: "consent",
              scope:
                "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy",
            }).toString();
            response.statusCode = 302;
            response.setHeader(
              "Location",
              `${authorize.toString()}&state=${state}`,
            );
            return response.end();
          }

          if (requestUrl.pathname === "/calendar/callback") {
            const code = requestUrl.searchParams.get("code");
            if (!code || !clientId || !clientSecret)
              return json(response, 400, {
                message: "OAuth 인증 정보를 확인해 주세요.",
              });
            const exchange = await fetch(
              "https://oauth2.googleapis.com/token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  code,
                  client_id: clientId,
                  client_secret: clientSecret,
                  redirect_uri: redirectUri,
                  grant_type: "authorization_code",
                }),
              },
            );
            if (!exchange.ok)
              return json(response, 400, {
                message: "Google Calendar 연결에 실패했습니다.",
              });
            const data = (await exchange.json()) as {
              access_token: string;
              refresh_token?: string;
              expires_in: number;
            };
            saveToken({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expires_at: Date.now() + data.expires_in * 1000,
            });
            response.statusCode = 302;
            response.setHeader("Location", "/?calendar=connected");
            return response.end();
          }

          if (requestUrl.pathname === "/calendar/availability") {
            const now = new Date();
            const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const token = await accessToken();
            const result = await fetch(
              "https://www.googleapis.com/calendar/v3/freeBusy",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  timeMin: now.toISOString(),
                  timeMax: end.toISOString(),
                  items: [{ id: "primary" }],
                }),
              },
            );
            if (!result.ok)
              throw new Error("캘린더의 빈 시간을 불러오지 못했습니다.");
            const data = (await result.json()) as {
              calendars: {
                primary?: { busy?: Array<{ start: string; end: string }> };
              };
            };
            return json(response, 200, {
              busy: data.calendars.primary?.busy ?? [],
            });
          }

          if (
            requestUrl.pathname === "/calendar/events" &&
            request.method === "POST"
          ) {
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(Buffer.from(chunk));
            const event = JSON.parse(Buffer.concat(chunks).toString()) as {
              title: string;
              start: string;
              end: string;
            };
            const token = await accessToken();
            const created = await fetch(
              "https://www.googleapis.com/calendar/v3/calendars/primary/events",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  summary: event.title,
                  start: { dateTime: event.start, timeZone: "Asia/Seoul" },
                  end: { dateTime: event.end, timeZone: "Asia/Seoul" },
                }),
              },
            );
            if (!created.ok) throw new Error("일정을 생성하지 못했습니다.");
            return json(response, 201, await created.json());
          }

          if (requestUrl.pathname === "/github/context") {
            const headers = {
              Accept: "application/vnd.github+json",
              ...(githubToken
                ? { Authorization: `Bearer ${githubToken}` }
                : {}),
            };
            const data = await fetch(
              "https://api.github.com/repos/SNULION-14th/ai-seminar2/issues?state=open&per_page=5",
              { headers },
            ).then(async (result) => {
              if (!result.ok)
                throw new Error("GitHub 작업을 불러오지 못했습니다.");
              return result.json() as Promise<
                Array<{ number: number; title: string; pull_request?: unknown }>
              >;
            });
            return json(response, 200, {
              items: data.map((item) => ({
                number: item.number,
                title: item.title,
                type: item.pull_request ? "PR" : "Issue",
              })),
            });
          }
          return next();
        } catch (error) {
          return json(response, 500, {
            message:
              error instanceof Error
                ? error.message
                : "요청을 처리하지 못했습니다.",
          });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return { plugins: [react(), calendarApiPlugin(env)] };
});
