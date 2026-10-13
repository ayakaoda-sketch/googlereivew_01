import { syncReviews } from "@/lib/sync";

// The first run backfills every past review, which takes a while.
export const maxDuration = 300;

/** Daily review collection. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await syncReviews());
}
