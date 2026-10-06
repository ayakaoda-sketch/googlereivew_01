import { mockDataSource } from "./mock/mock-source";
import type { DataSource } from "./source";

// Phase 2 swaps this for the Supabase-backed implementation.
export const dataSource: DataSource = mockDataSource;

export { latestReviewDate, resolveDate } from "./source";
