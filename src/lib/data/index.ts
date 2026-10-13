import { mockDataSource } from "./mock/mock-source";
import { sheetsDataSource } from "./sheets/sheets-source";
import type { DataSource } from "./source";

// DATA_SOURCE=sheets reads the Google spreadsheet; anything else uses built-in sample data.
export const dataSource: DataSource = process.env.DATA_SOURCE === "sheets" ? sheetsDataSource : mockDataSource;

export { MAX_RANGE_DAYS, latestReviewDate, resolveDate, resolveRange } from "./source";
