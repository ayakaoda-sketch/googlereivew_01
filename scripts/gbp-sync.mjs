// Runs the review collection on the local dev server (the same endpoint Vercel Cron calls).
//
//   npm run gbp:sync          (needs `npm run dev` running)

import { env, fail, ok, runScript } from "./lib/google.mjs";

async function main() {
  const secret = env("CRON_SECRET");
  if (!secret) fail("CRON_SECRET 이 비어 있습니다.", ".env.local 에 아무 긴 문자열을 넣으세요.");
  const base = env("SYNC_BASE_URL") ?? "http://localhost:3000";

  console.log(`리뷰 수집 중… (${base}) 처음 실행은 모든 과거 리뷰를 가져오므로 몇 분 걸릴 수 있습니다.`);
  let res;
  try {
    res = await fetch(`${base}/api/cron/sync`, { headers: { authorization: `Bearer ${secret}` } });
  } catch {
    fail("로컬 서버에 연결할 수 없습니다.", "다른 터미널에서 npm run dev 를 먼저 실행하세요.");
  }
  if (res.status === 401) fail("CRON_SECRET 이 서버와 다릅니다.", ".env.local 을 고쳤다면 npm run dev 를 다시 시작하세요.");
  if (!res.ok) fail(`수집 실패 (${res.status}): ${(await res.text()).slice(0, 300)}`);

  const result = await res.json();
  for (const s of result.stores) {
    if (s.error) console.error(`  ✘ ${s.store}: ${s.error}`);
    else ok(`${s.store}: 새 리뷰 ${s.added}건, 수정 ${s.updated}건 (Google 기준 총 ${s.googleTotal}건, ★ ${s.googleAverage?.toFixed(1) ?? "–"})`);
  }
  console.log(`\n완료 (${result.syncedAt})`);
}

runScript(main);
