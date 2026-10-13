// Verifies the Google Sheets connection configured in .env.local.
//
//   npm run sheets:check            check credentials, access and tab layout
//   npm run sheets:check -- --init  also create missing tabs (with header rows)
//                                   and fill an empty `stores` tab with the
//                                   current store list
//
// Messages are in Korean for the dashboard operators who run this.

import { createSign } from "node:crypto";
import { TABS } from "../src/lib/data/sheets/schema.ts";
import { MOCK_STORES } from "../src/lib/data/mock/stores.ts";
import { env, fail, oauthAccessToken, ok, readOAuthEnv, runScript } from "./lib/google.mjs";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const init = process.argv.includes("--init");

/**
 * Two ways to sign in: a service account key (if the organization allows key
 * files), or the OAuth refresh token from `npm run google:auth`.
 */
function readEnv() {
  const id = env("GOOGLE_SHEETS_SPREADSHEET_ID");
  const email = env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  // Accept the key with literal "\n" sequences (one-line .env value) or real newlines.
  const key = env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, "\n");

  console.log("1) .env.local 값 확인");
  if (!id) fail("GOOGLE_SHEETS_SPREADSHEET_ID 가 비어 있습니다.", "시트 URL의 /d/ 와 /edit 사이 문자열을 넣으세요.");
  ok(`스프레드시트 ID: ${id}`);

  if (email || key) {
    if (!email) fail("GOOGLE_SERVICE_ACCOUNT_EMAIL 이 비어 있습니다.", "JSON 키 파일의 client_email 값을 넣으세요.");
    if (!key?.startsWith("-----BEGIN PRIVATE KEY-----")) {
      fail(
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY 형식이 올바르지 않습니다.",
        'JSON 키 파일의 private_key 값을 큰따옴표 안에 한 줄로 붙여 넣으세요 ("-----BEGIN PRIVATE KEY-----\\n...").',
      );
    }
    ok(`인증 방식: 서비스 계정 (${email})`);
    return { id, auth: { kind: "service", email, key } };
  }

  const oauth = readOAuthEnv();
  ok("인증 방식: Google 계정 로그인 (OAuth)");
  return { id, auth: { kind: "oauth", ...oauth } };
}

async function getAccessToken(auth) {
  console.log("2) Google 인증");
  if (auth.kind === "service") return serviceAccountToken(auth);
  const token = await oauthAccessToken(auth);
  ok("Google 계정으로 로그인했습니다.");
  return token;
}

async function serviceAccountToken({ email, key }) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: email,
    scope: SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;

  let signature;
  try {
    signature = createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");
  } catch {
    return fail("private key 를 읽을 수 없습니다.", "키를 다시 복사해 붙여 넣으세요. 앞뒤의 BEGIN/END 줄까지 포함해야 합니다.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    fail(
      `인증 실패 (${body.error ?? res.status}: ${body.error_description ?? ""})`,
      "서비스 계정 이메일과 private key 가 같은 JSON 키 파일에서 나온 값인지, 키가 삭제되지 않았는지 확인하세요.",
    );
  }
  ok("서비스 계정으로 로그인했습니다.");
  return body.access_token;
}

async function sheetsApi(token, id, path, init) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...init?.headers },
  });
  const body = await res.json();
  if (res.ok) return body;

  const message = body.error?.message ?? "";
  if (/has not been used|is disabled/i.test(message)) {
    fail("Google Sheets API 가 꺼져 있습니다.", "Google Cloud 콘솔 → API 및 서비스 → 라이브러리 → Google Sheets API → 사용 설정.");
  }
  if (res.status === 403) {
    fail(
      "스프레드시트에 접근할 권한이 없습니다.",
      "로그인한 계정(또는 서비스 계정 이메일)이 시트의 [공유] 에 '편집자' 로 들어 있는지 확인하세요.",
    );
  }
  if (res.status === 404) {
    fail("스프레드시트를 찾을 수 없습니다.", "GOOGLE_SHEETS_SPREADSHEET_ID 를 다시 확인하세요.");
  }
  fail(`Sheets API 오류 (${res.status}): ${message}`);
}

function storeRows() {
  return [...MOCK_STORES]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => [
      s.id, s.slug, s.brand, s.storeName, s.shortName, s.googleLocationId ?? "", s.address,
      s.active ? "TRUE" : "FALSE", s.sortOrder,
    ]);
}

async function main() {
  const { id, auth } = readEnv();
  const token = await getAccessToken(auth);

  console.log("3) 스프레드시트 접근");
  const meta = await sheetsApi(token, id, "?fields=properties.title,sheets.properties.title");
  ok(`"${meta.properties.title}" 을(를) 열었습니다.`);

  console.log("4) 탭 구성");
  const existing = new Set(meta.sheets.map((s) => s.properties.title));
  const missing = Object.keys(TABS).filter((t) => !existing.has(t));

  if (missing.length > 0 && !init) {
    fail(
      `없는 탭: ${missing.join(", ")}`,
      "npm run sheets:check -- --init 을 실행하면 탭과 머리글을 자동으로 만듭니다.",
    );
  }
  if (missing.length > 0) {
    await sheetsApi(token, id, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: missing.map((title) => ({ addSheet: { properties: { title } } })) }),
    });
    await sheetsApi(token, id, "/values:batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: missing.map((t) => ({ range: `${t}!A1`, values: [TABS[t]] })),
      }),
    });
    ok(`탭을 만들었습니다: ${missing.join(", ")}`);
  }

  const ranges = Object.keys(TABS).map((t) => `ranges=${encodeURIComponent(`${t}!A1:Z`)}`).join("&");
  const { valueRanges } = await sheetsApi(token, id, `/values:batchGet?${ranges}`);

  for (const [i, [tab, header]] of Object.entries(TABS).entries()) {
    const rows = valueRanges[i].values ?? [];
    const actual = rows[0] ?? [];
    const wrong = header.filter((h, col) => actual[col] !== h);
    // A header that only lacks columns added later (at the end) can be extended in place.
    const onlyNewColumns = actual.length < header.length && actual.every((h, col) => h === header[col]);
    if (wrong.length > 0 && onlyNewColumns && init) {
      await sheetsApi(token, id, `/values/${encodeURIComponent(`${tab}!A1`)}?valueInputOption=RAW`, {
        method: "PUT",
        body: JSON.stringify({ values: [header] }),
      });
      ok(`${tab}: 새 열을 머리글에 추가했습니다 (${header.slice(actual.length).join(", ")})`);
    } else if (wrong.length > 0) {
      fail(
        `"${tab}" 탭의 머리글(1행)이 다릅니다.`,
        onlyNewColumns
          ? "npm run sheets:check -- --init 을 실행하면 새 열을 자동으로 추가합니다."
          : `1행을 A열부터 정확히 이렇게 맞춰 주세요: ${header.join(" | ")}`,
      );
    } else {
      ok(`${tab}: 머리글 정상, 데이터 ${Math.max(rows.length - 1, 0)}행`);
    }
  }

  const storeCount = (valueRanges[0].values ?? []).length - 1;
  if (storeCount <= 0 && init) {
    const rows = storeRows();
    await sheetsApi(token, id, `/values/${encodeURIComponent("stores!A2")}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: rows }),
    });
    ok(`stores 탭에 매장 ${rows.length}개를 채웠습니다. google_location_id 는 나중에 채웁니다.`);
  } else if (storeCount <= 0) {
    console.log("  ! stores 탭이 비어 있습니다. --init 으로 현재 매장 목록을 채울 수 있습니다.");
  }

  console.log("\n연결 성공. 스프레드시트를 사용할 준비가 됐습니다.");
}

runScript(main);
