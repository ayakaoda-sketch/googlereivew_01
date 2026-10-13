// Google access for the server, using the OAuth refresh token from
// `npm run google:auth` (service account keys are blocked by the org policy).

let cached: { token: string; expiresAt: number } | null = null;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set (see .env.example)`);
  return value;
}

export async function googleAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: required("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: required("GOOGLE_OAUTH_CLIENT_SECRET"),
      refresh_token: required("GOOGLE_OAUTH_REFRESH_TOKEN"),
    }),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Google sign-in failed (${body.error}): run \`npm run google:auth\` again`);
  }
  cached = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

/** Authenticated JSON request to a Google API; throws with Google's message on failure. */
export async function googleFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${await googleAccessToken()}`,
      "content-type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${new URL(url).host} ${res.status}: ${body.error?.message ?? res.statusText}`);
  }
  return body as T;
}
