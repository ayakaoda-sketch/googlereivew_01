// One-time Google sign-in that stores a refresh token in .env.local.
//
//   npm run google:auth
//
// Opens the browser, you sign in with the account that owns the spreadsheet
// and manages the Business Profile locations, and the resulting refresh token
// is written to GOOGLE_OAUTH_REFRESH_TOKEN. Uses an OAuth "Desktop app" client,
// so no service account key file is needed.

import { exec } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

const ENV_FILE = ".env.local";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/business.manage",
];

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
if (!clientId || !clientSecret) {
  console.error("  ✘ .env.local 에 GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET 를 먼저 넣으세요.");
  process.exitCode = 1;
} else {
  run();
}

function saveRefreshToken(token) {
  const text = readFileSync(ENV_FILE, "utf8");
  const line = `GOOGLE_OAUTH_REFRESH_TOKEN=${token}`;
  const next = /^GOOGLE_OAUTH_REFRESH_TOKEN=.*$/m.test(text)
    ? text.replace(/^GOOGLE_OAUTH_REFRESH_TOKEN=.*$/m, line)
    : `${text.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_FILE, next);
}

function run() {
  // PKCE: proves the code exchange comes from this same process.
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("hex");

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.pathname !== "/callback") return res.writeHead(404).end();

    const reply = (msg) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<p style="font:16px sans-serif;padding:24px">${msg}</p>`);
      server.close();
    };

    if (url.searchParams.get("state") !== state) return reply("잘못된 요청입니다. 터미널에서 다시 실행하세요.");
    const error = url.searchParams.get("error");
    if (error) {
      console.error(`  ✘ 로그인이 취소되었거나 거부되었습니다 (${error}).`);
      process.exitCode = 1;
      return reply("로그인이 완료되지 않았습니다. 터미널을 확인하세요.");
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: url.searchParams.get("code"),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
    });
    const body = await tokenRes.json();
    if (!tokenRes.ok || !body.refresh_token) {
      console.error(`  ✘ 토큰 발급 실패: ${body.error_description ?? body.error ?? "refresh token 없음"}`);
      process.exitCode = 1;
      return reply("토큰 발급에 실패했습니다. 터미널을 확인하세요.");
    }

    saveRefreshToken(body.refresh_token);
    console.log("  ✔ 로그인 완료. GOOGLE_OAUTH_REFRESH_TOKEN 을 .env.local 에 저장했습니다.");
    console.log("    다음: npm run sheets:check");
    reply("로그인 완료! 이 창을 닫고 터미널로 돌아가세요.");
  });

  let redirectUri;
  server.listen(0, "127.0.0.1", () => {
    redirectUri = `http://127.0.0.1:${server.address().port}/callback`;
    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      });

    console.log("브라우저에서 Google 로그인 창을 엽니다.");
    console.log("창이 열리지 않으면 아래 주소를 복사해 브라우저에 붙여 넣으세요:\n");
    console.log(authUrl + "\n");
    const opener =
      process.platform === "win32" ? `start "" "${authUrl}"` : process.platform === "darwin" ? `open "${authUrl}"` : `xdg-open "${authUrl}"`;
    exec(opener);
  });
}
