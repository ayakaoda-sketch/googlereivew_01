// Shared helpers for the Google setup scripts (messages in Korean for operators).

export const ok = (msg) => console.log(`  ✔ ${msg}`);

export class CheckFailed extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }
}

// Throws instead of process.exit(): exiting with a fetch still open crashes Node on Windows.
export const fail = (msg, hint) => {
  throw new CheckFailed(msg, hint);
};

export const env = (name) => process.env[name]?.trim() || undefined;

/** Runs a script body, printing CheckFailed messages and setting a failing exit code. */
export function runScript(main) {
  main().catch((err) => {
    if (err instanceof CheckFailed) {
      console.error(`  ✘ ${err.message}`);
      if (err.hint) console.error(`    → ${err.hint}`);
    } else {
      console.error(`  ✘ 예상하지 못한 오류: ${err.message}`);
      console.error("    → 인터넷 연결을 확인한 뒤 다시 실행하세요.");
    }
    process.exitCode = 1;
  });
}

/** OAuth settings from .env.local; fails with a hint when sign-in has not been done. */
export function readOAuthEnv() {
  const oauth = {
    clientId: env("GOOGLE_OAUTH_CLIENT_ID"),
    clientSecret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
    refreshToken: env("GOOGLE_OAUTH_REFRESH_TOKEN"),
  };
  if (!oauth.clientId || !oauth.clientSecret) {
    fail(
      "로그인 정보가 없습니다.",
      "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET 를 넣고 npm run google:auth 를 실행하세요.",
    );
  }
  if (!oauth.refreshToken) {
    fail("GOOGLE_OAUTH_REFRESH_TOKEN 이 비어 있습니다.", "npm run google:auth 를 실행해 Google 로그인을 한 번 하세요.");
  }
  return oauth;
}

/** Exchanges the stored refresh token for a short-lived access token. */
export async function oauthAccessToken({ clientId, clientSecret, refreshToken }) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    fail(
      `인증 실패 (${body.error ?? res.status}: ${body.error_description ?? ""})`,
      body.error === "invalid_grant"
        ? "로그인이 만료되었거나 취소되었습니다. npm run google:auth 를 다시 실행하세요."
        : "GOOGLE_OAUTH_CLIENT_ID / SECRET 이 Google Cloud 의 값과 같은지 확인하세요.",
    );
  }
  return body.access_token;
}
