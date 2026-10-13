// Lists the Business Profile locations the signed-in account manages, checks
// that their reviews can be read, and matches them to rows of the `stores` tab.
//
//   npm run gbp:locations            show locations and the suggested matches
//   npm run gbp:locations -- --save  also write google_location_id into `stores`
//                                    (only for stores with exactly one match)

import { env, fail, oauthAccessToken, ok, readOAuthEnv, runScript } from "./lib/google.mjs";

const save = process.argv.includes("--save");

const API_NAMES = {
  "mybusinessaccountmanagement.googleapis.com": "My Business Account Management API",
  "mybusinessbusinessinformation.googleapis.com": "My Business Business Information API",
  "mybusiness.googleapis.com": "Google My Business API",
  "sheets.googleapis.com": "Google Sheets API",
};

async function api(token, url, init) {
  const res = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) return body;

  const apiName = API_NAMES[new URL(url).host] ?? new URL(url).host;
  const message = body.error?.message ?? "";
  if (/has not been used|is disabled/i.test(message)) {
    fail(`${apiName} 가 꺼져 있습니다.`, `Google Cloud 콘솔 → API 및 서비스 → 라이브러리 → "${apiName}" → 사용 설정.`);
  }
  if (res.status === 429 || /quota/i.test(message)) {
    fail(
      `${apiName} 호출 한도에 걸렸습니다.`,
      "승인 직후라면 한도가 아직 0일 수 있습니다. API 및 서비스 → 할당량에서 값이 0보다 큰지 확인하세요.",
    );
  }
  if (res.status === 403) {
    fail(
      `${apiName} 접근 권한이 없습니다 (${message}).`,
      "로그인한 계정이 매장 Business Profile 의 소유자/관리자인지 확인하세요. 권한 동의를 다시 하려면 npm run google:auth.",
    );
  }
  fail(`${apiName} 오류 (${res.status}): ${message}`);
}

async function listAll(token, url, key) {
  const items = [];
  let pageToken;
  do {
    const page = await api(token, pageToken ? `${url}&pageToken=${pageToken}` : url);
    items.push(...(page[key] ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return items;
}

const words = (s) => s.toLowerCase().normalize("NFKD").match(/[a-z0-9]+/g) ?? [];

/** A store matches a location when every word of its short name appears in the location's title or address. */
function matches(store, location) {
  const haystack = new Set(words(`${location.title} ${location.address}`));
  return words(store.shortName).every((w) => haystack.has(w));
}

async function main() {
  console.log("1) Google 인증");
  const token = await oauthAccessToken(readOAuthEnv());
  ok("Google 계정으로 로그인했습니다.");

  console.log("2) Business Profile 계정");
  const accounts = await listAll(
    token,
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=20",
    "accounts",
  );
  if (accounts.length === 0) {
    fail("이 Google 계정으로 관리하는 Business Profile 이 없습니다.", "매장 프로필의 소유자/관리자 계정으로 npm run google:auth 를 다시 하세요.");
  }
  for (const a of accounts) ok(`${a.accountName} (${a.name}, ${a.type})`);

  console.log("3) 매장 위치와 리뷰 확인");
  const locations = [];
  for (const account of accounts) {
    const list = await listAll(
      token,
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?pageSize=100&readMask=name,title,storefrontAddress`,
      "locations",
    );
    for (const loc of list) {
      const addr = loc.storefrontAddress;
      const resource = `${account.name}/${loc.name}`; // accounts/{a}/locations/{l}, as the reviews API expects
      const summary = await api(token, `https://mybusiness.googleapis.com/v4/${resource}/reviews?pageSize=1`);
      locations.push({
        resource,
        title: loc.title,
        address: [...(addr?.addressLines ?? []), addr?.locality].filter(Boolean).join(", "),
        avg: summary.averageRating,
        total: summary.totalReviewCount ?? 0,
      });
    }
  }
  if (locations.length === 0) fail("등록된 매장 위치가 없습니다.");
  for (const l of locations) {
    ok(`${l.title} — ${l.address || "주소 없음"}`);
    console.log(`      ${l.resource} · ★ ${l.avg?.toFixed(2) ?? "–"} · 리뷰 ${l.total.toLocaleString("en-US")}건`);
  }

  console.log("4) stores 탭과 연결");
  const sheetId = env("GOOGLE_SHEETS_SPREADSHEET_ID");
  if (!sheetId) fail("GOOGLE_SHEETS_SPREADSHEET_ID 가 비어 있습니다.");
  const sheet = await api(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent("stores!A1:I")}`,
  );
  const [header = [], ...rows] = sheet.values ?? [];
  const col = (name) => header.indexOf(name);
  if (col("short_name") < 0 || col("google_location_id") < 0) {
    fail("stores 탭의 머리글이 다릅니다.", "npm run sheets:check 로 탭 구성을 확인하세요.");
  }

  const updates = [];
  const used = new Set();
  rows.forEach((row, i) => {
    const store = { shortName: row[col("short_name")] ?? "", current: row[col("google_location_id")] ?? "" };
    const found = locations.filter((l) => matches(store, l));
    if (found.length === 1) {
      const l = found[0];
      used.add(l.resource);
      const same = store.current === l.resource;
      ok(`${store.shortName} → ${l.title} (${l.resource})${same ? " · 이미 저장됨" : ""}`);
      if (!same) updates.push({ range: `stores!${String.fromCharCode(65 + col("google_location_id"))}${i + 2}`, values: [[l.resource]] });
    } else if (found.length === 0) {
      console.log(`  ! ${store.shortName}: 일치하는 위치가 없습니다. stores 탭에 직접 입력해 주세요.`);
    } else {
      console.log(`  ! ${store.shortName}: 후보가 여러 개입니다 (${found.map((l) => l.title).join(" / ")}). 직접 입력해 주세요.`);
    }
  });
  for (const l of locations.filter((l) => !used.has(l.resource))) {
    console.log(`  · 연결되지 않은 위치: ${l.title} (${l.resource})`);
  }

  if (updates.length === 0) {
    console.log("\n저장할 변경 사항이 없습니다.");
  } else if (!save) {
    console.log(`\n${updates.length}개 매장의 위치 ID 를 저장하려면: npm run gbp:locations -- --save`);
  } else {
    await api(token, `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "RAW", data: updates }),
    });
    console.log(`\n${updates.length}개 매장의 google_location_id 를 stores 탭에 저장했습니다.`);
  }
}

runScript(main);
