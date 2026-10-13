import { googleFetch } from "./auth";

const STARS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const;

export interface GbpReview {
  reviewId: string;
  reviewer?: { displayName?: string };
  starRating: keyof typeof STARS | "STAR_RATING_UNSPECIFIED";
  comment?: string;
  createTime: string;
  updateTime: string;
}

interface ReviewPage {
  reviews?: GbpReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
}

export function starsOf(review: GbpReview): number | null {
  return review.starRating in STARS ? STARS[review.starRating as keyof typeof STARS] : null;
}

/**
 * Reviews of one location, most recently updated first, one page at a time.
 * `location` is "accounts/{a}/locations/{l}" (the stores tab's google_location_id).
 */
export async function* reviewPages(location: string): AsyncGenerator<ReviewPage> {
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "50", orderBy: "updateTime desc" });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await googleFetch<ReviewPage>(`https://mybusiness.googleapis.com/v4/${location}/reviews?${params}`);
    yield page;
    pageToken = page.nextPageToken;
  } while (pageToken);
}
